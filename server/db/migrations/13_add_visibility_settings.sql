-- 13_add_visibility_settings.sql
-- Migration to add a JSONB column to the users table for tracking which fields are public.

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS visibility_settings JSONB DEFAULT '{"mobile": false, "address": false}'::jsonb;
