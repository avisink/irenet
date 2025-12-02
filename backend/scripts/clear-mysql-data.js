/**
 * Script to Clear All Data from MySQL Database
 * 
 * This script clears all data from MySQL tables while keeping the schema intact.
 * Useful for starting fresh and testing consistency between MySQL and Supabase.
 * 
 * Usage:
 *   node backend/scripts/clear-mysql-data.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function clearDatabase() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'irenet_db',
    });

    console.log('✅ Connected to MySQL database');
    console.log('🗑️  Clearing all data from tables...\n');

    // Disable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

    // Delete all data from tables (in reverse dependency order)
    const tables = ['matches', 'requests', 'donations', 'organizations', 'users'];
    
    for (const table of tables) {
      const [result] = await connection.execute(`DELETE FROM ${table}`);
      console.log(`   ✅ Cleared ${table} (${result.affectedRows} rows deleted)`);
    }

    // Reset AUTO_INCREMENT counters
    console.log('\n🔄 Resetting AUTO_INCREMENT counters...');
    await connection.execute('ALTER TABLE matches AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE requests AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE donations AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE organizations AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE users AUTO_INCREMENT = 1');
    console.log('   ✅ AUTO_INCREMENT counters reset\n');

    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    // Verify tables are empty
    console.log('📊 Verifying tables are empty...');
    const [rows] = await connection.execute(`
      SELECT 'matches' as table_name, COUNT(*) as row_count FROM matches
      UNION ALL
      SELECT 'requests', COUNT(*) FROM requests
      UNION ALL
      SELECT 'donations', COUNT(*) FROM donations
      UNION ALL
      SELECT 'organizations', COUNT(*) FROM organizations
      UNION ALL
      SELECT 'users', COUNT(*) FROM users
    `);

    console.log('\n📋 Table Status:');
    rows.forEach(row => {
      const status = row.row_count === 0 ? '✅' : '⚠️';
      console.log(`   ${status} ${row.table_name}: ${row.row_count} rows`);
    });

    console.log('\n✨ Database cleared successfully!');
    console.log('💡 You can now start fresh and test consistency between MySQL and Supabase.\n');

  } catch (error) {
    console.error('\n❌ Error clearing database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
clearDatabase();

