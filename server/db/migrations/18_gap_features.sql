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
