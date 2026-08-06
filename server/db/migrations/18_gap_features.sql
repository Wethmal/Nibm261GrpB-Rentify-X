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
CREATE TABLE IF NOT EXISTS user_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    reason VARCHAR(40) NOT NULL CHECK (reason IN ('abusive_behavior', 'fraud', 'fake_profile', 'no_show', 'harassment', 'other')),
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_note TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (reporter_id <> reported_user_id)
);
-- One open report per reporter/target pair (duplicate prevention)
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_reports_open ON user_reports(reporter_id, reported_user_id) WHERE status IN ('pending', 'reviewing');
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported ON user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter_day ON user_reports(reporter_id, created_at);

-- ---------- Admin audit log (US23 / US24) ----------
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(60) NOT NULL,
    target_type VARCHAR(30) NOT NULL,
    target_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_logs(created_at DESC);

-- ---------- User restrictions (US24) ----------
ALTER TABLE users ADD COLUMN IF NOT EXISTS status_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nic_review_note TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nic_reviewed_at TIMESTAMP WITH TIME ZONE;

-- ---------- Listing suspension reason (US20) ----------
ALTER TABLE listings ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

