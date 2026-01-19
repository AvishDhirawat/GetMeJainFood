package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.uber.org/zap"

	"jainfood/internal/auth"
	"jainfood/internal/chat"
	"jainfood/internal/db"
	"jainfood/internal/events"
	"jainfood/internal/media"
	"jainfood/internal/menus"
	"jainfood/internal/middleware"
	"jainfood/internal/monitoring"
	"jainfood/internal/orders"
	"jainfood/internal/providers"
	"jainfood/internal/redisclient"
	"jainfood/internal/search"
	"jainfood/internal/users"
	"jainfood/internal/util"
)

func main() {
	// Load environment variables
	_ = godotenv.Load()
	cfg := util.Load()

	// Initialize structured logger
	logger, err := zap.NewProduction()
	if err != nil {
		log.Fatalf("failed to create logger: %v", err)
	}
	defer func() {
		// Ignore sync error as it's common with stdout/stderr
		_ = logger.Sync()
	}()

	// Connect to database
	ctx := context.Background()
	if err := db.Connect(ctx, cfg.DatabaseURL); err != nil {
		logger.Fatal("db connect failed", zap.Error(err))
	}
	defer db.Close()

	// Connect to Redis
	redisclient.Connect(cfg.RedisAddr)

	// Initialize media client (optional - for object storage)
	var mediaClient *media.Client
	if cfg.S3Endpoint != "" {
		mediaClient, err = media.NewClient(media.StorageConfig{
			Endpoint:        cfg.S3Endpoint,
			Region:          cfg.S3Region,
			AccessKeyID:     cfg.S3AccessKey,
			SecretAccessKey: cfg.S3SecretKey,
			Bucket:          cfg.S3Bucket,
			UsePathStyle:    true,
		})
		if err != nil {
			logger.Warn("media client init failed", zap.Error(err))
		}
	}

	// Initialize chat hub
	chatHub := chat.NewHub(logger)
	go chatHub.Run()

	// Setup Gin router
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(monitoring.MetricsMiddleware())
	r.Use(monitoring.RequestLogger(logger))
	r.Use(middleware.CORSMiddleware())
	r.Use(middleware.SecureHeadersMiddleware())

	// App version
	appVersion := os.Getenv("APP_VERSION")
	if appVersion == "" {
		appVersion = "1.0.0-dev"
	}

	// Health and monitoring endpoints
	r.GET("/health", monitoring.HealthHandler(appVersion))
	r.GET("/metrics", monitoring.MetricsHandler())
	r.GET("/debug", monitoring.DebugHandler())
	r.GET("/ready", func(c *gin.Context) {
		// Check database
		if err := db.Ping(ctx); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"ready": false, "error": "database unavailable"})
			return
		}
		// Check Redis
		if err := redisclient.Ping(ctx); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"ready": false, "error": "redis unavailable"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"ready": true})
	})
	r.GET("/live", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"alive": true})
	})

	// API v1 routes
	v1 := r.Group("/v1")
	{
		// ==================== AUTH ROUTES ====================
		authGroup := v1.Group("/auth")
		{
			// Rate limit OTP endpoints
			authGroup.Use(middleware.EndpointRateLimiter(5, time.Minute))

			// Send OTP
			authGroup.POST("/send-otp", func(c *gin.Context) {
				var body struct {
					Phone string `json:"phone" binding:"required"`
				}
				if err := c.ShouldBindJSON(&body); err != nil {
					c.JSON(400, gin.H{"error": err.Error()})
					return
				}

				otp, err := auth.GenerateOTP()
				if err != nil {
					logger.Error("otp generation failed", zap.Error(err))
					c.JSON(500, gin.H{"error": "otp generation failed"})
					return
				}

				hash := auth.HashOTP(cfg.OtpSecret, otp)
				key := "otp:" + body.Phone
				if err := auth.StoreOTP(ctx, key, hash, 10*time.Minute); err != nil {
					logger.Error("redis set failed", zap.Error(err))
					c.JSON(500, gin.H{"error": "failed to store otp"})
					return
				}

				// TODO: Integrate SMS gateway for production
				// For development, return OTP in response (REMOVE in production)
				c.JSON(200, gin.H{"message": "otp_sent", "otp": otp})
			})

			// Verify OTP and issue JWT
			authGroup.POST("/verify-otp", func(c *gin.Context) {
				var body struct {
					Phone string `json:"phone" binding:"required"`
					OTP   string `json:"otp" binding:"required"`
					Role  string `json:"role"` // Optional: default to "buyer"
				}
				if err := c.ShouldBindJSON(&body); err != nil {
					c.JSON(400, gin.H{"error": err.Error()})
					return
				}

				key := "otp:" + body.Phone
				stored, err := auth.GetOTP(ctx, key)
				if err != nil {
					c.JSON(400, gin.H{"error": "otp expired or not found"})
					return
				}

				if stored != auth.HashOTP(cfg.OtpSecret, body.OTP) {
					c.JSON(401, gin.H{"error": "invalid otp"})
					return
				}

				_ = auth.DeleteOTP(ctx, key)

				// Get or create user
				role := body.Role
				if role == "" {
					role = "buyer"
				}
				user, isNew, err := users.GetOrCreateUser(ctx, body.Phone, role)
				if err != nil {
					logger.Error("user lookup/create failed", zap.Error(err))
					c.JSON(500, gin.H{"error": "user creation failed"})
					return
				}

				// Generate JWT
				token, err := middleware.GenerateJWT(cfg.JwtSecret, user.ID, user.Phone, user.Role)
				if err != nil {
					logger.Error("jwt generation failed", zap.Error(err))
					c.JSON(500, gin.H{"error": "token generation failed"})
					return
				}

				// Log event
				_ = events.LogEvent(ctx, "user", user.ID, events.EventUserCreated, map[string]interface{}{
					"phone":  user.Phone,
					"is_new": isNew,
				})

				c.JSON(200, gin.H{
					"message": "verified",
					"token":   token,
					"user_id": user.ID,
					"is_new":  isNew,
				})
			})
		}

		// ==================== USER ROUTES ====================
		userGroup := v1.Group("/users")
		userGroup.Use(middleware.AuthMiddleware(cfg.JwtSecret))
		{
			// Get current user profile
			userGroup.GET("/me", func(c *gin.Context) {
				userID, _ := middleware.GetUserIDFromContext(c)
				user, err := users.GetUserByID(ctx, userID)
				if err != nil {
					c.JSON(404, gin.H{"error": "user not found"})
					return
				}
				c.JSON(200, user)
			})

			// Update user profile
			userGroup.PUT("/me", func(c *gin.Context) {
				userID, _ := middleware.GetUserIDFromContext(c)
				var body struct {
					Name        string                 `json:"name"`
					Email       string                 `json:"email"`
					Preferences map[string]interface{} `json:"preferences"`
				}
				if err := c.ShouldBindJSON(&body); err != nil {
					c.JSON(400, gin.H{"error": err.Error()})
					return
				}

				if err := users.UpdateUser(ctx, userID, body.Name, body.Email, body.Preferences); err != nil {
					c.JSON(500, gin.H{"error": "update failed"})
					return
				}
				c.JSON(200, gin.H{"message": "updated"})
			})

			// Delete user (GDPR compliance)
			userGroup.DELETE("/me", func(c *gin.Context) {
				userID, _ := middleware.GetUserIDFromContext(c)
				if err := users.DeleteUser(ctx, userID); err != nil {
					c.JSON(500, gin.H{"error": "deletion failed"})
					return
				}
				c.JSON(200, gin.H{"message": "deleted"})
			})
		}

		// ==================== PROVIDER ROUTES ====================
		providerGroup := v1.Group("/providers")
		{
			// Public: Get provider by ID
			providerGroup.GET("/:id", func(c *gin.Context) {
				id := c.Param("id")
				provider, err := providers.GetProvider(ctx, id)
				if err != nil {
					c.JSON(404, gin.H{"error": "provider not found"})
					return
				}
				c.JSON(200, provider)
			})

			// Public: List providers
			providerGroup.GET("", func(c *gin.Context) {
				limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
				offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
				list, err := providers.ListProviders(ctx, limit, offset)
				if err != nil {
					c.JSON(500, gin.H{"error": "failed to list providers"})
					return
				}
				c.JSON(200, list)
			})

			// Protected: Create provider
			providerGroup.POST("", middleware.AuthMiddleware(cfg.JwtSecret), func(c *gin.Context) {
				userID, _ := middleware.GetUserIDFromContext(c)
				var body struct {
					BusinessName string   `json:"business_name" binding:"required"`
					Address      string   `json:"address" binding:"required"`
					Lat          float64  `json:"lat" binding:"required"`
					Lng          float64  `json:"lng" binding:"required"`
					Tags         []string `json:"tags"`
				}
				if err := c.ShouldBindJSON(&body); err != nil {
					c.JSON(400, gin.H{"error": err.Error()})
					return
				}

				provider, err := providers.CreateProvider(ctx, userID, body.BusinessName, body.Address, body.Lat, body.Lng, body.Tags)
				if err != nil {
					logger.Error("provider creation failed", zap.Error(err))
					c.JSON(500, gin.H{"error": "provider creation failed"})
					return
				}

				_ = events.LogEvent(ctx, "provider", provider.ID, events.EventProviderCreated, map[string]interface{}{
					"user_id":       userID,
					"business_name": body.BusinessName,
				})

				c.JSON(201, provider)
			})

			// Protected: Update provider
			providerGroup.PUT("/:id", middleware.AuthMiddleware(cfg.JwtSecret), func(c *gin.Context) {
				providerID := c.Param("id")
				var body struct {
					BusinessName string   `json:"business_name"`
					Address      string   `json:"address"`
					Lat          float64  `json:"lat"`
					Lng          float64  `json:"lng"`
					Tags         []string `json:"tags"`
				}
				if err := c.ShouldBindJSON(&body); err != nil {
					c.JSON(400, gin.H{"error": err.Error()})
					return
				}

				if err := providers.UpdateProvider(ctx, providerID, body.BusinessName, body.Address, body.Lat, body.Lng, body.Tags); err != nil {
					c.JSON(500, gin.H{"error": "update failed"})
					return
				}
				c.JSON(200, gin.H{"message": "updated"})
			})

			// Admin: Verify provider
			providerGroup.POST("/:id/verify", middleware.AuthMiddleware(cfg.JwtSecret), middleware.RoleMiddleware("admin"), func(c *gin.Context) {
				providerID := c.Param("id")
				var body struct {
					Verified bool `json:"verified"`
				}
				if err := c.ShouldBindJSON(&body); err != nil {
					c.JSON(400, gin.H{"error": err.Error()})
					return
				}

				if err := providers.VerifyProvider(ctx, providerID, body.Verified); err != nil {
					c.JSON(500, gin.H{"error": "verification update failed"})
					return
				}

				_ = events.LogEvent(ctx, "provider", providerID, events.EventProviderVerified, map[string]interface{}{
					"verified": body.Verified,
				})

				c.JSON(200, gin.H{"message": "verification status updated"})
			})
		}

		// ==================== MENU ROUTES ====================
		menuGroup := v1.Group("/menus")
		{
			// Public: Get menu by ID
			menuGroup.GET("/:id", func(c *gin.Context) {
				id := c.Param("id")
				menu, err := menus.GetMenu(ctx, id)
				if err != nil {
					c.JSON(404, gin.H{"error": "menu not found"})
					return
				}
				c.JSON(200, menu)
			})

			// Public: Get menus by provider
			menuGroup.GET("/provider/:provider_id", func(c *gin.Context) {
				providerID := c.Param("provider_id")
				list, err := menus.GetMenusByProvider(ctx, providerID)
				if err != nil {
					c.JSON(500, gin.H{"error": "failed to get menus"})
					return
				}
				c.JSON(200, list)
			})

			// Protected: Create menu
			menuGroup.POST("", middleware.AuthMiddleware(cfg.JwtSecret), middleware.RoleMiddleware("provider", "admin"), func(c *gin.Context) {
				var body struct {
					ProviderID  string `json:"provider_id" binding:"required"`
					Name        string `json:"name" binding:"required"`
					Description string `json:"description"`
				}
				if err := c.ShouldBindJSON(&body); err != nil {
					c.JSON(400, gin.H{"error": err.Error()})
					return
				}

				menu, err := menus.CreateMenu(ctx, body.ProviderID, body.Name, body.Description)
				if err != nil {
					c.JSON(500, gin.H{"error": "menu creation failed"})
					return
				}

				_ = events.LogEvent(ctx, "menu", menu.ID, events.EventMenuCreated, map[string]interface{}{
					"provider_id": body.ProviderID,
					"name":        body.Name,
				})

				c.JSON(201, menu)
			})

			// Protected: Update menu
			menuGroup.PUT("/:id", middleware.AuthMiddleware(cfg.JwtSecret), middleware.RoleMiddleware("provider", "admin"), func(c *gin.Context) {
				menuID := c.Param("id")
				var body struct {
					Name        string `json:"name"`
					Description string `json:"description"`
				}
				if err := c.ShouldBindJSON(&body); err != nil {
					c.JSON(400, gin.H{"error": err.Error()})
					return
				}

				if err := menus.UpdateMenu(ctx, menuID, body.Name, body.Description); err != nil {
					c.JSON(500, gin.H{"error": "update failed"})
					return
				}
				c.JSON(200, gin.H{"message": "updated"})
			})

			// Protected: Delete menu
			menuGroup.DELETE("/:id", middleware.AuthMiddleware(cfg.JwtSecret), middleware.RoleMiddleware("provider", "admin"), func(c *gin.Context) {
				menuID := c.Param("id")
				if err := menus.DeleteMenu(ctx, menuID); err != nil {
					c.JSON(500, gin.H{"error": "deletion failed"})
					return
				}
				c.JSON(200, gin.H{"message": "deleted"})
			})
		}

		// ==================== MENU ITEM ROUTES ====================
		itemGroup := v1.Group("/menu-items")
		{
			// Public: Get item by ID
			itemGroup.GET("/:id", func(c *gin.Context) {
				id := c.Param("id")
				item, err := menus.GetMenuItem(ctx, id)
				if err != nil {
					c.JSON(404, gin.H{"error": "item not found"})
					return
				}
				c.JSON(200, item)
			})

			// Public: Get items by menu
			itemGroup.GET("/menu/:menu_id", func(c *gin.Context) {
				menuID := c.Param("menu_id")
				list, err := menus.GetMenuItems(ctx, menuID)
				if err != nil {
					c.JSON(500, gin.H{"error": "failed to get items"})
					return
				}
				c.JSON(200, list)
			})

			// Protected: Create item
			itemGroup.POST("", middleware.AuthMiddleware(cfg.JwtSecret), middleware.RoleMiddleware("provider", "admin"), func(c *gin.Context) {
				var body struct {
					MenuID       string   `json:"menu_id" binding:"required"`
					Name         string   `json:"name" binding:"required"`
					Price        float64  `json:"price" binding:"required"`
					Ingredients  []string `json:"ingredients"`
					IsJain       bool     `json:"is_jain"`
					Availability bool     `json:"availability"`
					ImageURL     string   `json:"image_url"`
				}
				if err := c.ShouldBindJSON(&body); err != nil {
					c.JSON(400, gin.H{"error": err.Error()})
					return
				}

				item, err := menus.CreateMenuItem(ctx, body.MenuID, body.Name, body.Price, body.Ingredients, body.IsJain, body.Availability, body.ImageURL)
				if err != nil {
					c.JSON(500, gin.H{"error": "item creation failed"})
					return
				}

				_ = events.LogEvent(ctx, "menu_item", item.ID, events.EventItemCreated, map[string]interface{}{
					"menu_id": body.MenuID,
					"name":    body.Name,
					"is_jain": body.IsJain,
				})

				c.JSON(201, item)
			})

			// Protected: Update item
			itemGroup.PUT("/:id", middleware.AuthMiddleware(cfg.JwtSecret), middleware.RoleMiddleware("provider", "admin"), func(c *gin.Context) {
				itemID := c.Param("id")
				var body struct {
					Name         string   `json:"name"`
					Price        float64  `json:"price"`
					Ingredients  []string `json:"ingredients"`
					IsJain       bool     `json:"is_jain"`
					Availability bool     `json:"availability"`
					ImageURL     string   `json:"image_url"`
				}
				if err := c.ShouldBindJSON(&body); err != nil {
					c.JSON(400, gin.H{"error": err.Error()})
					return
				}

				if err := menus.UpdateMenuItem(ctx, itemID, body.Name, body.Price, body.Ingredients, body.IsJain, body.Availability, body.ImageURL); err != nil {
					c.JSON(500, gin.H{"error": "update failed"})
					return
				}
				c.JSON(200, gin.H{"message": "updated"})
			})

			// Protected: Toggle availability (real-time)
			itemGroup.PATCH("/:id/availability", middleware.AuthMiddleware(cfg.JwtSecret), middleware.RoleMiddleware("provider", "admin"), func(c *gin.Context) {
				itemID := c.Param("id")
				var body struct {
					Available bool `json:"available"`
				}
				if err := c.ShouldBindJSON(&body); err != nil {
					c.JSON(400, gin.H{"error": err.Error()})
					return
				}

				if err := menus.ToggleAvailability(ctx, itemID, body.Available); err != nil {
					c.JSON(500, gin.H{"error": "toggle failed"})
					return
				}
				c.JSON(200, gin.H{"message": "availability updated"})
			})

			// Protected: Delete item
			itemGroup.DELETE("/:id", middleware.AuthMiddleware(cfg.JwtSecret), middleware.RoleMiddleware("provider", "admin"), func(c *gin.Context) {
				itemID := c.Param("id")
				if err := menus.DeleteMenuItem(ctx, itemID); err != nil {
					c.JSON(500, gin.H{"error": "deletion failed"})
					return
				}
				c.JSON(200, gin.H{"message": "deleted"})
			})
		}

		// ==================== SEARCH ROUTES ====================
		searchGroup := v1.Group("/search")
		{
			// Search nearby providers
			searchGroup.GET("/providers", func(c *gin.Context) {
				lat, _ := strconv.ParseFloat(c.Query("lat"), 64)
				lng, _ := strconv.ParseFloat(c.Query("lng"), 64)
				radius, _ := strconv.ParseFloat(c.DefaultQuery("radius", "5000"), 64) // Default 5km
				minRating, _ := strconv.ParseFloat(c.DefaultQuery("min_rating", "0"), 64)
				limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
				offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

				tags := []string{}
				if t := c.Query("tags"); t != "" {
					tags = strings.Split(t, ",")
				}

				filters := search.SearchFilters{
					Lat:          lat,
					Lng:          lng,
					RadiusMeters: radius,
					Tags:         tags,
					MinRating:    minRating,
				}

				results, err := search.SearchNearbyProviders(ctx, filters, limit, offset)
				if err != nil {
					logger.Error("provider search failed", zap.Error(err))
					c.JSON(500, gin.H{"error": "search failed"})
					return
				}
				c.JSON(200, results)
			})

			// Search menu items
			searchGroup.GET("/items", func(c *gin.Context) {
				lat, _ := strconv.ParseFloat(c.Query("lat"), 64)
				lng, _ := strconv.ParseFloat(c.Query("lng"), 64)
				radius, _ := strconv.ParseFloat(c.DefaultQuery("radius", "5000"), 64)
				query := c.Query("q")
				jainOnly, _ := strconv.ParseBool(c.DefaultQuery("jain_only", "true"))
				availableOnly, _ := strconv.ParseBool(c.DefaultQuery("available_only", "true"))
				minRating, _ := strconv.ParseFloat(c.DefaultQuery("min_rating", "0"), 64)
				priceMax, _ := strconv.ParseFloat(c.DefaultQuery("price_max", "0"), 64)
				limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
				offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

				tags := []string{}
				if t := c.Query("tags"); t != "" {
					tags = strings.Split(t, ",")
				}

				filters := search.SearchFilters{
					Lat:           lat,
					Lng:           lng,
					RadiusMeters:  radius,
					Query:         query,
					JainOnly:      jainOnly,
					AvailableOnly: availableOnly,
					Tags:          tags,
					MinRating:     minRating,
					PriceMax:      priceMax,
				}

				results, err := search.SearchMenuItems(ctx, filters, limit, offset)
				if err != nil {
					logger.Error("item search failed", zap.Error(err))
					c.JSON(500, gin.H{"error": "search failed"})
					return
				}
				c.JSON(200, results)
			})
		}

		// ==================== ORDER ROUTES ====================
		orderGroup := v1.Group("/orders")
		orderGroup.Use(middleware.AuthMiddleware(cfg.JwtSecret))
		{
			// Create order
			orderGroup.POST("", func(c *gin.Context) {
				userID, _ := middleware.GetUserIDFromContext(c)
				var body struct {
					ProviderID string      `json:"provider_id" binding:"required"`
					Items      interface{} `json:"items" binding:"required"`
					Total      float64     `json:"total" binding:"required"`
				}
				if err := c.ShouldBindJSON(&body); err != nil {
					c.JSON(400, gin.H{"error": err.Error()})
					return
				}

				orderID, orderCode, err := orders.CreateOrder(ctx, userID, body.ProviderID, body.Items, body.Total)
				if err != nil {
					logger.Error("order creation failed", zap.Error(err))
					c.JSON(500, gin.H{"error": "order creation failed"})
					return
				}

				// Generate order confirmation OTP
				otp, err := auth.GenerateOTP()
				if err != nil {
					c.JSON(500, gin.H{"error": "otp generation failed"})
					return
				}
				hash := auth.HashOTP(cfg.OtpSecret, otp)
				otpKey := "order-otp:" + orderID
				if err := auth.StoreOTP(ctx, otpKey, hash, 30*time.Minute); err != nil {
					c.JSON(500, gin.H{"error": "failed to store otp"})
					return
				}

				// Log event
				_ = events.LogEvent(ctx, "order", orderID, events.EventOrderCreated, map[string]interface{}{
					"buyer_id":    userID,
					"provider_id": body.ProviderID,
					"total":       body.Total,
					"order_code":  orderCode,
				})

				// TODO: Send OTP via SMS to buyer and provider
				// For development, return OTP in response
				c.JSON(201, gin.H{
					"order_id":   orderID,
					"order_code": orderCode,
					"otp":        otp, // REMOVE in production
				})
			})

			// Get order by code
			orderGroup.GET("/code/:code", func(c *gin.Context) {
				code := c.Param("code")
				orderID, err := orders.GetOrderByCode(ctx, code)
				if err != nil {
					c.JSON(404, gin.H{"error": "order not found"})
					return
				}
				c.JSON(200, gin.H{"order_id": orderID, "order_code": code})
			})

			// Confirm order with OTP
			orderGroup.POST("/:id/confirm-otp", func(c *gin.Context) {
				orderID := c.Param("id")
				var body struct {
					OTP string `json:"otp" binding:"required"`
				}
				if err := c.ShouldBindJSON(&body); err != nil {
					c.JSON(400, gin.H{"error": err.Error()})
					return
				}

				key := "order-otp:" + orderID
				stored, err := auth.GetOTP(ctx, key)
				if err != nil {
					c.JSON(400, gin.H{"error": "otp expired or not found"})
					return
				}

				if stored != auth.HashOTP(cfg.OtpSecret, body.OTP) {
					c.JSON(401, gin.H{"error": "invalid otp"})
					return
				}

				if err := orders.ConfirmOrder(ctx, orderID); err != nil {
					c.JSON(500, gin.H{"error": "order confirmation failed"})
					return
				}

				_ = auth.DeleteOTP(ctx, key)

				// Log event
				_ = events.LogEvent(ctx, "order", orderID, events.EventOrderConfirmed, map[string]interface{}{})

				c.JSON(200, gin.H{"message": "order confirmed"})
			})

			// Cancel order
			orderGroup.POST("/:id/cancel", func(c *gin.Context) {
				orderID := c.Param("id")
				if err := orders.CancelOrder(ctx, orderID); err != nil {
					c.JSON(500, gin.H{"error": "cancellation failed"})
					return
				}

				_ = events.LogEvent(ctx, "order", orderID, events.EventOrderCancelled, map[string]interface{}{})

				c.JSON(200, gin.H{"message": "order cancelled"})
			})

			// Complete order
			orderGroup.POST("/:id/complete", func(c *gin.Context) {
				orderID := c.Param("id")
				if err := orders.CompleteOrder(ctx, orderID); err != nil {
					c.JSON(500, gin.H{"error": "completion failed"})
					return
				}

				_ = events.LogEvent(ctx, "order", orderID, events.EventOrderCompleted, map[string]interface{}{})

				c.JSON(200, gin.H{"message": "order completed"})
			})
		}

		// ==================== CHAT ROUTES ====================
		chatGroup := v1.Group("/chat")
		{
			// WebSocket endpoint for chat
			chatGroup.GET("/ws", chatHub.HandleWebSocket)

			// Protected: Create chat for order
			chatGroup.POST("", middleware.AuthMiddleware(cfg.JwtSecret), func(c *gin.Context) {
				var body struct {
					OrderID      string   `json:"order_id" binding:"required"`
					Participants []string `json:"participants" binding:"required"`
				}
				if err := c.ShouldBindJSON(&body); err != nil {
					c.JSON(400, gin.H{"error": err.Error()})
					return
				}

				chatRoom, err := chat.CreateChat(ctx, body.OrderID, body.Participants)
				if err != nil {
					c.JSON(500, gin.H{"error": "chat creation failed"})
					return
				}

				_ = events.LogEvent(ctx, "chat", chatRoom.ID, events.EventChatCreated, map[string]interface{}{
					"order_id":     body.OrderID,
					"participants": body.Participants,
				})

				c.JSON(201, chatRoom)
			})

			// Get chat by order
			chatGroup.GET("/order/:order_id", middleware.AuthMiddleware(cfg.JwtSecret), func(c *gin.Context) {
				orderID := c.Param("order_id")
				chatRoom, err := chat.GetChatByOrder(ctx, orderID)
				if err != nil {
					c.JSON(404, gin.H{"error": "chat not found"})
					return
				}
				c.JSON(200, chatRoom)
			})

			// Get messages
			chatGroup.GET("/:id/messages", middleware.AuthMiddleware(cfg.JwtSecret), func(c *gin.Context) {
				chatID := c.Param("id")
				limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
				offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

				messages, err := chat.GetMessages(ctx, chatID, limit, offset)
				if err != nil {
					c.JSON(500, gin.H{"error": "failed to get messages"})
					return
				}
				c.JSON(200, messages)
			})
		}

		// ==================== MEDIA ROUTES ====================
		if mediaClient != nil {
			mediaGroup := v1.Group("/media")
			mediaGroup.Use(middleware.AuthMiddleware(cfg.JwtSecret))
			{
				// Get upload URL
				mediaGroup.POST("/upload-url", func(c *gin.Context) {
					var body struct {
						Folder      string `json:"folder" binding:"required"` // e.g., "providers", "items"
						ContentType string `json:"content_type" binding:"required"`
						FileName    string `json:"file_name" binding:"required"`
					}
					if err := c.ShouldBindJSON(&body); err != nil {
						c.JSON(400, gin.H{"error": err.Error()})
						return
					}

					resp, err := mediaClient.GenerateUploadURL(ctx, media.UploadURLRequest{
						Folder:      body.Folder,
						ContentType: body.ContentType,
						FileName:    body.FileName,
					})
					if err != nil {
						c.JSON(500, gin.H{"error": "failed to generate upload url"})
						return
					}
					c.JSON(200, resp)
				})

				// Get download URL
				mediaGroup.POST("/download-url", func(c *gin.Context) {
					var body struct {
						ObjectKey string `json:"object_key" binding:"required"`
					}
					if err := c.ShouldBindJSON(&body); err != nil {
						c.JSON(400, gin.H{"error": err.Error()})
						return
					}

					resp, err := mediaClient.GenerateGetURL(ctx, media.GetURLRequest{
						ObjectKey: body.ObjectKey,
					})
					if err != nil {
						c.JSON(500, gin.H{"error": "failed to generate download url"})
						return
					}
					c.JSON(200, resp)
				})
			}
		}
	}

	// Start server
	port := cfg.Port
	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	logger.Info("starting server", zap.String("port", port))
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Fatal("server error", zap.Error(err))
	}
}
