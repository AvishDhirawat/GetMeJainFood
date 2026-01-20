package notify

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/smtp"
	"os"
	"strings"
)

// NotifyService defines the interface for sending notifications
type NotifyService interface {
	SendOTP(phone, otp string) error
}

// ============================================
// CONSOLE NOTIFIER (Development)
// ============================================

// ConsoleNotifier prints OTP to console (for development)
type ConsoleNotifier struct{}

func NewConsoleNotifier() *ConsoleNotifier {
	return &ConsoleNotifier{}
}

func (c *ConsoleNotifier) SendOTP(phone, otp string) error {
	fmt.Printf("\n==========================================\n")
	fmt.Printf("📱 OTP NOTIFICATION (Development Mode)\n")
	fmt.Printf("==========================================\n")
	fmt.Printf("Phone: %s\n", phone)
	fmt.Printf("OTP:   %s\n", otp)
	fmt.Printf("==========================================\n\n")
	return nil
}

// ============================================
// EMAIL NOTIFIER (Using Resend - Free 3000/month)
// ============================================

// EmailNotifier sends OTP via email (good for dev/staging)
type EmailNotifier struct {
	APIKey    string
	FromEmail string
	ToEmail   string // For dev, send to a single test email
}

func NewEmailNotifier(apiKey, fromEmail, toEmail string) *EmailNotifier {
	return &EmailNotifier{
		APIKey:    apiKey,
		FromEmail: fromEmail,
		ToEmail:   toEmail,
	}
}

func (e *EmailNotifier) SendOTP(phone, otp string) error {
	// Resend API
	url := "https://api.resend.com/emails"

	payload := map[string]interface{}{
		"from":    e.FromEmail,
		"to":      []string{e.ToEmail},
		"subject": fmt.Sprintf("JainFood OTP: %s", otp),
		"html": fmt.Sprintf(`
			<div style="font-family: Arial, sans-serif; padding: 20px;">
				<h2>🍽️ JainFood - OTP Verification</h2>
				<p>Phone: <strong>%s</strong></p>
				<p>Your OTP is:</p>
				<h1 style="font-size: 32px; letter-spacing: 8px; color: #f97316;">%s</h1>
				<p style="color: #666;">This OTP is valid for 10 minutes.</p>
				<hr>
				<p style="font-size: 12px; color: #999;">
					This is a development notification. In production, this would be sent via SMS.
				</p>
			</div>
		`, phone, otp),
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+e.APIKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("resend API error: status %d", resp.StatusCode)
	}

	return nil
}

// ============================================
// SMTP EMAIL NOTIFIER (Free - use Gmail, etc.)
// ============================================

// SMTPNotifier sends OTP via SMTP (use Gmail App Password for free)
type SMTPNotifier struct {
	Host     string
	Port     string
	Username string
	Password string
	FromName string
	ToEmail  string
}

func NewSMTPNotifier(host, port, username, password, fromName, toEmail string) *SMTPNotifier {
	return &SMTPNotifier{
		Host:     host,
		Port:     port,
		Username: username,
		Password: password,
		FromName: fromName,
		ToEmail:  toEmail,
	}
}

func (s *SMTPNotifier) SendOTP(phone, otp string) error {
	auth := smtp.PlainAuth("", s.Username, s.Password, s.Host)

	subject := fmt.Sprintf("JainFood OTP: %s", otp)
	body := fmt.Sprintf(`
Phone: %s
Your OTP is: %s

This OTP is valid for 10 minutes.
	`, phone, otp)

	msg := []byte(fmt.Sprintf("From: %s <%s>\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"\r\n"+
		"%s", s.FromName, s.Username, s.ToEmail, subject, body))

	return smtp.SendMail(s.Host+":"+s.Port, auth, s.Username, []string{s.ToEmail}, msg)
}

// ============================================
// MSG91 SMS NOTIFIER (India - 100 free SMS/month)
// ============================================

// MSG91Notifier sends OTP via MSG91 (India-specific)
type MSG91Notifier struct {
	AuthKey    string
	TemplateID string
	SenderID   string
}

func NewMSG91Notifier(authKey, templateID, senderID string) *MSG91Notifier {
	return &MSG91Notifier{
		AuthKey:    authKey,
		TemplateID: templateID,
		SenderID:   senderID,
	}
}

func (m *MSG91Notifier) SendOTP(phone, otp string) error {
	url := "https://api.msg91.com/api/v5/otp"

	// Ensure phone has country code
	if !strings.HasPrefix(phone, "91") {
		phone = "91" + phone
	}

	payload := map[string]interface{}{
		"template_id": m.TemplateID,
		"mobile":      phone,
		"authkey":     m.AuthKey,
		"otp":         otp,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	req.Header.Set("authkey", m.AuthKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("MSG91 API error: status %d", resp.StatusCode)
	}

	return nil
}

// ============================================
// TEXTBELT SMS NOTIFIER (Free 1 SMS/day or use API key)
// https://github.com/typpo/textbelt
// ============================================

// TextbeltNotifier sends OTP via Textbelt API
// Free tier: 1 SMS/day with key "textbelt"
// Paid tier: $0.005/SMS with purchased key
type TextbeltNotifier struct {
	APIKey string // Use "textbelt" for free tier (1 SMS/day)
}

func NewTextbeltNotifier(apiKey string) *TextbeltNotifier {
	if apiKey == "" {
		apiKey = "textbelt" // Free tier key
	}
	return &TextbeltNotifier{
		APIKey: apiKey,
	}
}

func (t *TextbeltNotifier) SendOTP(phone, otp string) error {
	url := "https://textbelt.com/text"

	// Format phone with country code for India
	formattedPhone := phone
	if !strings.HasPrefix(phone, "+") {
		if strings.HasPrefix(phone, "91") {
			formattedPhone = "+" + phone
		} else {
			formattedPhone = "+91" + phone
		}
	}

	payload := map[string]interface{}{
		"phone":   formattedPhone,
		"message": fmt.Sprintf("Your JainFood OTP is: %s. Valid for 10 minutes. Do not share with anyone.", otp),
		"key":     t.APIKey,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var result struct {
		Success      bool   `json:"success"`
		TextID       string `json:"textId"`
		QuotaRemain  int    `json:"quotaRemaining"`
		Error        string `json:"error"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return fmt.Errorf("textbelt response decode error: %v", err)
	}

	if !result.Success {
		return fmt.Errorf("textbelt API error: %s", result.Error)
	}

	fmt.Printf("📱 Textbelt SMS sent! TextID: %s, Quota remaining: %d\n", result.TextID, result.QuotaRemain)
	return nil
}

// ============================================
// SMS INDIA HUB NOTIFIER
// https://cloud.smsindiahub.in/
// ============================================

// SMSIndiaHubNotifier sends OTP via SMS India Hub API
type SMSIndiaHubNotifier struct {
	APIKey   string
	SenderID string
	Channel  string // "Trans" for transactional, "Promo" for promotional
	Route    string
	PEId     string // Principal Entity ID (for DLT registration)
	DCS      string // Data Coding Scheme (0 for normal, 8 for Unicode)
}

func NewSMSIndiaHubNotifier(apiKey, senderID, channel, route, peId string) *SMSIndiaHubNotifier {
	if channel == "" {
		channel = "Trans" // Transactional for OTP
	}
	if senderID == "" {
		senderID = "JAINFO"
	}
	return &SMSIndiaHubNotifier{
		APIKey:   apiKey,
		SenderID: senderID,
		Channel:  channel,
		Route:    route,
		PEId:     peId,
		DCS:      "0",
	}
}

func (s *SMSIndiaHubNotifier) SendOTP(phone, otp string) error {
	// Format phone number - ensure it has 91 prefix
	formattedPhone := phone
	if !strings.HasPrefix(phone, "91") {
		formattedPhone = "91" + strings.TrimPrefix(phone, "+")
	}
	formattedPhone = strings.TrimPrefix(formattedPhone, "+")

	// Construct the message
	message := fmt.Sprintf("Your JainFood OTP is %s. Valid for 10 minutes. Do not share with anyone. - JainFood", otp)

	// Build URL with query parameters
	baseURL := "https://cloud.smsindiahub.in/api/mt/SendSMS"

	// URL encode the message
	encodedMessage := strings.ReplaceAll(message, " ", "%20")

	url := fmt.Sprintf("%s?APIKey=%s&senderid=%s&channel=%s&DCS=%s&flashsms=0&number=%s&text=%s",
		baseURL,
		s.APIKey,
		s.SenderID,
		s.Channel,
		s.DCS,
		formattedPhone,
		encodedMessage,
	)

	// Add optional parameters if set
	if s.Route != "" {
		url += "&route=" + s.Route
	}
	if s.PEId != "" {
		url += "&PEId=" + s.PEId
	}

	// Make the request
	resp, err := http.Get(url)
	if err != nil {
		return fmt.Errorf("SMS India Hub request failed: %v", err)
	}
	defer resp.Body.Close()

	// Parse response
	var result struct {
		ErrorCode    string `json:"ErrorCode"`
		ErrorMessage string `json:"ErrorMessage"`
		JobId        string `json:"JobId"`
		MessageData  []struct {
			Number    string `json:"Number"`
			MessageId string `json:"MessageId"`
		} `json:"MessageData"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return fmt.Errorf("SMS India Hub response decode error: %v", err)
	}

	// Check for errors - "000" means success
	if result.ErrorCode != "000" {
		return fmt.Errorf("SMS India Hub API error: %s (code: %s)", result.ErrorMessage, result.ErrorCode)
	}

	// Log success
	if len(result.MessageData) > 0 {
		fmt.Printf("📱 SMS India Hub: OTP sent! JobId: %s, MessageId: %s\n", result.JobId, result.MessageData[0].MessageId)
	} else {
		fmt.Printf("📱 SMS India Hub: OTP sent! JobId: %s\n", result.JobId)
	}

	return nil
}

// ============================================
// FACTORY FUNCTION
// ============================================

// NewNotifier creates the appropriate notifier based on environment
func NewNotifier() NotifyService {
	env := os.Getenv("NOTIFY_SERVICE")

	switch env {
	case "smsindiahub":
		apiKey := os.Getenv("SMSINDIAHUB_API_KEY")
		senderID := os.Getenv("SMSINDIAHUB_SENDER_ID")
		channel := os.Getenv("SMSINDIAHUB_CHANNEL")
		route := os.Getenv("SMSINDIAHUB_ROUTE")
		peId := os.Getenv("SMSINDIAHUB_PEID")
		if apiKey != "" {
			return NewSMSIndiaHubNotifier(apiKey, senderID, channel, route, peId)
		}

	case "textbelt":
		apiKey := os.Getenv("TEXTBELT_API_KEY")
		return NewTextbeltNotifier(apiKey)

	case "resend":
		apiKey := os.Getenv("RESEND_API_KEY")
		fromEmail := os.Getenv("RESEND_FROM_EMAIL")
		toEmail := os.Getenv("RESEND_TO_EMAIL")
		if apiKey != "" && fromEmail != "" && toEmail != "" {
			return NewEmailNotifier(apiKey, fromEmail, toEmail)
		}

	case "smtp":
		host := os.Getenv("SMTP_HOST")
		port := os.Getenv("SMTP_PORT")
		username := os.Getenv("SMTP_USERNAME")
		password := os.Getenv("SMTP_PASSWORD")
		toEmail := os.Getenv("SMTP_TO_EMAIL")
		if host != "" && username != "" && password != "" {
			return NewSMTPNotifier(host, port, username, password, "JainFood", toEmail)
		}

	case "msg91":
		authKey := os.Getenv("MSG91_AUTH_KEY")
		templateID := os.Getenv("MSG91_TEMPLATE_ID")
		senderID := os.Getenv("MSG91_SENDER_ID")
		if authKey != "" && templateID != "" {
			return NewMSG91Notifier(authKey, templateID, senderID)
		}
	}

	// Default to console for development
	return NewConsoleNotifier()
}
