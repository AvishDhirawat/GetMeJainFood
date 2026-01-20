package push

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// ============================================
// PUSH NOTIFICATION SERVICE INTERFACE
// ============================================

// PushService defines the interface for push notifications
type PushService interface {
	SendToDevice(token string, title, body string, data map[string]string) error
	SendToTopic(topic string, title, body string, data map[string]string) error
}

// PushMessage represents a push notification message
type PushMessage struct {
	Title string            `json:"title"`
	Body  string            `json:"body"`
	Data  map[string]string `json:"data,omitempty"`
}

// ============================================
// FIREBASE CLOUD MESSAGING (FCM) SERVICE
// https://firebase.google.com/docs/cloud-messaging
// Free tier: Unlimited notifications
// ============================================

// FCMService implements PushService for Firebase Cloud Messaging
type FCMService struct {
	ServerKey  string // Legacy server key (deprecated but still works)
	ProjectID  string
	BaseURL    string
}

func NewFCMService(serverKey, projectID string) *FCMService {
	return &FCMService{
		ServerKey: serverKey,
		ProjectID: projectID,
		BaseURL:   "https://fcm.googleapis.com/fcm/send",
	}
}

// FCM request payload structure
type fcmRequest struct {
	To           string            `json:"to,omitempty"`
	Topic        string            `json:"topic,omitempty"`
	Notification *fcmNotification  `json:"notification"`
	Data         map[string]string `json:"data,omitempty"`
	Priority     string            `json:"priority"`
}

type fcmNotification struct {
	Title string `json:"title"`
	Body  string `json:"body"`
	Icon  string `json:"icon,omitempty"`
	Sound string `json:"sound,omitempty"`
}

// SendToDevice sends a push notification to a specific device
func (f *FCMService) SendToDevice(token string, title, body string, data map[string]string) error {
	payload := fcmRequest{
		To: token,
		Notification: &fcmNotification{
			Title: title,
			Body:  body,
			Icon:  "notification_icon",
			Sound: "default",
		},
		Data:     data,
		Priority: "high",
	}

	return f.send(payload)
}

// SendToTopic sends a push notification to all subscribers of a topic
func (f *FCMService) SendToTopic(topic string, title, body string, data map[string]string) error {
	payload := fcmRequest{
		To: "/topics/" + topic,
		Notification: &fcmNotification{
			Title: title,
			Body:  body,
			Icon:  "notification_icon",
			Sound: "default",
		},
		Data:     data,
		Priority: "high",
	}

	return f.send(payload)
}

func (f *FCMService) send(payload fcmRequest) error {
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", f.BaseURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "key="+f.ServerKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("FCM API error: %s", string(body))
	}

	var result struct {
		Success int `json:"success"`
		Failure int `json:"failure"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return err
	}

	if result.Failure > 0 {
		return fmt.Errorf("FCM: %d messages failed", result.Failure)
	}

	return nil
}

// ============================================
// MOCK PUSH SERVICE (Development)
// ============================================

// MockPushService for development/testing
type MockPushService struct{}

func NewMockPushService() *MockPushService {
	return &MockPushService{}
}

func (m *MockPushService) SendToDevice(token string, title, body string, data map[string]string) error {
	fmt.Printf("\n==========================================\n")
	fmt.Printf("🔔 PUSH NOTIFICATION (Development Mode)\n")
	fmt.Printf("==========================================\n")
	fmt.Printf("Token: %s...\n", token[:min(20, len(token))])
	fmt.Printf("Title: %s\n", title)
	fmt.Printf("Body:  %s\n", body)
	fmt.Printf("Data:  %v\n", data)
	fmt.Printf("==========================================\n\n")
	return nil
}

func (m *MockPushService) SendToTopic(topic string, title, body string, data map[string]string) error {
	fmt.Printf("\n==========================================\n")
	fmt.Printf("🔔 PUSH NOTIFICATION TO TOPIC (Development Mode)\n")
	fmt.Printf("==========================================\n")
	fmt.Printf("Topic: %s\n", topic)
	fmt.Printf("Title: %s\n", title)
	fmt.Printf("Body:  %s\n", body)
	fmt.Printf("Data:  %v\n", data)
	fmt.Printf("==========================================\n\n")
	return nil
}

// ============================================
// NOTIFICATION HELPERS
// ============================================

// Common notification types for JainFood app
type NotificationHelper struct {
	push PushService
}

func NewNotificationHelper(push PushService) *NotificationHelper {
	return &NotificationHelper{push: push}
}

// NotifyNewOrder sends notification when a new order is placed
func (n *NotificationHelper) NotifyNewOrder(providerToken string, orderID, buyerName string, total float64) error {
	return n.push.SendToDevice(
		providerToken,
		"🆕 New Order Received!",
		fmt.Sprintf("Order from %s - ₹%.2f", buyerName, total),
		map[string]string{
			"type":     "new_order",
			"order_id": orderID,
		},
	)
}

// NotifyOrderConfirmed sends notification when order is confirmed
func (n *NotificationHelper) NotifyOrderConfirmed(buyerToken string, orderID, providerName string) error {
	return n.push.SendToDevice(
		buyerToken,
		"✅ Order Confirmed!",
		fmt.Sprintf("Your order from %s has been confirmed", providerName),
		map[string]string{
			"type":     "order_confirmed",
			"order_id": orderID,
		},
	)
}

// NotifyOrderReady sends notification when order is ready
func (n *NotificationHelper) NotifyOrderReady(buyerToken string, orderID, providerName string) error {
	return n.push.SendToDevice(
		buyerToken,
		"🍽️ Order Ready!",
		fmt.Sprintf("Your order from %s is ready for pickup/delivery", providerName),
		map[string]string{
			"type":     "order_ready",
			"order_id": orderID,
		},
	)
}

// NotifyNewMessage sends notification for chat messages
func (n *NotificationHelper) NotifyNewMessage(token string, senderName, message string, chatID string) error {
	return n.push.SendToDevice(
		token,
		fmt.Sprintf("💬 Message from %s", senderName),
		message,
		map[string]string{
			"type":    "new_message",
			"chat_id": chatID,
		},
	)
}

// ============================================
// FACTORY FUNCTION
// ============================================

// NewPushService creates the appropriate push service based on environment
func NewPushService() PushService {
	serverKey := os.Getenv("FCM_SERVER_KEY")
	projectID := os.Getenv("FCM_PROJECT_ID")

	if serverKey != "" {
		return NewFCMService(serverKey, projectID)
	}

	// Default to mock for development
	fmt.Println("⚠️  Using mock push service (FCM not configured)")
	return NewMockPushService()
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
