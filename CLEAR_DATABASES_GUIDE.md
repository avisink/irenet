# Guide: Clear All Database Data

This guide helps you clear all data from both MySQL and Supabase to start fresh and test consistency.

## Quick Start

### Option 1: Clear Both Databases at Once (Recommended)

```bash
node backend/scripts/clear-all-data.js
```

This will:
- ✅ Clear all MySQL tables (users, organizations, donations, requests, matches)
- ✅ Clear all Supabase tables (recent_donations, activity_logs)
- ⚠️ **Note**: Supabase Auth users need to be cleared manually (see below)

### Option 2: Clear Databases Separately

**Clear MySQL only:**
```bash
node backend/scripts/clear-mysql-data.js
```

**Or using SQL directly:**
```bash
mysql -u root -p irenet_db < backend/scripts/clear-mysql-data.sql
```

**Clear Supabase only:**
```bash
node backend/scripts/clear-supabase-data.js
```

## What Gets Cleared

### MySQL Database
- ✅ `users` table (all user accounts)
- ✅ `organizations` table (all organization records)
- ✅ `donations` table (all donation records)
- ✅ `requests` table (all request records)
- ✅ `matches` table (all match records)
- ✅ AUTO_INCREMENT counters reset to 1

### Supabase Database
- ✅ `recent_donations` table (synced donation data)
- ✅ `activity_logs` table (activity log entries)

### Supabase Auth (Manual)
- ⚠️ **Auth users are NOT automatically cleared**
- You need to delete them manually (see below)

## Clear Supabase Auth Users

Since Supabase Auth is separate from database tables, you need to clear users manually:

### Method 1: Via Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard/project/kbatcssuhveexxzywvlp/auth/users
2. Select all users (or individual users)
3. Click **"Delete"** button
4. Confirm deletion

### Method 2: Via SQL Editor (Bulk Delete)

1. Go to: https://supabase.com/dashboard/project/kbatcssuhveexxzywvlp/sql/new
2. Run this SQL:

```sql
-- Delete all auth users (use with caution!)
DELETE FROM auth.users;
```

**⚠️ Warning**: This will delete ALL users. Make sure you want to do this!

### Method 3: Via Script (Advanced)

You can create a script using Supabase Admin API, but it requires additional setup.

## After Clearing

### 1. Verify Tables Are Empty

**MySQL:**
```bash
mysql -u root -p irenet_db -e "SELECT 'users' as table_name, COUNT(*) as count FROM users UNION ALL SELECT 'donations', COUNT(*) FROM donations UNION ALL SELECT 'requests', COUNT(*) FROM requests UNION ALL SELECT 'matches', COUNT(*) FROM matches;"
```

**Supabase:**
- Go to Table Editor in Supabase dashboard
- Check that `recent_donations` and `activity_logs` are empty

### 2. Test Fresh Signup

1. Start your backend: `cd backend && node server.js`
2. Start your frontend: `cd ui && npm run dev`
3. Try signing up a new user
4. Verify:
   - User appears in MySQL `users` table
   - User appears in Supabase Auth
   - If organization, appears in MySQL `organizations` table
   - Creating donations syncs to Supabase `recent_donations`

### 3. Test Consistency

After creating some test data:
- Create a donation → Check MySQL `donations` table → Check Supabase `recent_donations` table
- Create a request → Check MySQL `requests` table → Check Supabase `activity_logs` table
- Create a match → Check MySQL `matches` table → Check Supabase `activity_logs` table

## Troubleshooting

### Error: "Cannot delete or update a parent row"
- The script disables foreign key checks, so this shouldn't happen
- If it does, make sure you're running the full script

### Error: "Table doesn't exist"
- Make sure MySQL database `irenet_db` exists
- Run `backend/config/database-setup.sql` first if needed

### Supabase Connection Error
- Verify `.env` file has correct `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Make sure tables exist in Supabase (run `backend/config/supabase-new-project-schema.sql`)

### Auth Users Still Exist
- Auth users are separate from database tables
- You must delete them manually via Supabase dashboard or SQL

## Safety Notes

1. **Backup First**: If you have important data, export it before clearing:
   ```bash
   mysqldump -u root -p irenet_db > backup.sql
   ```

2. **Production Warning**: Never run these scripts on production databases!

3. **Auth Users**: Remember that Supabase Auth users are separate and need manual deletion

4. **Test Environment**: These scripts are designed for development/testing only

## Next Steps After Clearing

1. ✅ Both databases are now empty and ready for fresh data
2. ✅ Sign up new users - they'll be created in both MySQL and Supabase Auth
3. ✅ Create donations/requests - they'll sync to Supabase automatically
4. ✅ Test consistency by comparing data in both databases
5. ✅ Monitor sync operations in backend logs

## Scripts Created

- `backend/scripts/clear-mysql-data.js` - Node.js script to clear MySQL
- `backend/scripts/clear-mysql-data.sql` - SQL script to clear MySQL
- `backend/scripts/clear-supabase-data.js` - Node.js script to clear Supabase tables
- `backend/scripts/clear-all-data.js` - Combined script to clear both

