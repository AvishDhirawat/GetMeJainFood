package util

import (
	"os"
)

type Config struct {
	Port        string
	DatabaseURL string
	RedisAddr   string
	JwtSecret   string
	OtpSecret   string
	// S3/Object Storage configuration
	S3Endpoint  string
	S3Region    string
	S3AccessKey string
	S3SecretKey string
	S3Bucket    string
}

func Load() *Config {
	cfg := &Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/jain_food?sslmode=disable"),
		RedisAddr:   getEnv("REDIS_ADDR", "localhost:6379"),
		JwtSecret:   getEnv("JWT_SECRET", "replace_me"),
		OtpSecret:   getEnv("OTP_SECRET", "replace_me_otp"),
		// S3/MinIO configuration
		S3Endpoint:  getEnv("S3_ENDPOINT", ""),
		S3Region:    getEnv("S3_REGION", "us-east-1"),
		S3AccessKey: getEnv("S3_ACCESS_KEY", ""),
		S3SecretKey: getEnv("S3_SECRET_KEY", ""),
		S3Bucket:    getEnv("S3_BUCKET", "jain-food-media"),
	}
	return cfg
}

func getEnv(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}
