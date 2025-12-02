/**
 * Script to Clear All Data from Both MySQL and Supabase
 * 
 * This script clears all data from both databases to start fresh.
 * Useful for testing consistency between MySQL and Supabase.
 * 
 * Usage:
 *   node backend/scripts/clear-all-data.js
 */

const { exec } = require('child_process');
const path = require('path');

console.log('🧹 Clearing All Data from MySQL and Supabase\n');
console.log('=' .repeat(50));

// Clear MySQL first
console.log('\n📦 Step 1: Clearing MySQL database...');
const clearMySQL = exec('node backend/scripts/clear-mysql-data.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(stdout);

  // After MySQL is cleared, clear Supabase
  console.log('\n📦 Step 2: Clearing Supabase database...');
  const clearSupabase = exec('node backend/scripts/clear-supabase-data.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(stdout);

    console.log('\n' + '='.repeat(50));
    console.log('✨ All databases cleared successfully!');
    console.log('💡 You can now start fresh and test consistency.\n');
    console.log('⚠️  Note: Supabase Auth users need to be cleared manually:');
    console.log('   Go to: https://supabase.com/dashboard/project/kbatcssuhveexxzywvlp/auth/users');
    console.log('   Delete users manually or use Supabase Admin API\n');
  });

  clearSupabase.stdout.pipe(process.stdout);
  clearSupabase.stderr.pipe(process.stderr);
});

clearMySQL.stdout.pipe(process.stdout);
clearMySQL.stderr.pipe(process.stderr);

