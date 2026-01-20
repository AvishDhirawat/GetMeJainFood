package users

import (
	"context"
	"fmt"

	"jainfood/internal/db"
	"jainfood/internal/models"

	"github.com/google/uuid"
)

// CreateUser creates a new user with phone-based registration.
func CreateUser(ctx context.Context, phone, name, role string, preferences map[string]interface{}) (*models.User, error) {
	id := uuid.New().String()

	_, err := db.Pool.Exec(ctx, `
		INSERT INTO users (id, phone, name, role, preferences)
		VALUES ($1, $2, $3, $4, $5)
	`, id, phone, name, role, preferences)
	if err != nil {
		return nil, err
	}

	return &models.User{
		ID:          id,
		Phone:       phone,
		Name:        name,
		Role:        role,
		Preferences: preferences,
	}, nil
}

// GetUserByID retrieves a user by ID.
func GetUserByID(ctx context.Context, userID string) (*models.User, error) {
	u := &models.User{}
	err := db.Pool.QueryRow(ctx, `
		SELECT id, phone, name, email, role, preferences, created_at
		FROM users WHERE id = $1
	`, userID).Scan(&u.ID, &u.Phone, &u.Name, &u.Email, &u.Role, &u.Preferences, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return u, nil
}

// GetUserByPhone retrieves a user by phone number.
func GetUserByPhone(ctx context.Context, phone string) (*models.User, error) {
	u := &models.User{}
	err := db.Pool.QueryRow(ctx, `
		SELECT id, phone, name, email, role, preferences, created_at
		FROM users WHERE phone = $1
	`, phone).Scan(&u.ID, &u.Phone, &u.Name, &u.Email, &u.Role, &u.Preferences, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return u, nil
}

// GetOrCreateUser finds existing user by phone or creates a new one.
func GetOrCreateUser(ctx context.Context, phone string, role string) (*models.User, bool, error) {
	user, err := GetUserByPhone(ctx, phone)
	if err == nil {
		return user, false, nil
	}
	// User doesn't exist, create new
	user, err = CreateUser(ctx, phone, "", role, nil)
	if err != nil {
		return nil, false, err
	}
	return user, true, nil
}

// UpdateUser updates user profile.
func UpdateUser(ctx context.Context, userID, name, email string, preferences map[string]interface{}) error {
	ct, err := db.Pool.Exec(ctx, `
		UPDATE users
		SET name = $2, email = $3, preferences = $4
		WHERE id = $1
	`, userID, name, email, preferences)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("user not found")
	}
	return nil
}

// DeleteUser removes a user (for GDPR/privacy compliance).
func DeleteUser(ctx context.Context, userID string) error {
	ct, err := db.Pool.Exec(ctx, `DELETE FROM users WHERE id = $1`, userID)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("user not found")
	}
	return nil
}

// ListUsers retrieves users with pagination (admin only).
func ListUsers(ctx context.Context, limit, offset int) ([]*models.User, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT id, phone, name, email, role, preferences, created_at
		FROM users
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		u := &models.User{}
		if err := rows.Scan(&u.ID, &u.Phone, &u.Name, &u.Email, &u.Role, &u.Preferences, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

// BlockUser blocks a user (admin only)
func BlockUser(ctx context.Context, userID, reason string) error {
	ct, err := db.Pool.Exec(ctx, `
		UPDATE users SET blocked = true, blocked_reason = $2 WHERE id = $1
	`, userID, reason)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("user not found")
	}
	return nil
}

// UnblockUser unblocks a user (admin only)
func UnblockUser(ctx context.Context, userID string) error {
	ct, err := db.Pool.Exec(ctx, `
		UPDATE users SET blocked = false, blocked_reason = NULL WHERE id = $1
	`, userID)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("user not found")
	}
	return nil
}

// CheckPhoneExists checks if a phone number is already registered
func CheckPhoneExists(ctx context.Context, phone string) (bool, error) {
	var exists bool
	err := db.Pool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM users WHERE phone = $1)
	`, phone).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}

// RegisterUser creates a new user with full registration details.
// If termsAccepted is true, records terms_accepted_at.
func RegisterUser(ctx context.Context, phone, name, email, role string, termsAccepted bool) (*models.User, error) {
	// Check if user already exists
	exists, err := CheckPhoneExists(ctx, phone)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, fmt.Errorf("phone number already registered")
	}

	id := uuid.New().String()

	_, err = db.Pool.Exec(ctx, `
		INSERT INTO users (id, phone, name, email, role, created_at, terms_accepted_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), CASE WHEN $6 THEN NOW() ELSE NULL END)
	`, id, phone, name, email, role, termsAccepted)
	if err != nil {
		return nil, err
	}

	return &models.User{
		ID:    id,
		Phone: phone,
		Name:  name,
		Email: email,
		Role:  role,
	}, nil
}

// GetUserByPhoneWithStatus retrieves user by phone with blocked status check
func GetUserByPhoneWithStatus(ctx context.Context, phone string) (*models.User, bool, error) {
	u := &models.User{}
	var blocked bool
	err := db.Pool.QueryRow(ctx, `
		SELECT id, phone, name, email, role, preferences, blocked, created_at
		FROM users WHERE phone = $1
	`, phone).Scan(&u.ID, &u.Phone, &u.Name, &u.Email, &u.Role, &u.Preferences, &blocked, &u.CreatedAt)
	if err != nil {
		return nil, false, err
	}
	return u, blocked, nil
}
