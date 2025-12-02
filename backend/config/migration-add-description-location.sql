-- Migration script to add description and location columns to donations table
-- and description and urgency columns to requests table
-- You should run this bc our database was created before these columns were added

USE irenet_db;

-- addinng description and location to donations table
-- PS: If columns already exist, yall will get an error - that's okay, just ignore it
ALTER TABLE donations 
ADD COLUMN description TEXT,
ADD COLUMN location VARCHAR(255),
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- adding description and urgency to requests table
-- PS: If columns already exist, yall will get an error - that's okay guys, just ignore it
ALTER TABLE requests 
ADD COLUMN description TEXT,
ADD COLUMN urgency ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
