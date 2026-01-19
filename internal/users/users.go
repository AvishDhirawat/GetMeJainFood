package users

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"jainfood/internal/db"
	"jainfood/internal/models"
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
