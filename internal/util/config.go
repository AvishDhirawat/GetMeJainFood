package util

import (
	"fmt"
	"os"
	"strings"
)

// Environment represents the deployment environment
type Environment string

const (
	EnvLocal      Environment = "local"
	EnvDev        Environment = "dev"
	EnvQA         Environment = "qa"
	EnvProduction Environment = "prod"
)

// Config holds all application configuration
type Config struct {
	// Environment
	Env       Environment
	Port      string
	DebugMode bool

	// Database
	DatabaseURL string

	// Redis
	RedisAddr     string
	RedisPassword string
	RedisURL      string // Full URL for cloud Redis (takes precedence)
	RedisTLS      bool

	// Security
	JwtSecret string
	OtpSecret string

	// S3/Object Storage
	S3Endpoint  string
	S3Region    string
	S3AccessKey string
	S3SecretKey string
	S3Bucket    string

	// SMS/Notification Service
	NotifyService       string
	SMSIndiaHubAPIKey   string
	SMSIndiaHubSenderID string
	SMSIndiaHubChannel  string
	SMSIndiaHubRoute    string
	SMSIndiaHubPEID     string
	TextbeltAPIKey      string

	// Payment Gateway
	RazorpayKeyID     string
	RazorpayKeySecret string

	// Push Notifications
	FCMServerKey string
	FCMProjectID string

	// CDN
	CDNType           string
	ImageKitEndpoint  string
	CloudflareCDNURL  string
	BunnyPullZoneURL  string
	CloudFrontDomain  string
}

// Load loads configuration from environment variables
func Load() *Config {
	env := getEnv("APP_ENV", "local")

	cfg := &Config{
		Env:       Environment(strings.ToLower(env)),
		Port:      getEnv("PORT", "8080"),
		DebugMode: getEnv("GIN_MODE", "debug") != "release",

		// Database
		DatabaseURL: getEnvRequired("DATABASE_URL"),

		// Redis - support both URL and separate addr/password
		RedisAddr:     getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisURL:      getEnv("REDIS_URL", ""), // Cloud Redis URL
		RedisTLS:      getEnv("REDIS_TLS", "false") == "true",

		// Security
		JwtSecret: getEnvRequired("JWT_SECRET"),
		OtpSecret: getEnvRequired("OTP_SECRET"),

		// S3/MinIO
		S3Endpoint:  getEnv("S3_ENDPOINT", ""),
		S3Region:    getEnv("S3_REGION", "us-east-1"),
		S3AccessKey: getEnv("S3_ACCESS_KEY", ""),
		S3SecretKey: getEnv("S3_SECRET_KEY", ""),
		S3Bucket:    getEnv("S3_BUCKET", "jain-food-media"),

		// SMS/Notification
		NotifyService:       getEnv("NOTIFY_SERVICE", "console"),
		SMSIndiaHubAPIKey:   getEnv("SMSINDIAHUB_API_KEY", ""),
		SMSIndiaHubSenderID: getEnv("SMSINDIAHUB_SENDER_ID", "JAINFO"),
		SMSIndiaHubChannel:  getEnv("SMSINDIAHUB_CHANNEL", "Trans"),
		SMSIndiaHubRoute:    getEnv("SMSINDIAHUB_ROUTE", ""),
		SMSIndiaHubPEID:     getEnv("SMSINDIAHUB_PEID", ""),
		TextbeltAPIKey:      getEnv("TEXTBELT_API_KEY", "textbelt"),

		// Payment
		RazorpayKeyID:     getEnv("RAZORPAY_KEY_ID", ""),
		RazorpayKeySecret: getEnv("RAZORPAY_KEY_SECRET", ""),

		// Push Notifications
		FCMServerKey: getEnv("FCM_SERVER_KEY", ""),
		FCMProjectID: getEnv("FCM_PROJECT_ID", ""),

		// CDN
		CDNType:          getEnv("CDN_TYPE", ""),
		ImageKitEndpoint: getEnv("IMAGEKIT_URL_ENDPOINT", ""),
		CloudflareCDNURL: getEnv("CLOUDFLARE_CDN_URL", ""),
		BunnyPullZoneURL: getEnv("BUNNY_PULLZONE_URL", ""),
		CloudFrontDomain: getEnv("CLOUDFRONT_DOMAIN", ""),
	}

	return cfg
}

// IsDevelopment returns true if running in local or dev environment
func (c *Config) IsDevelopment() bool {
	return c.Env == EnvLocal || c.Env == EnvDev
}

// IsProduction returns true if running in production
func (c *Config) IsProduction() bool {
	return c.Env == EnvProduction
}

// ShouldReturnOTPInResponse returns true if OTP should be included in API response
// Returns OTP in response for: local, dev environments
// Does NOT return OTP for: qa, prod environments (must use real SMS)
func (c *Config) ShouldReturnOTPInResponse() bool {
	// Check for explicit override via environment variable
	// Set OTP_IN_RESPONSE=true to force OTP in response (useful for testing)
	// Set OTP_IN_RESPONSE=false to force SMS only
	override := os.Getenv("OTP_IN_RESPONSE")
	if override == "true" {
		return true
	}
	if override == "false" {
		return false
	}

	// Default behavior: OTP in response only for local and dev
	return c.Env == EnvLocal || c.Env == EnvDev
}

// ShouldSendSMS returns true if SMS should be sent
// In local/dev: SMS is optional (can be disabled)
// In qa/prod: SMS is always sent
func (c *Config) ShouldSendSMS() bool {
	// Check for explicit override
	override := os.Getenv("SEND_SMS")
	if override == "false" {
		return false
	}
	if override == "true" {
		return true
	}

	// Default: send SMS in qa and prod, optional in local/dev
	if c.Env == EnvQA || c.Env == EnvProduction {
		return true
	}

	// In local/dev, send SMS only if SMS service is configured (not console)
	return c.NotifyService != "" && c.NotifyService != "console"
}

func getEnv(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

func getEnvRequired(k string) string {
	v := os.Getenv(k)
	if v == "" {
		panic(fmt.Sprintf("Required environment variable %s is not set. Please check your .env file.", k))
	}
	return v
}

