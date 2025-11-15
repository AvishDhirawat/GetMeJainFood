package db

import (
    "context"
    "log"
    "time"

    "github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

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
