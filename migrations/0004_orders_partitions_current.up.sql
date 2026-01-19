-- Migration: Create partition for current period
-- This ensures the current month partition exists

-- January 2026
CREATE TABLE IF NOT EXISTS orders_2026_01 PARTITION OF orders
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
