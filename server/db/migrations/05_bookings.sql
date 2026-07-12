-- 05_bookings.sql
-- Migration for the bookings table with custom ENUMs and specific columns.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status_enum') THEN
        CREATE TYPE booking_status_enum AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'disputed', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_type_enum') THEN
        CREATE TYPE booking_type_enum AS ENUM ('service', 'equipment', 'bundle');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    status booking_status_enum NOT NULL DEFAULT 'pending',
    booking_type booking_type_enum NOT NULL,
    
    -- Nullable listing references to support single service, single equipment, or bundles
    service_listing_id UUID REFERENCES listings(id) ON DELETE RESTRICT,
    equipment_listing_id UUID REFERENCES listings(id) ON DELETE RESTRICT,
    
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_hours DECIMAL NOT NULL,
    
    total_price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_consumer ON bookings(consumer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_listing ON bookings(service_listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
