-- 14_add_tags_to_listings.sql
-- Migration to add a tags column to the listings table.

ALTER TABLE listings
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
