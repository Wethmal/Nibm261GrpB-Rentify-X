-- 09_notifications.sql
-- Migration for in-app notifications system.

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL, -- 'booking_update', 'new_message', 'review', 'system'
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    metadata JSONB, -- For deep linking or context
    
    is_read BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
