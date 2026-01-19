package providers

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"jainfood/internal/db"
	"jainfood/internal/models"
)

// CreateProvider creates a new provider profile for a user.
func CreateProvider(ctx context.Context, userID, businessName, address string, lat, lng float64, tags []string) (*models.Provider, error) {
	id := uuid.New().String()

	_, err := db.Pool.Exec(ctx, `
		INSERT INTO providers (id, user_id, business_name, address, geo, tags, verified)
		VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography, $7, FALSE)
	`, id, userID, businessName, address, lng, lat, tags)
	if err != nil {
		return nil, err
	}

	return &models.Provider{
		ID:           id,
		UserID:       userID,
		BusinessName: businessName,
		Address:      address,
		Lat:          lat,
		Lng:          lng,
		Tags:         tags,
		Verified:     false,
	}, nil
}

// GetProvider retrieves a provider by ID.
func GetProvider(ctx context.Context, providerID string) (*models.Provider, error) {
	p := &models.Provider{}
	err := db.Pool.QueryRow(ctx, `
		SELECT id, user_id, business_name, address, 
		       ST_Y(geo::geometry) as lat, ST_X(geo::geometry) as lng,
		       verified, tags, rating, created_at
		FROM providers WHERE id = $1
	`, providerID).Scan(
		&p.ID, &p.UserID, &p.BusinessName, &p.Address,
		&p.Lat, &p.Lng, &p.Verified, &p.Tags, &p.Rating, &p.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return p, nil
}

// GetProviderByUserID retrieves a provider by the owning user ID.
func GetProviderByUserID(ctx context.Context, userID string) (*models.Provider, error) {
	p := &models.Provider{}
	err := db.Pool.QueryRow(ctx, `
		SELECT id, user_id, business_name, address, 
		       ST_Y(geo::geometry) as lat, ST_X(geo::geometry) as lng,
		       verified, tags, rating, created_at
		FROM providers WHERE user_id = $1
	`, userID).Scan(
		&p.ID, &p.UserID, &p.BusinessName, &p.Address,
		&p.Lat, &p.Lng, &p.Verified, &p.Tags, &p.Rating, &p.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return p, nil
}

// UpdateProvider updates provider details.
func UpdateProvider(ctx context.Context, providerID, businessName, address string, lat, lng float64, tags []string) error {
	ct, err := db.Pool.Exec(ctx, `
		UPDATE providers
		SET business_name = $2, address = $3, 
		    geo = ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography,
		    tags = $6
		WHERE id = $1
	`, providerID, businessName, address, lng, lat, tags)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("provider not found")
	}
	return nil
}

// VerifyProvider sets verified status (admin action).
func VerifyProvider(ctx context.Context, providerID string, verified bool) error {
	ct, err := db.Pool.Exec(ctx, `UPDATE providers SET verified = $2 WHERE id = $1`, providerID, verified)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("provider not found")
	}
	return nil
}

// ListProviders retrieves all providers (with pagination).
func ListProviders(ctx context.Context, limit, offset int) ([]*models.Provider, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT id, user_id, business_name, address, 
		       ST_Y(geo::geometry) as lat, ST_X(geo::geometry) as lng,
		       verified, tags, rating, created_at
		FROM providers
		ORDER BY created_at DESC
		LIMIT $1 OFFSET $2
	`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var providers []*models.Provider
	for rows.Next() {
		p := &models.Provider{}
		if err := rows.Scan(
			&p.ID, &p.UserID, &p.BusinessName, &p.Address,
			&p.Lat, &p.Lng, &p.Verified, &p.Tags, &p.Rating, &p.CreatedAt,
		); err != nil {
			return nil, err
		}
		providers = append(providers, p)
	}
	return providers, nil
}

// BlockProvider blocks a provider (admin only)
func BlockProvider(ctx context.Context, providerID, reason string) error {
	ct, err := db.Pool.Exec(ctx, `
		UPDATE providers SET blocked = true, blocked_reason = $2 WHERE id = $1
	`, providerID, reason)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("provider not found")
	}
	return nil
}

// UnblockProvider unblocks a provider (admin only)
func UnblockProvider(ctx context.Context, providerID string) error {
	ct, err := db.Pool.Exec(ctx, `
		UPDATE providers SET blocked = false, blocked_reason = NULL WHERE id = $1
	`, providerID)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("provider not found")
	}
	return nil
}

