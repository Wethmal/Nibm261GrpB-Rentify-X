-- 15_add_quantity_and_condition_to_listings.sql
-- Add quantity_available and condition columns to listings table if not present.

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS condition VARCHAR(50),
ADD COLUMN IF NOT EXISTS quantity_available INT DEFAULT 1;
