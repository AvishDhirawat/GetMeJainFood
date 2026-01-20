-- Migration: add payment tracking + updated_at to orders
-- Required by payment verification flow and order status updates.
--
-- Note: orders is partitioned by created_at. ALTER TABLE on the partitioned
-- parent propagates columns to partitions in supported Postgres versions.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

