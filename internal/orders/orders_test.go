package orders

import (
	"strings"
	"testing"
)

func TestGenerateOrderCode(t *testing.T) {
	code, err := GenerateOrderCode()
	if err != nil {
		t.Fatalf("GenerateOrderCode() error = %v", err)
	}

	// Verify format: JF-<ULID>
	if !strings.HasPrefix(code, "JF-") {
		t.Errorf("GenerateOrderCode() = %v, want prefix 'JF-'", code)
	}

	// ULID should be 26 characters
	if len(code) != 29 { // 3 (JF-) + 26 (ULID)
		t.Errorf("GenerateOrderCode() length = %d, want 29", len(code))
	}
}

func TestGenerateOrderCode_Uniqueness(t *testing.T) {
	codes := make(map[string]bool)
	iterations := 100

	for i := 0; i < iterations; i++ {
		code, err := GenerateOrderCode()
		if err != nil {
			t.Fatalf("GenerateOrderCode() error = %v", err)
		}
		if codes[code] {
			t.Errorf("GenerateOrderCode() generated duplicate code: %v", code)
		}
		codes[code] = true
	}
}
