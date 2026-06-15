-- 005_create_bookings.sql
-- Migration for the bookings table with custom ENUMs, specific columns, and safe conditional execution.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status_enum') THEN
            CREATE TYPE booking_status_enum AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'disputed', 'rejected');
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_type_enum') THEN
            CREATE TYPE booking_type_enum AS ENUM ('service', 'equipment', 'bundle');
        END IF;

        CREATE TABLE bookings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            consumer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            provider_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            
            status booking_status_enum NOT NULL DEFAULT 'pending',
            booking_type booking_type_enum NOT NULL,
            
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

        CREATE INDEX idx_bookings_consumer ON bookings(consumer_id);
        CREATE INDEX idx_bookings_service_listing ON bookings(service_listing_id);
        CREATE INDEX idx_bookings_status ON bookings(status);
        
    END IF;
END$$;
