package auth

import (
    "context"
    "crypto/hmac"
    "crypto/rand"
    "crypto/sha256"
    "encoding/base32"
    "fmt"
    "math/big"
    "time"

    "github.com/google/uuid"
    "github.com/redis/go-redis/v9"
    "jainfood/internal/redisclient"
)

func GenerateOTP() (string, error) {
    max := big.NewInt(1000000)
    n, err := rand.Int(rand.Reader, max)
    if err != nil { return "", err }
    return fmt.Sprintf("%06d", n.Int64()), nil
}

func HashOTP(secret, otp string) string {
    mac := hmac.New(sha256.New, []byte(secret))
    mac.Write([]byte(otp))
    return base32.StdEncoding.EncodeToString(mac.Sum(nil))
}

func StoreOTP(ctx context.Context, key string, hash string, ttl time.Duration) error {
    return redisclient.Rdb.Set(ctx, key, hash, ttl).Err()
}

func GetOTP(ctx context.Context, key string) (string, error) {
    return redisclient.Rdb.Get(ctx, key).Result()
}

func DeleteOTP(ctx context.Context, key string) error {
    return redisclient.Rdb.Del(ctx, key).Err()
}
