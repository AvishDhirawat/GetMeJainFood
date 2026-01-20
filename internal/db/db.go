package db

import (
    "context"
    "errors"
    "fmt"
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

// TableExists checks whether a table exists in the current database schema.
// tableName should be provided without schema, e.g. "users".
func TableExists(ctx context.Context, tableName string) (bool, error) {
    if Pool == nil {
        return false, fmt.Errorf("db pool is nil")
    }
    var regclass *string
    // to_regclass returns NULL if the relation does not exist
    err := Pool.QueryRow(ctx, `SELECT to_regclass('public.' || $1)`, tableName).Scan(&regclass)
    if err != nil {
        return false, err
    }
    return regclass != nil, nil
}
