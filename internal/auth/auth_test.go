package auth

import (
	"testing"
)

func TestGenerateOTP(t *testing.T) {
	otp, err := GenerateOTP()
	if err != nil {
		t.Fatalf("GenerateOTP() error = %v", err)
	}
	if len(otp) != 6 {
		t.Errorf("GenerateOTP() = %v, want 6 digit string", otp)
	}
}

func TestHashOTP(t *testing.T) {
	secret := "test-secret"
	otp := "123456"

	hash1 := HashOTP(secret, otp)
	hash2 := HashOTP(secret, otp)

	if hash1 != hash2 {
		t.Errorf("HashOTP() should be deterministic: %v != %v", hash1, hash2)
	}

	// Different OTPs should produce different hashes
	hash3 := HashOTP(secret, "654321")
	if hash1 == hash3 {
		t.Errorf("HashOTP() should produce different hashes for different OTPs")
	}

	// Different secrets should produce different hashes
	hash4 := HashOTP("different-secret", otp)
	if hash1 == hash4 {
		t.Errorf("HashOTP() should produce different hashes for different secrets")
	}
}
