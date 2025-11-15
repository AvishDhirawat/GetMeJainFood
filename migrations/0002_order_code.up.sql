-- Migration: add external human-friendly order_code to orders
-- Note: because orders is partitioned by created_at, uniqueness constraints
-- must include the partition key. We enforce uniqueness of (order_code, created_at).

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_code TEXT NOT NULL DEFAULT '';

-- Backfill existing rows with generated codes (simple random suffix) if needed.
-- (Optional) For existing empty codes: update with prefix + uuid substring.
-- UPDATE orders SET order_code = 'JF-' || substr(replace(id::text,'-',''),1,12) WHERE order_code = '';

CREATE INDEX IF NOT EXISTS idx_orders_order_code ON orders(order_code);
-- Application layer guarantees uniqueness; optionally create a unique index including partition key:
-- CREATE UNIQUE INDEX IF NOT EXISTS orders_order_code_created_unique ON orders(order_code, created_at);
