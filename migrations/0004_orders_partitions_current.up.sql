-- Migration: Create partition for current period
-- This ensures the current month partition exists

-- December 2025
CREATE TABLE IF NOT EXISTS orders_2025_12 PARTITION OF orders
FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
