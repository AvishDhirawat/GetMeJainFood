package orders

import (
    "context"
    "crypto/rand"
    "encoding/json"
    "fmt"
    "time"

    "github.com/google/uuid"
    ulid "github.com/oklog/ulid/v2"
    "jainfood/internal/db"
)

// GenerateOrderCode returns a human-friendly sortable ULID-based code.
// Format: JF-<ULID>
func GenerateOrderCode() (string, error) {
    // Use current time with monotonic entropy.
    t := time.Now().UTC()
    entropy := ulid.Monotonic(rand.Reader, 0)
    id, err := ulid.New(ulid.Timestamp(t), entropy)
    if err != nil {
        return "", err
    }
    return "JF-" + id.String(), nil
}

func CreateOrder(ctx context.Context, buyerID, providerID string, items interface{}, total float64) (string, string, error) {
    id := uuid.New().String()
    orderCode, err := GenerateOrderCode()
    if err != nil { return "", "", err }
    itemsJSON, err := json.Marshal(items)
    if err != nil { return "", "", err }
    _, err = db.Pool.Exec(ctx, `INSERT INTO orders (id, order_code, buyer_id, provider_id, items, total_estimate, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        id, orderCode, buyerID, providerID, itemsJSON, total, "CREATED", time.Now())
    if err != nil { return "", "", err }
    return id, orderCode, nil
}

func ConfirmOrder(ctx context.Context, orderID string) error {
    ct, err := db.Pool.Exec(ctx, `UPDATE orders SET status='CONFIRMED' WHERE id=$1`, orderID)
    if err != nil { return err }
    if ct.RowsAffected() == 0 {
        return fmt.Errorf("order not found")
    }
    return nil
}

// GetOrderByCode fetches order id by its external order_code.
func GetOrderByCode(ctx context.Context, orderCode string) (string, error) {
    var id string
    err := db.Pool.QueryRow(ctx, `SELECT id FROM orders WHERE order_code=$1 LIMIT 1`, orderCode).Scan(&id)
    if err != nil { return "", err }
    return id, nil
}
