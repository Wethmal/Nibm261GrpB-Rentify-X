-- 01_users.sql
-- Migration for the users table
-- Rentify handles 3 roles: consumer, provider, admin.
-- Providers require NIC verification.

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('consumer', 'provider', 'admin')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending_verification' 
        CHECK (status IN ('pending_verification', 'verified', 'suspended', 'banned')),
    
    -- Profile Information
    full_name VARCHAR(255),
    bio TEXT,
    address TEXT,
    district VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Sri Lanka',
    profile_photo_url VARCHAR(1024),
    
    -- Provider specific
    nic_number VARCHAR(20),
    nic_document_url VARCHAR(1024),
    trust_score NUMERIC(3, 2) DEFAULT 0.00 CHECK (trust_score >= 0.00 AND trust_score <= 5.00),
    
    -- Metadata
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

