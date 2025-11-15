package util

import (
    "os"
)

type Config struct {
    Port string
    DatabaseURL string
    RedisAddr string
    JwtSecret string
    OtpSecret string
}

func Load() *Config {
    cfg := &Config{
        Port: getEnv("PORT", "8080"),
        DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/jain_food?sslmode=disable"),
        RedisAddr: getEnv("REDIS_ADDR", "localhost:6379"),
        JwtSecret: getEnv("JWT_SECRET", "replace_me"),
        OtpSecret: getEnv("OTP_SECRET", "replace_me_otp"),
    }
    return cfg
}

func getEnv(k, d string) string {
    if v := os.Getenv(k); v != "" { return v }
    return d
}
