-- 18_gap_features.sql
-- Adds schema for: cancellation policies & refunds (US26), provider payouts (US27),
-- user reports & admin audit logs (US23/US29), timed suspensions (US24),
-- multi-equipment bundles (US13), listing suspension reason (US20),
-- NIC review notes (US21), message delivery status (US17).
-- Fully idempotent: safe to run more than once.

-- ---------- Cancellation policies (US26) ----------
