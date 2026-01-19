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
	"jainfood/internal/models"
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
	if err != nil {
		return "", "", err
	}
	itemsJSON, err := json.Marshal(items)
	if err != nil {
		return "", "", err
	}
	_, err = db.Pool.Exec(ctx, `INSERT INTO orders (id, order_code, buyer_id, provider_id, items, total_estimate, status, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		id, orderCode, buyerID, providerID, itemsJSON, total, models.OrderStatusCreated, time.Now())
	if err != nil {
		return "", "", err
	}
	return id, orderCode, nil
}

func ConfirmOrder(ctx context.Context, orderID string) error {
	ct, err := db.Pool.Exec(ctx, `UPDATE orders SET status=$1 WHERE id=$2`, models.OrderStatusConfirmed, orderID)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("order not found")
	}
	return nil
}

// CancelOrder sets order status to CANCELLED.
func CancelOrder(ctx context.Context, orderID string) error {
	ct, err := db.Pool.Exec(ctx, `UPDATE orders SET status=$1 WHERE id=$2`, models.OrderStatusCancelled, orderID)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("order not found")
	}
	return nil
}

// CompleteOrder sets order status to COMPLETED.
func CompleteOrder(ctx context.Context, orderID string) error {
	ct, err := db.Pool.Exec(ctx, `UPDATE orders SET status=$1 WHERE id=$2`, models.OrderStatusCompleted, orderID)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("order not found")
	}
	return nil
}

// GetOrderByCode fetches order id by its external order_code.
func GetOrderByCode(ctx context.Context, orderCode string) (string, error) {
	var id string
	err := db.Pool.QueryRow(ctx, `SELECT id FROM orders WHERE order_code=$1 LIMIT 1`, orderCode).Scan(&id)
	if err != nil {
		return "", err
	}
	return id, nil
}

// GetOrderByID fetches a full order by ID.
func GetOrderByID(ctx context.Context, orderID string) (*models.Order, error) {
	order := &models.Order{}
	var itemsJSON []byte
	err := db.Pool.QueryRow(ctx, `
		SELECT id, order_code, buyer_id, provider_id, items, total_estimate, status, created_at
		FROM orders WHERE id = $1
	`, orderID).Scan(
		&order.ID, &order.OrderCode, &order.BuyerID, &order.ProviderID,
		&itemsJSON, &order.TotalEstimate, &order.Status, &order.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(itemsJSON, &order.Items)
	return order, nil
}

// GetOrdersByBuyer retrieves orders for a buyer.
func GetOrdersByBuyer(ctx context.Context, buyerID string, limit, offset int) ([]*models.Order, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT id, order_code, buyer_id, provider_id, items, total_estimate, status, created_at
		FROM orders WHERE buyer_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, buyerID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []*models.Order
	for rows.Next() {
		order := &models.Order{}
		var itemsJSON []byte
		if err := rows.Scan(
			&order.ID, &order.OrderCode, &order.BuyerID, &order.ProviderID,
			&itemsJSON, &order.TotalEstimate, &order.Status, &order.CreatedAt,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(itemsJSON, &order.Items)
		orders = append(orders, order)
	}
	return orders, nil
}

// GetOrdersByProvider retrieves orders for a provider.
func GetOrdersByProvider(ctx context.Context, providerID string, limit, offset int) ([]*models.Order, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT id, order_code, buyer_id, provider_id, items, total_estimate, status, created_at
		FROM orders WHERE provider_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, providerID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []*models.Order
	for rows.Next() {
		order := &models.Order{}
		var itemsJSON []byte
		if err := rows.Scan(
			&order.ID, &order.OrderCode, &order.BuyerID, &order.ProviderID,
			&itemsJSON, &order.TotalEstimate, &order.Status, &order.CreatedAt,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(itemsJSON, &order.Items)
		orders = append(orders, order)
	}
	return orders, nil
}
