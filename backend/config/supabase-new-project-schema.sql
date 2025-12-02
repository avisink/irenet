-- Supabase Database Schema for New Project
-- Run this in your NEW Supabase project's SQL Editor
-- Project: kbatcssuhveexxzywvlp
-- URL: https://kbatcssuhveexxzywvlp.supabase.co

-- ============================================
-- Table: recent_donations
-- Purpose: Synced copy of donations from MySQL for redundancy
-- ============================================
CREATE TABLE IF NOT EXISTS recent_donations (
    donation_id INTEGER PRIMARY KEY,
    item_name VARCHAR(100),
    category VARCHAR(50),
    quantity INTEGER,
    status VARCHAR(20) CHECK (status IN ('available', 'matched', 'delivered', 'cancelled')),
    donor_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_recent_donations_status ON recent_donations(status);
CREATE INDEX IF NOT EXISTS idx_recent_donations_donor_id ON recent_donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_recent_donations_category ON recent_donations(category);
CREATE INDEX IF NOT EXISTS idx_recent_donations_created_at ON recent_donations(created_at DESC);

-- ============================================
-- Table: activity_logs
-- Purpose: Log all activities for analytics and tracking
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_event_type ON activity_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);

-- ============================================
-- Optional: Enable Row Level Security (RLS)
-- Uncomment if you want to enable RLS policies
-- ============================================
-- ALTER TABLE recent_donations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Note: For now, these tables are accessed via service role key from backend
-- which bypasses RLS. If you want to enable RLS, you'll need to create policies.

