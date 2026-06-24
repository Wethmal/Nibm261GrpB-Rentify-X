-- 03_listings.sql
-- Migration for the listings table
-- Combines both services and equipment using a generic structure with type-specific JSONB fields.
-- Includes PostGIS/earthdistance compatible geo coordinates if needed (using lat/lng for simplicity).

CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('service', 'equipment')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending_approval'
        CHECK (status IN ('pending_approval', 'active', 'suspended', 'deleted')),
    
    -- Pricing
    price_per_unit NUMERIC(10, 2) NOT NULL,
    unit_label VARCHAR(50) NOT NULL, -- 'hour', 'day', 'session', 'week'
    deposit_amount NUMERIC(10, 2) DEFAULT 0.00,
    
    -- Media
    photos JSONB DEFAULT '[]'::jsonb, -- Array of Cloudinary URLs
    tags JSONB DEFAULT '[]'::jsonb,
    
