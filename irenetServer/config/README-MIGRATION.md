# How to Run the Migration

This guide explains how to run the migration script to add missing columns to your database.

## Option 1: MySQL Command Line

1. Open your terminal/command prompt
2. Navigate to your project directory
3. Run:

```bash
mysql -u your_username -p irenet_db < config/migration-add-description-location.sql
```

Replace `your_username` with your MySQL username. You'll be prompted for your password.

**Or** if you're already in MySQL:

```bash
mysql -u your_username -p
```

Then:
```sql
USE irenet_db;
SOURCE config/migration-add-description-location.sql;
```

## Option 2: MySQL Workbench

1. Open MySQL Workbench
2. Connect to your database server
3. Click on "File" → "Open SQL Script"
4. Navigate to `irenetServer/config/migration-add-description-location.sql`
5. Open the file
6. Click the "Execute" button (⚡ lightning bolt icon) or press `Ctrl+Shift+Enter`

## Option 3: Copy and Paste SQL Commands

1. Open your MySQL client (command line, Workbench, phpMyAdmin, etc.)
2. Select the `irenet_db` database
3. Copy and paste these commands:

```sql
USE irenet_db;

ALTER TABLE donations 
ADD COLUMN description TEXT,
ADD COLUMN location VARCHAR(255),
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE requests 
ADD COLUMN description TEXT,
ADD COLUMN urgency ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

4. Execute the commands

## Option 4: Using Node.js Script (Programmatic)

You can also create a simple Node.js script to run the migration:

```javascript
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'irenet_db',
    multipleStatements: true
  });

  const sql = fs.readFileSync(
    path.join(__dirname, 'migration-add-description-location.sql'),
    'utf8'
  );

  try {
    await connection.query(sql);
    console.log('Migration completed successfully!');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist. Migration skipped.');
    } else {
      console.error('Migration error:', error);
    }
  } finally {
    await connection.end();
  }
}

runMigration();
```

## Troubleshooting

- **Error: "Duplicate column name"**: This means the columns already exist. You can safely ignore this error.
- **Error: "Access denied"**: Make sure your MySQL user has ALTER TABLE permissions.
- **Error: "Unknown database"**: Make sure the `irenet_db` database exists. Create it first if needed.

## Verify Migration

After running the migration, verify it worked by running:

```sql
DESCRIBE donations;
DESCRIBE requests;
```

You should see `description`, `location`, and `created_at` in the donations table, and `description`, `urgency`, and `created_at` in the requests table.

