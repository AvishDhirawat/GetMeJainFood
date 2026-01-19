package redisclient

import (
	"context"

	"github.com/redis/go-redis/v9"
)

var Ctx = context.Background()
var Rdb *redis.Client

func Connect(addr string) {
	Rdb = redis.NewClient(&redis.Options{
		Addr: addr,
	})
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

