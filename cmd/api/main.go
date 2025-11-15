package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
    "jainfood/internal/auth"
    "jainfood/internal/db"
    "jainfood/internal/orders"
    "jainfood/internal/redisclient"
    "jainfood/internal/util"
)

func main() {
    _ = godotenv.Load()
    cfg := util.Load()

    ctx := context.Background()
    if err := db.Connect(ctx, cfg.DatabaseURL); err != nil {
        log.Fatalf("db connect: %v", err)
    }
    defer db.Close()
    redisclient.Connect(cfg.RedisAddr)

    r := gin.Default()

    v1 := r.Group("/v1")
    {
        v1.POST("/auth/send-otp", func(c *gin.Context) {
            var body struct { Phone string `json:"phone"` }
            if err := c.BindJSON(&body); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
            otp, err := auth.GenerateOTP()
            if err != nil { c.JSON(500, gin.H{"error":"otp gen failed"}); return }
            hash := auth.HashOTP(cfg.OtpSecret, otp)
            key := "otp:" + body.Phone
            if err := auth.StoreOTP(ctx, key, hash, 10*time.Minute); err != nil {
                c.JSON(500, gin.H{"error":"redis set failed"}); return
            }
            // TODO: send via SMS gateway. For dev, return OTP in response (REMOVE in prod)
            c.JSON(200, gin.H{"message":"otp_sent", "otp": otp})
        })

        v1.POST("/auth/verify-otp", func(c *gin.Context) {
            var body struct { Phone string `json:"phone"`; OTP string `json:"otp"` }
            if err := c.BindJSON(&body); err != nil { c.JSON(400, gin.H{"error": err.Error()}); return }
            key := "otp:" + body.Phone
            stored, err := auth.GetOTP(ctx, key)
            if err != nil {
                c.JSON(400, gin.H{"error":"otp expired or not found"}); return
            }
            if stored != auth.HashOTP(cfg.OtpSecret, body.OTP) {
                c.JSON(401, gin.H{"error":"invalid otp"}); return
            }
            _ = auth.DeleteOTP(ctx, key)
            // TODO: lookup/create user & issue JWT
            c.JSON(200, gin.H{"message":"verified", "token":"dev-jwt-placeholder"})
        })

        v1.POST("/orders", func(c *gin.Context) {
            var body struct {
                BuyerID string `json:"buyer_id"`
                ProviderID string `json:"provider_id"`
                Items interface{} `json:"items"`
                Total float64 `json:"total"`
            }
            if err := c.BindJSON(&body); err != nil { c.JSON(400, gin.H{"error":err.Error()}); return }
            id, code, err := orders.CreateOrder(ctx, body.BuyerID, body.ProviderID, body.Items, body.Total)
            if err != nil { c.JSON(500, gin.H{"error":"create order failed"}); return }
            // create order OTP
            otp, _ := auth.GenerateOTP()
            h := auth.HashOTP(cfg.OtpSecret, otp)
            otpKey := "order-otp:" + id
            if err := auth.StoreOTP(ctx, otpKey, h, 10*time.Minute); err != nil { c.JSON(500, gin.H{"error":"redis set failed"}); return }
            // TODO: enqueue SMS to buyer & provider
            c.JSON(201, gin.H{"order_id": id, "order_code": code, "otp": otp}) // show OTP only in dev
        })

        v1.GET("/orders/code/:code", func(c *gin.Context) {
            code := c.Param("code")
            orderID, err := orders.GetOrderByCode(ctx, code)
            if err != nil { c.JSON(404, gin.H{"error":"not found"}); return }
            c.JSON(200, gin.H{"order_id": orderID, "order_code": code})
        })

        v1.POST("/orders/:id/confirm-otp", func(c *gin.Context) {
            id := c.Param("id")
            var body struct{ OTP string `json:"otp"` }
            if err := c.BindJSON(&body); err != nil { c.JSON(400, gin.H{"error":err.Error()}); return }
            k := "order-otp:" + id
            stored, err := auth.GetOTP(ctx, k)
            if err != nil { c.JSON(400, gin.H{"error":"otp expired"}); return }
            if stored != auth.HashOTP(cfg.OtpSecret, body.OTP) {
                c.JSON(401, gin.H{"error":"invalid otp"}); return
            }
            if err := orders.ConfirmOrder(ctx, id); err != nil { c.JSON(500, gin.H{"error":"confirm failed"}); return }
            _ = auth.DeleteOTP(ctx, k)
            c.JSON(200, gin.H{"message":"order confirmed"})
        })
    }

    port := cfg.Port
    srv := &http.Server{
        Addr:    ":" + port,
        Handler: r,
    }

    log.Printf("listening on %s", port)
    if err := srv.ListenAndServe(); err != nil {
        log.Fatalf("server: %v", err)
    }
}
