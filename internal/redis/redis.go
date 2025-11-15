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
