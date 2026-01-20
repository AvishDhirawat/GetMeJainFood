package util

import (
	"os"
	"testing"
)

func TestLoad(t *testing.T) {
	// Load() requires these env vars; set dummy values for test.
	os.Setenv("DATABASE_URL", "postgres://user:pass@localhost:5432/db?sslmode=disable")
	os.Setenv("JWT_SECRET", "test_jwt_secret")
	os.Setenv("OTP_SECRET", "test_otp_secret")
	defer func() {
		os.Unsetenv("DATABASE_URL")
		os.Unsetenv("JWT_SECRET")
		os.Unsetenv("OTP_SECRET")
	}()

	cfg := Load()

	if cfg == nil {
		t.Fatal("Load() returned nil")
	}

	// Verify defaults are set
	if cfg.Port == "" {
		t.Error("Load() Port should have a default value")
	}

	if cfg.DatabaseURL == "" {
		t.Error("Load() DatabaseURL should have a default value")
	}

	if cfg.RedisAddr == "" {
		t.Error("Load() RedisAddr should have a default value")
	}
}

func TestLoad_WithEnvOverrides(t *testing.T) {
	// Set environment variables
	os.Setenv("DATABASE_URL", "postgres://user:pass@localhost:5432/db?sslmode=disable")
	os.Setenv("JWT_SECRET", "test_jwt_secret")
	os.Setenv("OTP_SECRET", "test_otp_secret")
	os.Setenv("PORT", "9090")
	os.Setenv("REDIS_ADDR", "redis:6380")
	defer func() {
		os.Unsetenv("DATABASE_URL")
		os.Unsetenv("JWT_SECRET")
		os.Unsetenv("OTP_SECRET")
		os.Unsetenv("PORT")
		os.Unsetenv("REDIS_ADDR")
	}()

	cfg := Load()

	if cfg.Port != "9090" {
		t.Errorf("Load() Port = %v, want 9090", cfg.Port)
	}

	if cfg.RedisAddr != "redis:6380" {
		t.Errorf("Load() RedisAddr = %v, want redis:6380", cfg.RedisAddr)
	}
}

func TestGetEnv(t *testing.T) {
	// Test with existing env var
	os.Setenv("TEST_VAR", "test_value")
	defer os.Unsetenv("TEST_VAR")

	result := getEnv("TEST_VAR", "default")
	if result != "test_value" {
		t.Errorf("getEnv() = %v, want test_value", result)
	}

	// Test with non-existing env var
	result = getEnv("NON_EXISTING_VAR", "default_value")
	if result != "default_value" {
		t.Errorf("getEnv() = %v, want default_value", result)
	}
}
