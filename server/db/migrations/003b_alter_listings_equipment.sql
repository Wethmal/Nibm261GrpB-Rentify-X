-- 003b_alter_listings_equipment.sql
-- Patch migration for equipment fields on listings table

-- Create condition_enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'condition_enum') THEN
        CREATE TYPE condition_enum AS ENUM ('new', 'good', 'fair');
    END IF;
END$$;

-- Alter listings table conditionally if it exists (handles existing databases)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'listings') THEN
        -- Add quantity column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'quantity') THEN
            ALTER TABLE listings ADD COLUMN quantity INTEGER DEFAULT 1;
        END IF;

        -- Add specifications column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'specifications') THEN
            ALTER TABLE listings ADD COLUMN specifications JSONB;
        END IF;

        -- Alter or add condition column
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'condition') THEN
            -- Convert the existing VARCHAR column to the new condition_enum type
            ALTER TABLE listings ALTER COLUMN condition TYPE condition_enum USING condition::condition_enum;
        ELSE
            ALTER TABLE listings ADD COLUMN condition condition_enum;
        END IF;
    END IF;
END$$;
