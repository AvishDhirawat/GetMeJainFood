package models

import "time"

// User represents a platform user (buyer, provider, or admin).
type User struct {
	ID                string                 `json:"id"`
	Phone             string                 `json:"phone"`
	Name              string                 `json:"name"`
	Email             string                 `json:"email"`
	Role              string                 `json:"role"` // buyer, provider, admin
	Preferences       map[string]interface{} `json:"preferences"`
	Language          string                 `json:"language"` // "en" or "hi"
	Blocked           bool                   `json:"blocked"`
	BlockedReason     string                 `json:"blocked_reason,omitempty"`
	TermsAcceptedAt   *time.Time             `json:"terms_accepted_at,omitempty"`
	CreatedAt         time.Time              `json:"created_at"`
}

// Provider represents a food provider (cloud kitchen, home cook, hotel).
type Provider struct {
	ID                    string    `json:"id"`
	UserID                string    `json:"user_id"`
	BusinessName          string    `json:"business_name"`
	Address               string    `json:"address"`
	PinCode               string    `json:"pin_code"`
	Lat                   float64   `json:"lat"`
	Lng                   float64   `json:"lng"`
	Verified              bool      `json:"verified"`
	AadharVerified        bool      `json:"aadhar_verified"`
	AadharNumber          string    `json:"aadhar_number,omitempty"` // Encrypted/masked
	Tags                  []string  `json:"tags"` // e.g., "sattvic", "no-root-veggies", "home-cook"
	ProviderCategory      string    `json:"provider_category"` // tiffin-center, caterer, bhojnalaya, restaurant, baker, raw-material, sodh-khana
	FoodCategories        []string  `json:"food_categories"` // bakery, sweets, namkeen, dry-fruits, tiffin-thali, etc.
	Rating                float64   `json:"rating"`
	TotalRatings          int       `json:"total_ratings"`
	TotalOrders           int       `json:"total_orders"`
	AvailableToday        bool      `json:"available_today"`
	ExternalPlatforms     []string  `json:"external_platforms"` // swiggy, zomato, own-app
	ExternalAppLink       string    `json:"external_app_link,omitempty"`
	MinOrderQuantity      int       `json:"min_order_quantity"`
	BulkOrderEnabled      bool      `json:"bulk_order_enabled"`
	FreeDeliveryMinPrice  float64   `json:"free_delivery_min_price"`
	FreeDeliveryMaxKm     float64   `json:"free_delivery_max_km"`
	IsPromoted            bool      `json:"is_promoted"`
	Blocked               bool      `json:"blocked"`
	BlockedReason         string    `json:"blocked_reason,omitempty"`
	TermsAcceptedAt       *time.Time `json:"terms_accepted_at,omitempty"`
	CreatedAt             time.Time `json:"created_at"`
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
	ID            string    `json:"id"`
	MenuID        string    `json:"menu_id"`
	Name          string    `json:"name"`
	Price         float64   `json:"price"`
	Quantity      string    `json:"quantity,omitempty"` // e.g., "500g", "1 plate", optional
	Ingredients   []string  `json:"ingredients"`
	IsJain        bool      `json:"is_jain"`
	FoodCategory  string    `json:"food_category"` // bakery, sweets, namkeen, dry-fruits, tiffin, sodh, etc.
	Availability  bool      `json:"availability"`
	ImageURL      string    `json:"image_url"`
	DocumentURL   string    `json:"document_url,omitempty"` // PDF/doc for menu
	CreatedAt     time.Time `json:"created_at"`
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
	OrderType     string      `json:"order_type"` // individual, bulk
	CreatedAt     time.Time   `json:"created_at"`
}

// OrderItem represents an item in an order.
type OrderItem struct {
	ItemID   string  `json:"item_id"`
	Name     string  `json:"name"`
	Quantity int     `json:"qty"`
	Price    float64 `json:"price"`
}

// Review represents a customer review for a provider.
type Review struct {
	ID         string    `json:"id"`
	ProviderID string    `json:"provider_id"`
	UserID     string    `json:"user_id"`
	OrderID    string    `json:"order_id,omitempty"`
	Rating     int       `json:"rating"` // 1-5
	Comment    string    `json:"comment"`
	PhotoURLs  []string  `json:"photo_urls,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

// Offer represents a promotional offer from a provider.
type Offer struct {
	ID          string    `json:"id"`
	ProviderID  string    `json:"provider_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	DiscountPct float64   `json:"discount_pct,omitempty"`
	DiscountAmt float64   `json:"discount_amt,omitempty"`
	MinOrder    float64   `json:"min_order,omitempty"`
	ValidFrom   time.Time `json:"valid_from"`
	ValidUntil  time.Time `json:"valid_until"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
}

// FAQ represents frequently asked questions.
type FAQ struct {
	ID         string `json:"id"`
	QuestionEn string `json:"question_en"`
	QuestionHi string `json:"question_hi"`
	AnswerEn   string `json:"answer_en"`
	AnswerHi   string `json:"answer_hi"`
	Category   string `json:"category"`
	SortOrder  int    `json:"sort_order"`
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

// Provider category constants.
const (
	ProviderCategoryTiffinCenter   = "tiffin-center"
	ProviderCategoryCaterer        = "caterer"
	ProviderCategoryBhojnalaya     = "bhojnalaya"
	ProviderCategoryRestaurant     = "restaurant"
	ProviderCategoryBaker          = "baker"
	ProviderCategoryRawMaterial    = "raw-material"
	ProviderCategorySodhKhana      = "sodh-khana"
	ProviderCategoryHomeChef       = "home-chef"
	ProviderCategoryChaukaBai      = "chauka-bai"
)

// Food category constants.
const (
	FoodCategoryRawMaterials   = "raw-materials"
	FoodCategoryBakery         = "bakery"
	FoodCategorySweets         = "sweets"
	FoodCategoryIcecream       = "icecream"
	FoodCategoryNamkeen        = "namkeen"
	FoodCategoryDryFruits      = "dry-fruits"
	FoodCategoryTiffinThali    = "tiffin-thali"
	FoodCategorySodhKhana      = "sodh-ka-khana"
	FoodCategorySodhSamgri     = "sodh-ki-samgri"
	FoodCategoryNirvaanLaddu   = "nirvaan-laddu"
)

// Order status constants.
const (
	OrderStatusCreated            = "CREATED"
	OrderStatusPendingProviderAck = "PENDING_PROVIDER_ACK"
	OrderStatusConfirmed          = "CONFIRMED"
	OrderStatusCompleted          = "COMPLETED"
	OrderStatusCancelled          = "CANCELLED"
)

// Order type constants.
const (
	OrderTypeIndividual = "individual"
	OrderTypeBulk       = "bulk"
)

// User role constants.
const (
	RoleBuyer    = "buyer"
	RoleProvider = "provider"
	RoleAdmin    = "admin"
)

// Language constants.
const (
	LangEnglish = "en"
	LangHindi   = "hi"
)

