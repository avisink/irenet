# Migration Guide: Move to New Supabase Project

This guide will help you migrate from your current Supabase project (`ubtkdilrvivwoqgtgyqg`) to your new Supabase project (`kbatcssuhveexxzywvlp`).

## New Project Credentials

- **Project ID**: `kbatcssuhveexxzywvlp`
- **Project URL**: `https://kbatcssuhveexxzywvlp.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYXRjc3N1aHZlZXh4enl3dmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTk3ODcsImV4cCI6MjA4MDE5NTc4N30.Dsxda-uX1VOEd49UlA7V2tkmtbAgj32BzhnQVEQn5z0`
- **Service Role Key**: Get this from Project Settings → API → service_role key

## Step 1: Set Up Tables in New Supabase Project

✅ **Already Completed** - You've run the SQL query in the SQL Editor.

1. Go to your new Supabase project dashboard: https://supabase.com/dashboard/project/kbatcssuhveexxzywvlp
2. Navigate to **SQL Editor**
3. Click **"New query"**
4. Copy and paste the contents of `backend/config/supabase-new-project-schema.sql`
5. Click **"Run"** to create the tables:
   - `recent_donations`
   - `activity_logs`

## Step 2: Update Backend Configuration

Update `backend/.env` file:

```env
# NEW Supabase project credentials
SUPABASE_URL=https://kbatcssuhveexxzywvlp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYXRjc3N1aHZlZXh4enl3dmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTk3ODcsImV4cCI6MjA4MDE5NTc4N30.Dsxda-uX1VOEd49UlA7V2tkmtbAgj32BzhnQVEQn5z0
```

**To get your Service Role Key:**
1. Go to: https://supabase.com/dashboard/project/kbatcssuhveexxzywvlp/settings/api
2. Copy the `service_role` key (keep this secret!)
3. Paste it as `SUPABASE_SERVICE_ROLE_KEY` in your `.env` file

# Keep MySQL unchanged
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=irenet_db
PORT=5001
```

## Step 3: Update Frontend Configuration

Update `ui/src/utils/supabase/info.tsx`:

✅ **Already Updated** - Frontend config has been updated with correct credentials.

```typescript
export const projectId = "kbatcssuhveexxzywvlp"
export const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYXRjc3N1aHZlZXh4enl3dmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTk3ODcsImV4cCI6MjA4MDE5NTc4N30.Dsxda-uX1VOEd49UlA7V2tkmtbAgj32BzhnQVEQn5z0"
```

## Step 4: Migrate Existing Data (Optional)

If you have existing data in the old Supabase project that you want to migrate:

1. Export data from old project:
   - Go to old project → Table Editor → `recent_donations` → Export
   - Go to old project → Table Editor → `activity_logs` → Export

2. Import into new project:
   - Go to new project → Table Editor → `recent_donations` → Import
   - Go to new project → Table Editor → `activity_logs` → Import

Or use the migration script (if you have one set up).

## Step 5: Test the Migration

1. **Restart backend server**:
   ```bash
   cd backend
   node server.js
   ```

2. **Test backend health**:
   ```bash
   curl http://localhost:5001/api/health
   ```

3. **Test Supabase sync**:
   - Create a donation via the UI
   - Check new Supabase project → `recent_donations` table
   - Verify data appears there

4. **Test activity logs**:
   - Perform some actions in the app
   - Check new Supabase project → `activity_logs` table
   - Verify logs are being created

## Step 6: Verify Authentication

Since you're using Supabase Auth, you may need to:

1. **Migrate users** (if needed):
   - Users are stored in Supabase Auth (separate from tables)
   - If you want to migrate users, you'll need to use Supabase Auth Admin API
   - Or users can re-register in the new project

2. **Test login/signup**:
   - Try signing up a new user
   - Try logging in
   - Verify authentication works

## Troubleshooting

### Connection Errors
- Verify credentials are correct in `.env` and `info.tsx`
- Check that tables have been created in new Supabase project
- Ensure network allows connections to Supabase

### Sync Not Working
- Check backend logs for Supabase sync errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct (not anon key)
- Test Supabase connection manually

### Authentication Issues
- Users from old project won't automatically work in new project
- Users need to sign up again OR migrate auth users via Admin API
- Check Supabase Auth settings in new project dashboard

## Next Steps

After successful migration:

1. **Monitor sync**: Watch backend logs to ensure MySQL → Supabase sync works
2. **Test failover**: Stop MySQL temporarily and verify Supabase fallback works
3. **Archive old project**: After confirming everything works, you can archive/delete the old project
4. **Set up Storage** (optional): If you want to use Supabase Storage for files, see storage setup guide

## Files Changed

- `backend/.env` - Supabase credentials
- `ui/src/utils/supabase/info.tsx` - Frontend Supabase config
- **MySQL database** - NO CHANGES (stays as primary)

