-- 12_add_2fa_to_users.sql
-- Migration to add 2FA tracking column to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_2fa_enabled BOOLEAN DEFAULT false;
