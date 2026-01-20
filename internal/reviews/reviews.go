package reviews

import (
	"context"

	"jainfood/internal/db"
	"jainfood/internal/models"

	"github.com/lib/pq"
)

// CreateReview creates a new review for a provider
func CreateReview(ctx context.Context, providerID, userID, orderID string, rating int, comment string, photoURLs []string) (*models.Review, error) {
	var review models.Review
	var orderIDPtr *string
	if orderID != "" {
		orderIDPtr = &orderID
	}

	err := db.Pool.QueryRow(ctx, `
		INSERT INTO reviews (provider_id, user_id, order_id, rating, comment, photo_urls)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, provider_id, user_id, COALESCE(order_id::text, ''), rating, comment, photo_urls, created_at
	`, providerID, userID, orderIDPtr, rating, comment, pq.Array(photoURLs)).Scan(
		&review.ID, &review.ProviderID, &review.UserID, &review.OrderID,
		&review.Rating, &review.Comment, pq.Array(&review.PhotoURLs), &review.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Update provider's average rating
	_, _ = db.Pool.Exec(ctx, `
		UPDATE providers
		SET rating = (SELECT AVG(rating)::numeric(2,1) FROM reviews WHERE provider_id = $1),
		    total_ratings = (SELECT COUNT(*) FROM reviews WHERE provider_id = $1)
		WHERE id = $1
	`, providerID)

	return &review, nil
}

// GetReviewsByProvider returns all reviews for a provider
func GetReviewsByProvider(ctx context.Context, providerID string, limit, offset int) ([]models.Review, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT r.id, r.provider_id, r.user_id, COALESCE(r.order_id::text, ''),
		       r.rating, r.comment, r.photo_urls, r.created_at,
		       COALESCE(u.name, 'Anonymous') as user_name
		FROM reviews r
		LEFT JOIN users u ON r.user_id = u.id
		WHERE r.provider_id = $1
		ORDER BY r.created_at DESC
		LIMIT $2 OFFSET $3
	`, providerID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reviews []models.Review
	for rows.Next() {
		var r models.Review
		var userName string
		if err := rows.Scan(
			&r.ID, &r.ProviderID, &r.UserID, &r.OrderID,
			&r.Rating, &r.Comment, pq.Array(&r.PhotoURLs), &r.CreatedAt,
			&userName,
		); err != nil {
			return nil, err
		}
		reviews = append(reviews, r)
	}

	if reviews == nil {
		reviews = []models.Review{}
	}
	return reviews, nil
}

// GetReviewsByUser returns all reviews by a user
func GetReviewsByUser(ctx context.Context, userID string, limit, offset int) ([]models.Review, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT r.id, r.provider_id, r.user_id, COALESCE(r.order_id::text, ''),
		       r.rating, r.comment, r.photo_urls, r.created_at,
		       p.business_name
		FROM reviews r
		LEFT JOIN providers p ON r.provider_id = p.id
		WHERE r.user_id = $1
		ORDER BY r.created_at DESC
		LIMIT $2 OFFSET $3
	`, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reviews []models.Review
	for rows.Next() {
		var r models.Review
		var businessName string
		if err := rows.Scan(
			&r.ID, &r.ProviderID, &r.UserID, &r.OrderID,
			&r.Rating, &r.Comment, pq.Array(&r.PhotoURLs), &r.CreatedAt,
			&businessName,
		); err != nil {
			return nil, err
		}
		reviews = append(reviews, r)
	}

	if reviews == nil {
		reviews = []models.Review{}
	}
	return reviews, nil
}

// GetReview returns a review by ID
func GetReview(ctx context.Context, reviewID string) (*models.Review, error) {
	var review models.Review
	err := db.Pool.QueryRow(ctx, `
		SELECT id, provider_id, user_id, COALESCE(order_id::text, ''),
		       rating, comment, photo_urls, created_at
		FROM reviews WHERE id = $1
	`, reviewID).Scan(
		&review.ID, &review.ProviderID, &review.UserID, &review.OrderID,
		&review.Rating, &review.Comment, pq.Array(&review.PhotoURLs), &review.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &review, nil
}

// DeleteReview deletes a review
func DeleteReview(ctx context.Context, reviewID, userID string) error {
	result, err := db.Pool.Exec(ctx, `
		DELETE FROM reviews WHERE id = $1 AND user_id = $2
	`, reviewID, userID)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return db.ErrNotFound
	}
	return nil
}

// DeleteReviewAdmin deletes a review (admin only - no user check)
func DeleteReviewAdmin(ctx context.Context, reviewID string) error {
	_, err := db.Pool.Exec(ctx, `DELETE FROM reviews WHERE id = $1`, reviewID)
	return err
}

// GetProviderReviewStats returns review statistics for a provider
func GetProviderReviewStats(ctx context.Context, providerID string) (map[string]interface{}, error) {
	var avgRating float64
	var totalReviews int
	var ratingCounts [5]int

	err := db.Pool.QueryRow(ctx, `
		SELECT COALESCE(AVG(rating), 0), COUNT(*)
		FROM reviews WHERE provider_id = $1
	`, providerID).Scan(&avgRating, &totalReviews)
	if err != nil {
		return nil, err
	}

	rows, err := db.Pool.Query(ctx, `
		SELECT rating, COUNT(*)
		FROM reviews
		WHERE provider_id = $1
		GROUP BY rating
		ORDER BY rating
	`, providerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var rating, count int
		if err := rows.Scan(&rating, &count); err != nil {
			return nil, err
		}
		if rating >= 1 && rating <= 5 {
			ratingCounts[rating-1] = count
		}
	}

	return map[string]interface{}{
		"average_rating": avgRating,
		"total_reviews":  totalReviews,
		"rating_counts": map[string]int{
			"1": ratingCounts[0],
			"2": ratingCounts[1],
			"3": ratingCounts[2],
			"4": ratingCounts[3],
			"5": ratingCounts[4],
		},
	}, nil
}
