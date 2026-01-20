package payment

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// ============================================
// PAYMENT SERVICE INTERFACE
// ============================================

// PaymentService defines the interface for payment operations
type PaymentService interface {
	CreateOrder(amount int64, currency string, receipt string, notes map[string]string) (*PaymentOrder, error)
	VerifyPayment(orderID, paymentID, signature string) bool
	GetPaymentDetails(paymentID string) (*PaymentDetails, error)
}

// PaymentOrder represents a payment order
type PaymentOrder struct {
	ID          string `json:"id"`
	Entity      string `json:"entity"`
	Amount      int64  `json:"amount"`
	AmountPaid  int64  `json:"amount_paid"`
	AmountDue   int64  `json:"amount_due"`
	Currency    string `json:"currency"`
	Receipt     string `json:"receipt"`
	Status      string `json:"status"`
	CreatedAt   int64  `json:"created_at"`
}

// PaymentDetails represents payment information
type PaymentDetails struct {
	ID            string `json:"id"`
	Entity        string `json:"entity"`
	Amount        int64  `json:"amount"`
	Currency      string `json:"currency"`
	Status        string `json:"status"`
	OrderID       string `json:"order_id"`
	Method        string `json:"method"`
	Description   string `json:"description"`
	Email         string `json:"email"`
	Contact       string `json:"contact"`
	CreatedAt     int64  `json:"created_at"`
}

// ============================================
// RAZORPAY PAYMENT SERVICE
// https://razorpay.com/docs/api/
// Free to integrate, charges only on transactions
// ============================================

// RazorpayService implements PaymentService for Razorpay
type RazorpayService struct {
	KeyID     string
	KeySecret string
	BaseURL   string
}

func NewRazorpayService(keyID, keySecret string) *RazorpayService {
	return &RazorpayService{
		KeyID:     keyID,
		KeySecret: keySecret,
		BaseURL:   "https://api.razorpay.com/v1",
	}
}

// CreateOrder creates a new Razorpay order
// Amount should be in paise (100 paise = 1 INR)
func (r *RazorpayService) CreateOrder(amount int64, currency string, receipt string, notes map[string]string) (*PaymentOrder, error) {
	if currency == "" {
		currency = "INR"
	}

	payload := map[string]interface{}{
		"amount":   amount,
		"currency": currency,
		"receipt":  receipt,
		"notes":    notes,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", r.BaseURL+"/orders", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.SetBasicAuth(r.KeyID, r.KeySecret)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("razorpay API error: %s", string(body))
	}

	var order PaymentOrder
	if err := json.NewDecoder(resp.Body).Decode(&order); err != nil {
		return nil, err
	}

	return &order, nil
}

// VerifyPayment verifies the payment signature from Razorpay
func (r *RazorpayService) VerifyPayment(orderID, paymentID, signature string) bool {
	// Create the signature verification string
	data := orderID + "|" + paymentID

	// Generate HMAC SHA256
	h := hmac.New(sha256.New, []byte(r.KeySecret))
	h.Write([]byte(data))
	expectedSignature := hex.EncodeToString(h.Sum(nil))

	return hmac.Equal([]byte(expectedSignature), []byte(signature))
}

// GetPaymentDetails fetches payment details from Razorpay
func (r *RazorpayService) GetPaymentDetails(paymentID string) (*PaymentDetails, error) {
	req, err := http.NewRequest("GET", r.BaseURL+"/payments/"+paymentID, nil)
	if err != nil {
		return nil, err
	}

	req.SetBasicAuth(r.KeyID, r.KeySecret)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("razorpay API error: %s", string(body))
	}

	var payment PaymentDetails
	if err := json.NewDecoder(resp.Body).Decode(&payment); err != nil {
		return nil, err
	}

	return &payment, nil
}

// ============================================
// MOCK PAYMENT SERVICE (Development)
// ============================================

// MockPaymentService for development/testing
type MockPaymentService struct{}

func NewMockPaymentService() *MockPaymentService {
	return &MockPaymentService{}
}

func (m *MockPaymentService) CreateOrder(amount int64, currency string, receipt string, notes map[string]string) (*PaymentOrder, error) {
	return &PaymentOrder{
		ID:         "order_mock_" + fmt.Sprintf("%d", time.Now().UnixNano()),
		Entity:     "order",
		Amount:     amount,
		AmountPaid: 0,
		AmountDue:  amount,
		Currency:   currency,
		Receipt:    receipt,
		Status:     "created",
		CreatedAt:  time.Now().Unix(),
	}, nil
}

func (m *MockPaymentService) VerifyPayment(orderID, paymentID, signature string) bool {
	// In mock mode, always verify successfully
	return true
}

func (m *MockPaymentService) GetPaymentDetails(paymentID string) (*PaymentDetails, error) {
	return &PaymentDetails{
		ID:        paymentID,
		Entity:    "payment",
		Amount:    10000,
		Currency:  "INR",
		Status:    "captured",
		OrderID:   "order_mock",
		Method:    "upi",
		CreatedAt: time.Now().Unix(),
	}, nil
}

// ============================================
// FACTORY FUNCTION
// ============================================

// NewPaymentService creates the appropriate payment service based on environment
func NewPaymentService() PaymentService {
	keyID := os.Getenv("RAZORPAY_KEY_ID")
	keySecret := os.Getenv("RAZORPAY_KEY_SECRET")

	if keyID != "" && keySecret != "" {
		return NewRazorpayService(keyID, keySecret)
	}

	// Default to mock for development
	fmt.Println("⚠️  Using mock payment service (Razorpay not configured)")
	return NewMockPaymentService()
}
