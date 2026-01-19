package middleware

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestGenerateJWT(t *testing.T) {
	secret := "test-secret"
	userID := "user-123"
	phone := "+1234567890"
	role := "buyer"

	token, err := GenerateJWT(secret, userID, phone, role)
	if err != nil {
		t.Fatalf("GenerateJWT() error = %v", err)
	}

	if token == "" {
		t.Error("GenerateJWT() returned empty token")
	}

	// Verify the token can be parsed
	claims := &Claims{}
	parsedToken, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	if err != nil {
		t.Fatalf("Failed to parse token: %v", err)
	}

	if !parsedToken.Valid {
		t.Error("Token is not valid")
	}

	if claims.UserID != userID {
		t.Errorf("Claims.UserID = %v, want %v", claims.UserID, userID)
	}

	if claims.Phone != phone {
		t.Errorf("Claims.Phone = %v, want %v", claims.Phone, phone)
	}

	if claims.Role != role {
		t.Errorf("Claims.Role = %v, want %v", claims.Role, role)
	}

	if claims.Issuer != "jainfood" {
		t.Errorf("Claims.Issuer = %v, want jainfood", claims.Issuer)
	}
}

func TestGenerateJWT_Expiration(t *testing.T) {
	secret := "test-secret"
	token, err := GenerateJWT(secret, "user-123", "+1234567890", "buyer")
	if err != nil {
		t.Fatalf("GenerateJWT() error = %v", err)
	}

	claims := &Claims{}
	parsedToken, _ := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	if parsedToken == nil {
		t.Fatal("Failed to parse token")
	}

	// Token should expire in about 24 hours
	expiresAt := claims.ExpiresAt.Time
	expectedExpiry := time.Now().Add(24 * time.Hour)

	// Allow 1 minute tolerance
	if expiresAt.Before(expectedExpiry.Add(-time.Minute)) || expiresAt.After(expectedExpiry.Add(time.Minute)) {
		t.Errorf("Token expiry is not ~24 hours from now: got %v", expiresAt)
	}
}

func TestGenerateJWT_DifferentSecrets(t *testing.T) {
	secret1 := "secret-1"
	secret2 := "secret-2"

	token, err := GenerateJWT(secret1, "user-123", "+1234567890", "buyer")
	if err != nil {
		t.Fatalf("GenerateJWT() error = %v", err)
	}

	// Token should fail validation with different secret
	claims := &Claims{}
	_, err = jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret2), nil
	})

	if err == nil {
		t.Error("Token should not be valid with different secret")
	}
}
