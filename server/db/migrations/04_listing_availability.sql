-- 04_listing_availability.sql
-- Migration for listing availability management
-- Tracks specific dates blocked by the provider or locked by confirmed bookings.

CREATE TABLE IF NOT EXISTS listing_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT false,
    blocked_reason VARCHAR(255),
    
