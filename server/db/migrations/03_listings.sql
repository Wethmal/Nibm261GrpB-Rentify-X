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
    
    -- Location
    district VARCHAR(100) NOT NULL,
    geo_lat NUMERIC(10, 7),
    geo_lng NUMERIC(10, 7),
    
    -- Equipment specific
    condition condition_enum,
    quantity INTEGER DEFAULT 1,
    quantity_available INT DEFAULT 1,
    specifications JSONB,
    
    -- Stats
    average_rating NUMERIC(3, 2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_listings_provider ON listings(provider_id);
CREATE INDEX idx_listings_category ON listings(category_id);
CREATE INDEX idx_listings_status_type ON listings(status, type);
CREATE INDEX idx_listings_district ON listings(district);
