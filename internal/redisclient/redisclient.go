package redisclient

import (
	"context"
	"crypto/tls"
	"os"
	"strings"

	"github.com/redis/go-redis/v9"
)

var Ctx = context.Background()
var Rdb *redis.Client

// Connect initializes the Redis client
// Supports both local Redis and cloud Redis (Upstash, Redis Cloud, etc.)
// For cloud Redis, set REDIS_PASSWORD environment variable
func Connect(addr string) {
	password := os.Getenv("REDIS_PASSWORD")

	opts := &redis.Options{
		Addr:     addr,
		Password: password,
		DB:       0,
	}

	// Enable TLS for cloud Redis providers (Upstash, Redis Cloud)
	// Check if address ends with common cloud Redis domains
	if strings.Contains(addr, "upstash.io") ||
	   strings.Contains(addr, "redislabs.com") ||
	   strings.Contains(addr, "amazonaws.com") ||
	   os.Getenv("REDIS_TLS") == "true" {
		opts.TLSConfig = &tls.Config{
			MinVersion: tls.VersionTLS12,
		}
	}

	Rdb = redis.NewClient(opts)
}

// ConnectWithURL connects using a Redis URL (redis:// or rediss://)
// Useful for cloud providers that give you a connection URL
func ConnectWithURL(redisURL string) error {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return err
	}
	Rdb = redis.NewClient(opts)
	return nil
}

// Ping checks Redis connectivity
func Ping(ctx context.Context) error {
	if Rdb == nil {
		return nil
	}
	return Rdb.Ping(ctx).Err()
}

// Close closes the Redis connection
func Close() error {
	if Rdb != nil {
		return Rdb.Close()
	}
	return nil
}

