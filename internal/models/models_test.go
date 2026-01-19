package models

import (
	"testing"
)

func TestOrderStatusConstants(t *testing.T) {
	// Verify order status constants are defined
	statuses := []string{
		OrderStatusCreated,
		OrderStatusPendingProviderAck,
		OrderStatusConfirmed,
		OrderStatusCompleted,
		OrderStatusCancelled,
	}

	for _, s := range statuses {
		if s == "" {
			t.Error("Order status constant should not be empty")
		}
	}
}

func TestUserRoleConstants(t *testing.T) {
	// Verify user role constants are defined
	roles := []string{
		RoleBuyer,
		RoleProvider,
		RoleAdmin,
	}

	for _, r := range roles {
		if r == "" {
			t.Error("User role constant should not be empty")
		}
	}
}

func TestJainTagConstants(t *testing.T) {
	// Verify Jain dietary tag constants are defined
	tags := []string{
		TagSattvic,
		TagNoRootVeggies,
		TagNoOnionGarlic,
		TagHomeCook,
		TagCloudKitchen,
		TagHotel,
		TagPureJain,
	}

	for _, tag := range tags {
		if tag == "" {
			t.Error("Jain tag constant should not be empty")
		}
	}
}
