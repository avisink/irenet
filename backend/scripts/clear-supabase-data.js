/**
 * Script to Clear All Data from Supabase Tables
 * 
 * This script clears all data from Supabase tables (recent_donations, activity_logs)
 * while keeping the table structure intact.
 * 
 * Usage:
 *   node backend/scripts/clear-supabase-data.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

async function clearSupabase() {
  try {
    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('✅ Connected to Supabase');
    console.log('🗑️  Clearing all data from tables...\n');

    // Clear recent_donations
    const { data: donationsData, error: donationsError } = await supabase
      .from('recent_donations')
      .delete()
      .neq('donation_id', 0); // Delete all rows (using a condition that's always true)

    if (donationsError) {
      console.error('   ❌ Error clearing recent_donations:', donationsError.message);
    } else {
      console.log(`   ✅ Cleared recent_donations`);
    }

    // Clear activity_logs
    const { data: logsData, error: logsError } = await supabase
      .from('activity_logs')
      .delete()
      .neq('id', 0); // Delete all rows

    if (logsError) {
      console.error('   ❌ Error clearing activity_logs:', logsError.message);
    } else {
      console.log(`   ✅ Cleared activity_logs`);
    }

    // Verify tables are empty
    console.log('\n📊 Verifying tables are empty...');
    
    const { count: donationsCount } = await supabase
      .from('recent_donations')
      .select('*', { count: 'exact', head: true });

    const { count: logsCount } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true });

    console.log('\n📋 Table Status:');
    console.log(`   ${donationsCount === 0 ? '✅' : '⚠️'} recent_donations: ${donationsCount || 0} rows`);
    console.log(`   ${logsCount === 0 ? '✅' : '⚠️'} activity_logs: ${logsCount || 0} rows`);

    console.log('\n✨ Supabase cleared successfully!');
    console.log('💡 Note: Supabase Auth users are separate and need to be cleared manually if needed.\n');

  } catch (error) {
    console.error('\n❌ Error clearing Supabase:', error.message);
    process.exit(1);
  }
}

// Run the script
clearSupabase();

