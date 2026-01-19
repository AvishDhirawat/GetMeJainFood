package search

import (
	"context"
	"fmt"
	"strings"

	"jainfood/internal/db"
	"jainfood/internal/models"
)

// SearchFilters holds filter criteria for provider/item search.
type SearchFilters struct {
	Lat           float64  // User's latitude
	Lng           float64  // User's longitude
	RadiusMeters  float64  // Search radius in meters
	JainOnly      bool     // Only show Jain-compliant items
	Tags          []string // Provider tags to filter by (e.g., "sattvic", "no-root-veggies")
	MinRating     float64  // Minimum provider rating
	PriceMax      float64  // Maximum item price (future)
	Query         string   // Full-text search query
	AvailableOnly bool     // Only show available items
}

// ProviderSearchResult represents a provider in search results.
type ProviderSearchResult struct {
	models.Provider
	Distance float64 `json:"distance_meters"`
}

// SearchNearbyProviders finds providers within a radius using PostGIS.
func SearchNearbyProviders(ctx context.Context, filters SearchFilters, limit, offset int) ([]*ProviderSearchResult, error) {
	query := `
		SELECT id, user_id, business_name, address, 
		       ST_Y(geo::geometry) as lat, ST_X(geo::geometry) as lng,
		       verified, tags, rating, created_at,
		       ST_Distance(geo, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
		FROM providers
		WHERE ST_DWithin(geo, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
	`
	args := []interface{}{filters.Lng, filters.Lat, filters.RadiusMeters}
	argIdx := 4

	// Add tag filtering
	if len(filters.Tags) > 0 {
		query += fmt.Sprintf(" AND tags && $%d", argIdx)
		args = append(args, filters.Tags)
		argIdx++
	}

	// Add rating filter
	if filters.MinRating > 0 {
		query += fmt.Sprintf(" AND rating >= $%d", argIdx)
		args = append(args, filters.MinRating)
		argIdx++
	}

	// Only verified providers
	query += " AND verified = TRUE"

	query += " ORDER BY distance ASC"
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, limit, offset)

	rows, err := db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*ProviderSearchResult
	for rows.Next() {
		r := &ProviderSearchResult{}
		if err := rows.Scan(
			&r.ID, &r.UserID, &r.BusinessName, &r.Address,
			&r.Lat, &r.Lng, &r.Verified, &r.Tags, &r.Rating, &r.CreatedAt,
			&r.Distance,
		); err != nil {
			return nil, err
		}
		results = append(results, r)
	}
	return results, nil
}

// ItemSearchResult represents an item in search results with provider info.
type ItemSearchResult struct {
	models.MenuItem
	ProviderID       string  `json:"provider_id"`
	ProviderName     string  `json:"provider_name"`
	ProviderDistance float64 `json:"provider_distance_meters"`
}

// SearchMenuItems searches for menu items with full-text search and filters.
func SearchMenuItems(ctx context.Context, filters SearchFilters, limit, offset int) ([]*ItemSearchResult, error) {
	query := `
		SELECT mi.id, mi.menu_id, mi.name, mi.price, mi.ingredients, 
		       mi.is_jain, mi.availability, mi.image_url, mi.created_at,
		       p.id as provider_id, p.business_name,
		       ST_Distance(p.geo, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
		FROM menu_items mi
		JOIN menus m ON mi.menu_id = m.id
		JOIN providers p ON m.provider_id = p.id
		WHERE p.verified = TRUE
		  AND ST_DWithin(p.geo, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
	`
	args := []interface{}{filters.Lng, filters.Lat, filters.RadiusMeters}
	argIdx := 4

	// Jain-only filter
	if filters.JainOnly {
		query += " AND mi.is_jain = TRUE"
	}

	// Available items only
	if filters.AvailableOnly {
		query += " AND mi.availability = TRUE"
	}

	// Full-text search on item name
	if filters.Query != "" {
		query += fmt.Sprintf(" AND to_tsvector('english', mi.name) @@ plainto_tsquery('english', $%d)", argIdx)
		args = append(args, filters.Query)
		argIdx++
	}

	// Provider tags filter
	if len(filters.Tags) > 0 {
		query += fmt.Sprintf(" AND p.tags && $%d", argIdx)
		args = append(args, filters.Tags)
		argIdx++
	}

	// Min rating filter
	if filters.MinRating > 0 {
		query += fmt.Sprintf(" AND p.rating >= $%d", argIdx)
		args = append(args, filters.MinRating)
		argIdx++
	}

	// Price filter
	if filters.PriceMax > 0 {
		query += fmt.Sprintf(" AND mi.price <= $%d", argIdx)
		args = append(args, filters.PriceMax)
		argIdx++
	}

	query += " ORDER BY distance ASC, mi.name ASC"
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, limit, offset)

	rows, err := db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*ItemSearchResult
	for rows.Next() {
		r := &ItemSearchResult{}
		if err := rows.Scan(
			&r.ID, &r.MenuID, &r.Name, &r.Price, &r.Ingredients,
			&r.IsJain, &r.Availability, &r.ImageURL, &r.CreatedAt,
			&r.ProviderID, &r.ProviderName, &r.ProviderDistance,
		); err != nil {
			return nil, err
		}
		results = append(results, r)
	}
	return results, nil
}

// SearchByIngredients searches items excluding certain ingredients (useful for Jain dietary filters).
func SearchByIngredients(ctx context.Context, filters SearchFilters, excludeIngredients []string, limit, offset int) ([]*ItemSearchResult, error) {
	query := `
		SELECT mi.id, mi.menu_id, mi.name, mi.price, mi.ingredients, 
		       mi.is_jain, mi.availability, mi.image_url, mi.created_at,
		       p.id as provider_id, p.business_name,
		       ST_Distance(p.geo, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
		FROM menu_items mi
		JOIN menus m ON mi.menu_id = m.id
		JOIN providers p ON m.provider_id = p.id
		WHERE p.verified = TRUE
		  AND mi.availability = TRUE
		  AND ST_DWithin(p.geo, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
	`
	args := []interface{}{filters.Lng, filters.Lat, filters.RadiusMeters}
	argIdx := 4

	// Exclude ingredients (for Jain: no onion, garlic, root vegetables, etc.)
	if len(excludeIngredients) > 0 {
		// Use NOT (ingredients && ARRAY[...]) to exclude items containing these ingredients
		placeholders := make([]string, len(excludeIngredients))
		for i := range excludeIngredients {
			placeholders[i] = fmt.Sprintf("$%d", argIdx+i)
		}
		query += fmt.Sprintf(" AND NOT (mi.ingredients && ARRAY[%s]::text[])", strings.Join(placeholders, ","))
		for _, ing := range excludeIngredients {
			args = append(args, ing)
		}
		argIdx += len(excludeIngredients)
	}

	query += " ORDER BY distance ASC, mi.name ASC"
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, limit, offset)

	rows, err := db.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*ItemSearchResult
	for rows.Next() {
		r := &ItemSearchResult{}
		if err := rows.Scan(
			&r.ID, &r.MenuID, &r.Name, &r.Price, &r.Ingredients,
			&r.IsJain, &r.Availability, &r.ImageURL, &r.CreatedAt,
			&r.ProviderID, &r.ProviderName, &r.ProviderDistance,
		); err != nil {
			return nil, err
		}
		results = append(results, r)
	}
	return results, nil
}
