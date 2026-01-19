package menus

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"jainfood/internal/db"
	"jainfood/internal/models"
)

// CreateMenu creates a new menu for a provider.
func CreateMenu(ctx context.Context, providerID, name, description string) (*models.Menu, error) {
	id := uuid.New().String()

	_, err := db.Pool.Exec(ctx, `
		INSERT INTO menus (id, provider_id, name, description)
		VALUES ($1, $2, $3, $4)
	`, id, providerID, name, description)
	if err != nil {
		return nil, err
	}

	return &models.Menu{
		ID:          id,
		ProviderID:  providerID,
		Name:        name,
		Description: description,
	}, nil
}

// GetMenu retrieves a menu by ID.
func GetMenu(ctx context.Context, menuID string) (*models.Menu, error) {
	m := &models.Menu{}
	err := db.Pool.QueryRow(ctx, `
		SELECT id, provider_id, name, description, created_at
		FROM menus WHERE id = $1
	`, menuID).Scan(&m.ID, &m.ProviderID, &m.Name, &m.Description, &m.CreatedAt)
	if err != nil {
		return nil, err
	}
	return m, nil
}

// GetMenusByProvider retrieves all menus for a provider.
func GetMenusByProvider(ctx context.Context, providerID string) ([]*models.Menu, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT id, provider_id, name, description, created_at
		FROM menus WHERE provider_id = $1
		ORDER BY created_at DESC
	`, providerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var menus []*models.Menu
	for rows.Next() {
		m := &models.Menu{}
		if err := rows.Scan(&m.ID, &m.ProviderID, &m.Name, &m.Description, &m.CreatedAt); err != nil {
			return nil, err
		}
		menus = append(menus, m)
	}
	return menus, nil
}

// UpdateMenu updates menu details.
func UpdateMenu(ctx context.Context, menuID, name, description string) error {
	ct, err := db.Pool.Exec(ctx, `
		UPDATE menus SET name = $2, description = $3 WHERE id = $1
	`, menuID, name, description)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("menu not found")
	}
	return nil
}

// DeleteMenu removes a menu.
func DeleteMenu(ctx context.Context, menuID string) error {
	ct, err := db.Pool.Exec(ctx, `DELETE FROM menus WHERE id = $1`, menuID)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("menu not found")
	}
	return nil
}

// CreateMenuItem adds an item to a menu.
func CreateMenuItem(ctx context.Context, menuID, name string, price float64, ingredients []string, isJain, availability bool, imageURL string) (*models.MenuItem, error) {
	id := uuid.New().String()

	_, err := db.Pool.Exec(ctx, `
		INSERT INTO menu_items (id, menu_id, name, price, ingredients, is_jain, availability, image_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, id, menuID, name, price, ingredients, isJain, availability, imageURL)
	if err != nil {
		return nil, err
	}

	return &models.MenuItem{
		ID:           id,
		MenuID:       menuID,
		Name:         name,
		Price:        price,
		Ingredients:  ingredients,
		IsJain:       isJain,
		Availability: availability,
		ImageURL:     imageURL,
	}, nil
}

// GetMenuItem retrieves a menu item by ID.
func GetMenuItem(ctx context.Context, itemID string) (*models.MenuItem, error) {
	item := &models.MenuItem{}
	err := db.Pool.QueryRow(ctx, `
		SELECT id, menu_id, name, price, ingredients, is_jain, availability, image_url, created_at
		FROM menu_items WHERE id = $1
	`, itemID).Scan(
		&item.ID, &item.MenuID, &item.Name, &item.Price,
		&item.Ingredients, &item.IsJain, &item.Availability, &item.ImageURL, &item.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return item, nil
}

// GetMenuItems retrieves all items for a menu.
func GetMenuItems(ctx context.Context, menuID string) ([]*models.MenuItem, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT id, menu_id, name, price, ingredients, is_jain, availability, image_url, created_at
		FROM menu_items WHERE menu_id = $1
		ORDER BY name ASC
	`, menuID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []*models.MenuItem
	for rows.Next() {
		item := &models.MenuItem{}
		if err := rows.Scan(
			&item.ID, &item.MenuID, &item.Name, &item.Price,
			&item.Ingredients, &item.IsJain, &item.Availability, &item.ImageURL, &item.CreatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

// UpdateMenuItem updates item details.
func UpdateMenuItem(ctx context.Context, itemID, name string, price float64, ingredients []string, isJain, availability bool, imageURL string) error {
	ct, err := db.Pool.Exec(ctx, `
		UPDATE menu_items
		SET name = $2, price = $3, ingredients = $4, is_jain = $5, availability = $6, image_url = $7
		WHERE id = $1
	`, itemID, name, price, ingredients, isJain, availability, imageURL)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("menu item not found")
	}
	return nil
}

// ToggleAvailability toggles item availability (real-time toggle).
func ToggleAvailability(ctx context.Context, itemID string, available bool) error {
	ct, err := db.Pool.Exec(ctx, `
		UPDATE menu_items SET availability = $2 WHERE id = $1
	`, itemID, available)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("menu item not found")
	}
	return nil
}

// DeleteMenuItem removes a menu item.
func DeleteMenuItem(ctx context.Context, itemID string) error {
	ct, err := db.Pool.Exec(ctx, `DELETE FROM menu_items WHERE id = $1`, itemID)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("menu item not found")
	}
	return nil
}
