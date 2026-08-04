-- 18_gap_features.sql
-- Adds schema for: cancellation policies & refunds (US26), provider payouts (US27),
-- user reports & admin audit logs (US23/US29), timed suspensions (US24),
-- multi-equipment bundles (US13), listing suspension reason (US20),
-- NIC review notes (US21), message delivery status (US17).
-- Fully idempotent: safe to run more than once.

-- ---------- Cancellation policies (US26) ----------
CREATE TABLE IF NOT EXISTS cancellation_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    listing_type VARCHAR(20) CHECK (listing_type IN ('service', 'equipment')),
    policy_type VARCHAR(20) NOT NULL CHECK (policy_type IN ('flexible', 'moderate', 'strict', 'non_refundable')),
    full_refund_hours INT NOT NULL DEFAULT 24,
    partial_refund_hours INT NOT NULL DEFAULT 0,
    partial_refund_percent INT NOT NULL DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (listing_id IS NOT NULL OR listing_type IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cancellation_policy_listing ON cancellation_policies(listing_id) WHERE listing_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_cancellation_policy_default ON cancellation_policies(listing_type) WHERE listing_id IS NULL;

-- Platform defaults (moderate) per listing type
INSERT INTO cancellation_policies (listing_type, policy_type, full_refund_hours, partial_refund_hours, partial_refund_percent)
SELECT 'service', 'moderate', 48, 24, 50
WHERE NOT EXISTS (SELECT 1 FROM cancellation_policies WHERE listing_id IS NULL AND listing_type = 'service');
INSERT INTO cancellation_policies (listing_type, policy_type, full_refund_hours, partial_refund_hours, partial_refund_percent)
SELECT 'equipment', 'moderate', 48, 24, 50
WHERE NOT EXISTS (SELECT 1 FROM cancellation_policies WHERE listing_id IS NULL AND listing_type = 'equipment');

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_percent INT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payout_status VARCHAR(20);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;

-- ---------- Provider payouts (US27) ----------
CREATE TABLE IF NOT EXISTS provider_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    gross_amount NUMERIC(10, 2) NOT NULL,
    platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    net_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (booking_id)
);
CREATE INDEX IF NOT EXISTS idx_provider_payouts_provider ON provider_payouts(provider_id, status);
CREATE INDEX IF NOT EXISTS idx_provider_payouts_created ON provider_payouts(created_at);

-- ---------- User reports (US29 / US23) ----------
