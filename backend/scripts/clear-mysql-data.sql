-- Clear All Data from MySQL Database
-- This script deletes all data but keeps the table structure
-- Run this to start fresh and test consistency between MySQL and Supabase

USE irenet_db;

-- Disable foreign key checks temporarily to allow deletion in any order
SET FOREIGN_KEY_CHECKS = 0;

-- Delete all data from tables (in reverse dependency order for safety)
DELETE FROM matches;
DELETE FROM requests;
DELETE FROM donations;
DELETE FROM organizations;
DELETE FROM users;

-- Reset AUTO_INCREMENT counters so new records start from 1
ALTER TABLE matches AUTO_INCREMENT = 1;
ALTER TABLE requests AUTO_INCREMENT = 1;
ALTER TABLE donations AUTO_INCREMENT = 1;
ALTER TABLE organizations AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify tables are empty
SELECT 'matches' as table_name, COUNT(*) as row_count FROM matches
UNION ALL
SELECT 'requests', COUNT(*) FROM requests
UNION ALL
SELECT 'donations', COUNT(*) FROM donations
UNION ALL
SELECT 'organizations', COUNT(*) FROM organizations
UNION ALL
SELECT 'users', COUNT(*) FROM users;

