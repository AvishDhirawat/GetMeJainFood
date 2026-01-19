package db

import (
    "context"
    "errors"
    "time"

    "github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

// ErrNotFound is returned when a requested record is not found
var ErrNotFound = errors.New("record not found")

func Connect(ctx context.Context, databaseURL string) error {
    cfg, err := pgxpool.ParseConfig(databaseURL)
    if err != nil {
        return err
    }
    // tune pool as needed
    cfg.MaxConns = 20
    cfg.MinConns = 2
    cfg.HealthCheckPeriod = 30 * time.Second

    pool, err := pgxpool.NewWithConfig(ctx, cfg)
    if err != nil {
        return err
    }
    Pool = pool
    return nil
}

func Close() {
    if Pool != nil {
        Pool.Close()
    }
}

// Ping checks database connectivity
func Ping(ctx context.Context) error {
    if Pool == nil {
        return nil
    }
    return Pool.Ping(ctx)
}

