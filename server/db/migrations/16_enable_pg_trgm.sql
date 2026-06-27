-- 16_enable_pg_trgm.sql
-- Enable pg_trgm extension for fuzzy string matching and fast searching.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
