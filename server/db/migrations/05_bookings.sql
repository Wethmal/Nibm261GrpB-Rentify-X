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

