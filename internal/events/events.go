package events

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"jainfood/internal/db"
)

// EventType constants for different event types.
const (
	EventUserCreated      = "USER_CREATED"
	EventProviderCreated  = "PROVIDER_CREATED"
	EventProviderVerified = "PROVIDER_VERIFIED"
	EventMenuCreated      = "MENU_CREATED"
	EventItemCreated      = "ITEM_CREATED"
	EventOrderCreated     = "ORDER_CREATED"
	EventOrderConfirmed   = "ORDER_CONFIRMED"
	EventOrderCancelled   = "ORDER_CANCELLED"
	EventOrderCompleted   = "ORDER_COMPLETED"
	EventChatCreated      = "CHAT_CREATED"
	EventMessageSent      = "MESSAGE_SENT"
)

// Event represents an audit/domain event.
type Event struct {
	ID         string                 `json:"id"`
	EntityType string                 `json:"entity_type"`
	EntityID   string                 `json:"entity_id"`
	EventType  string                 `json:"event_type"`
	Payload    map[string]interface{} `json:"payload"`
	CreatedAt  string                 `json:"created_at"`
}

// LogEvent appends an event to the events table for audit/replay.
func LogEvent(ctx context.Context, entityType, entityID, eventType string, payload map[string]interface{}) error {
	id := uuid.New().String()

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	_, err = db.Pool.Exec(ctx, `
		INSERT INTO events (id, entity_type, entity_id, event_type, payload)
		VALUES ($1, $2, $3, $4, $5)
	`, id, entityType, entityID, eventType, payloadJSON)

	return err
}

// GetEventsByEntity retrieves all events for a specific entity.
func GetEventsByEntity(ctx context.Context, entityType, entityID string, limit, offset int) ([]*Event, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT id, entity_type, entity_id, event_type, payload, created_at
		FROM events
		WHERE entity_type = $1 AND entity_id = $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`, entityType, entityID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []*Event
	for rows.Next() {
		e := &Event{}
		var payloadJSON []byte
		if err := rows.Scan(&e.ID, &e.EntityType, &e.EntityID, &e.EventType, &payloadJSON, &e.CreatedAt); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(payloadJSON, &e.Payload); err != nil {
			e.Payload = map[string]interface{}{}
		}
		events = append(events, e)
	}
	return events, nil
}

// GetEventsByType retrieves all events of a specific type.
func GetEventsByType(ctx context.Context, eventType string, limit, offset int) ([]*Event, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT id, entity_type, entity_id, event_type, payload, created_at
		FROM events
		WHERE event_type = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, eventType, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []*Event
	for rows.Next() {
		e := &Event{}
		var payloadJSON []byte
		if err := rows.Scan(&e.ID, &e.EntityType, &e.EntityID, &e.EventType, &payloadJSON, &e.CreatedAt); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(payloadJSON, &e.Payload); err != nil {
			e.Payload = map[string]interface{}{}
		}
		events = append(events, e)
	}
	return events, nil
}

// GetRecentEvents retrieves recent events for monitoring/analytics.
func GetRecentEvents(ctx context.Context, limit int) ([]*Event, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT id, entity_type, entity_id, event_type, payload, created_at
		FROM events
		ORDER BY created_at DESC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []*Event
	for rows.Next() {
		e := &Event{}
		var payloadJSON []byte
		if err := rows.Scan(&e.ID, &e.EntityType, &e.EntityID, &e.EventType, &payloadJSON, &e.CreatedAt); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(payloadJSON, &e.Payload); err != nil {
			e.Payload = map[string]interface{}{}
		}
		events = append(events, e)
	}
	return events, nil
}
