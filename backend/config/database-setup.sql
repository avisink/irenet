-- Create database
CREATE DATABASE IF NOT EXISTS irenet_db;
USE irenet_db;

-- Drop tables in reverse dependency order if they exist
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS donations;
DROP TABLE IF EXISTS organizations;
DROP TABLE IF EXISTS users;

-- Create tables
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    role ENUM('donor', 'organization', 'admin')
);

CREATE TABLE organizations (
    org_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    org_name VARCHAR(100),
    contact_info VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE donations (
    donation_id INT AUTO_INCREMENT PRIMARY KEY,
    donor_id INT,
    item_name VARCHAR(100),
    category VARCHAR(50),
    quantity INT,
    status ENUM('available', 'matched', 'delivered', 'cancelled'),
    description TEXT,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (donor_id) REFERENCES users(user_id)
);

CREATE TABLE requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT,
    item_name VARCHAR(100),
    category VARCHAR(50),
    quantity INT,
    status ENUM('open', 'matched', 'fulfilled', 'cancelled'),
    description TEXT,
    urgency ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(org_id)
);

CREATE TABLE matches (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id INT,
    request_id INT,
    match_date DATE,
    FOREIGN KEY (donation_id) REFERENCES donations(donation_id),
    FOREIGN KEY (request_id) REFERENCES requests(request_id)
);
