package models

import "time"

type User struct {
    ID string `json:"id"`
    Phone string `json:"phone"`
    Name string `json:"name"`
    Email string `json:"email"`
    Role string `json:"role"`
    CreatedAt time.Time `json:"created_at"`
}

type Order struct {
    ID string `json:"id"`
    OrderCode string `json:"order_code"`
    BuyerID string `json:"buyer_id"`
    ProviderID string `json:"provider_id"`
    Items interface{} `json:"items"`
    TotalEstimate float64 `json:"total_estimate"`
    Status string `json:"status"`
    CreatedAt time.Time `json:"created_at"`
}
