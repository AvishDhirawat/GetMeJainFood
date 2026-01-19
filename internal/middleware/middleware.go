package middleware

import (
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"jainfood/internal/redisclient"
)

// Claims represents JWT claims.
type Claims struct {
	UserID string `json:"user_id"`
	Phone  string `json:"phone"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// AuthMiddleware validates JWT tokens.
func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authorization header required"})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header format"})
			return
		}

		tokenString := parts[1]
		claims := &Claims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}

		// Set user info in context for handlers
		c.Set("user_id", claims.UserID)
		c.Set("phone", claims.Phone)
		c.Set("role", claims.Role)

		c.Next()
	}
}

// RoleMiddleware restricts access based on user role.
func RoleMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "role not found in context"})
			return
		}

		roleStr := role.(string)
		for _, allowed := range allowedRoles {
			if roleStr == allowed {
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
	}
}

// RateLimitConfig holds rate limiter configuration.
type RateLimitConfig struct {
	Requests int           // Maximum number of requests
	Window   time.Duration // Time window
	KeyFunc  func(*gin.Context) string
}

// RateLimitMiddleware implements rate limiting using Redis.
func RateLimitMiddleware(cfg RateLimitConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := context.Background()
		key := "ratelimit:" + cfg.KeyFunc(c)

		count, err := redisclient.Rdb.Get(ctx, key).Int()
		if err != nil && err != redis.Nil {
			// Redis error, allow request but log
			c.Next()
			return
		}

		if count >= cfg.Requests {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":       "rate limit exceeded",
				"retry_after": int(cfg.Window.Seconds()),
			})
			return
		}

		pipe := redisclient.Rdb.Pipeline()
		pipe.Incr(ctx, key)
		pipe.Expire(ctx, key, cfg.Window)
		_, _ = pipe.Exec(ctx)

		c.Next()
	}
}

// IPRateLimiter creates a rate limiter based on client IP.
func IPRateLimiter(requests int, window time.Duration) gin.HandlerFunc {
	return RateLimitMiddleware(RateLimitConfig{
		Requests: requests,
		Window:   window,
		KeyFunc: func(c *gin.Context) string {
			return c.ClientIP()
		},
	})
}

// EndpointRateLimiter creates a rate limiter for specific endpoints.
func EndpointRateLimiter(requests int, window time.Duration) gin.HandlerFunc {
	return RateLimitMiddleware(RateLimitConfig{
		Requests: requests,
		Window:   window,
		KeyFunc: func(c *gin.Context) string {
			return c.ClientIP() + ":" + c.FullPath()
		},
	})
}

// LoggingMiddleware adds structured logging for requests.
func LoggingMiddleware(logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()

		logger.Info("request",
			zap.String("method", c.Request.Method),
			zap.String("path", path),
			zap.String("query", query),
			zap.Int("status", status),
			zap.Duration("latency", latency),
			zap.String("client_ip", c.ClientIP()),
			zap.String("user_agent", c.Request.UserAgent()),
		)

		// Log errors
		if len(c.Errors) > 0 {
			for _, e := range c.Errors {
				logger.Error("request error", zap.Error(e.Err))
			}
		}
	}
}

// CORSMiddleware adds CORS headers.
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// SecureHeadersMiddleware adds security headers.
func SecureHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		c.Header("Content-Security-Policy", "default-src 'self'")
		c.Next()
	}
}

// GenerateJWT creates a new JWT token for a user.
func GenerateJWT(jwtSecret, userID, phone, role string) (string, error) {
	claims := &Claims{
		UserID: userID,
		Phone:  phone,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "jainfood",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))
}

// GetUserIDFromContext extracts user ID from gin context.
func GetUserIDFromContext(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	return userID.(string), true
}

// GetRoleFromContext extracts role from gin context.
func GetRoleFromContext(c *gin.Context) (string, bool) {
	role, exists := c.Get("role")
	if !exists {
		return "", false
	}
	return role.(string), true
}
