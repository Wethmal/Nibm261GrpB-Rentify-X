-- 17_add_search_indexes.sql
-- Optimizes search performance by adding GIN indexes for fuzzy search and composite indexes.

-- Create GIN index on title and description using gin_trgm_ops for fuzzy match efficiency
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm ON listings USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_description_trgm ON listings USING gin (description gin_trgm_ops);

-- Create composite B-tree index on status, district, category_id
CREATE INDEX IF NOT EXISTS idx_listings_status_district_category ON listings (status, district, category_id);
