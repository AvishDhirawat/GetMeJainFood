package models

import "time"

// User represents a platform user (buyer, provider, or admin).
type User struct {
	ID          string                 `json:"id"`
	Phone       string                 `json:"phone"`
	Name        string                 `json:"name"`
	Email       string                 `json:"email"`
	Role        string                 `json:"role"` // buyer, provider, admin
	Preferences map[string]interface{} `json:"preferences"`
	CreatedAt   time.Time              `json:"created_at"`
}

// Provider represents a food provider (cloud kitchen, home cook, hotel).
type Provider struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	BusinessName string    `json:"business_name"`
	Address      string    `json:"address"`
	Lat          float64   `json:"lat"`
	Lng          float64   `json:"lng"`
	Verified     bool      `json:"verified"`
	Tags         []string  `json:"tags"` // e.g., "sattvic", "no-root-veggies", "home-cook"
	Rating       float64   `json:"rating"`
	CreatedAt    time.Time `json:"created_at"`
}

// Menu represents a provider's menu.
type Menu struct {
	ID          string    `json:"id"`
	ProviderID  string    `json:"provider_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

// MenuItem represents an item in a menu.
type MenuItem struct {
	ID           string    `json:"id"`
	MenuID       string    `json:"menu_id"`
	Name         string    `json:"name"`
	Price        float64   `json:"price"`
	Ingredients  []string  `json:"ingredients"`
	IsJain       bool      `json:"is_jain"`
	Availability bool      `json:"availability"`
	ImageURL     string    `json:"image_url"`
	CreatedAt    time.Time `json:"created_at"`
}

// Order represents a food order.
type Order struct {
	ID            string      `json:"id"`
	OrderCode     string      `json:"order_code"`
	BuyerID       string      `json:"buyer_id"`
	ProviderID    string      `json:"provider_id"`
	Items         interface{} `json:"items"` // array of { item_id, qty, price }
	TotalEstimate float64     `json:"total_estimate"`
	Status        string      `json:"status"` // CREATED, PENDING_PROVIDER_ACK, CONFIRMED, COMPLETED, CANCELLED
	CreatedAt     time.Time   `json:"created_at"`
}

// OrderItem represents an item in an order.
type OrderItem struct {
	ItemID   string  `json:"item_id"`
	Name     string  `json:"name"`
	Quantity int     `json:"qty"`
	Price    float64 `json:"price"`
}

// Chat represents a chat room (typically associated with an order).
type Chat struct {
	ID           string    `json:"id"`
	OrderID      string    `json:"order_id"`
	Participants []string  `json:"participants"` // user IDs
	CreatedAt    time.Time `json:"created_at"`
}

// ChatMessage represents a message in a chat.
type ChatMessage struct {
	ID        string                 `json:"id"`
	ChatID    string                 `json:"chat_id"`
	SenderID  string                 `json:"sender_id"`
	Content   string                 `json:"content"`
	Meta      map[string]interface{} `json:"meta"`
	CreatedAt time.Time              `json:"created_at"`
}

// Event represents an audit/domain event.
type Event struct {
	ID         string                 `json:"id"`
	EntityType string                 `json:"entity_type"`
	EntityID   string                 `json:"entity_id"`
	EventType  string                 `json:"event_type"`
	Payload    map[string]interface{} `json:"payload"`
	CreatedAt  time.Time              `json:"created_at"`
}

// Jain dietary tags for filtering.
const (
	TagSattvic       = "sattvic"
	TagNoRootVeggies = "no-root-veggies"
	TagNoOnionGarlic = "no-onion-garlic"
	TagHomeCook      = "home-cook"
	TagCloudKitchen  = "cloud-kitchen"
	TagHotel         = "hotel"
	TagPureJain      = "pure-jain"
)

// Order status constants.
const (
	OrderStatusCreated            = "CREATED"
	OrderStatusPendingProviderAck = "PENDING_PROVIDER_ACK"
	OrderStatusConfirmed          = "CONFIRMED"
	OrderStatusCompleted          = "COMPLETED"
	OrderStatusCancelled          = "CANCELLED"
)

// User role constants.
const (
	RoleBuyer    = "buyer"
	RoleProvider = "provider"
	RoleAdmin    = "admin"
)
