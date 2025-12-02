# Quick Migration Summary - New Supabase Project

## ✅ What's Been Updated

1. **Frontend Configuration** (`ui/src/utils/supabase/info.tsx`)
   - ✅ Updated to new project ID: `kbatcssuhveexxzywvlp`
   - ✅ Updated to new anon key

2. **Database Tables**
   - ✅ You've already run the SQL schema in your Supabase project

## 📝 What You Need to Do

### 1. Get Your Service Role Key

1. Go to: https://supabase.com/dashboard/project/kbatcssuhveexxzywvlp/settings/api
2. Copy the `service_role` key (keep this secret!)
3. You'll need this for the backend `.env` file

### 2. Update Backend .env File

Create or update `backend/.env`:

```env
# MySQL (unchanged)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=irenet_db
PORT=5001

# NEW Supabase Project
SUPABASE_URL=https://kbatcssuhveexxzywvlp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYXRjc3N1aHZlZXh4enl3dmxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYxOTc4NywiZXhwIjoyMDgwMTk1Nzg3fQ.qIffyKtHpkK2qjGuPJMIZvvILY_HZCzHLBeYz7D2oFo
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiYXRjc3N1aHZlZXh4enl3dmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTk3ODcsImV4cCI6MjA4MDE5NTc4N30.Dsxda-uX1VOEd49UlA7V2tkmtbAgj32BzhnQVEQn5z0
```

### 3. Test the Migration

```bash
# Restart backend
cd backend
node server.js

# In another terminal, test health
curl http://localhost:5001/api/health

# Test by creating a donation in the UI
# Then check Supabase dashboard → recent_donations table
```

## 🔍 Verification Checklist

- [x] Tables created in new Supabase project (`recent_donations`, `activity_logs`) ✅
- [x] Frontend `info.tsx` updated ✅
- [ ] Backend `.env` updated with new credentials (need service role key)
- [ ] Backend server restarted
- [ ] Health endpoint works
- [ ] Can create donation → appears in `recent_donations` table
- [ ] Activity logs appear in `activity_logs` table

## 📚 Additional Resources

- **Full Migration Guide**: See `MIGRATE_TO_NEW_SUPABASE.md`
- **Storage Setup** (optional): See `SUPABASE_STORAGE_SETUP.md` if you want file uploads

## ⚠️ Important Notes

1. **Authentication**: Users from old project won't work automatically. They'll need to sign up again OR you can migrate users via Admin API.

2. **Data Migration**: If you have existing data in old project, export/import manually or use a migration script.

3. **MySQL Unchanged**: Your primary MySQL database stays exactly the same - only Supabase (NoSQL/redundancy) changes.

## 🆘 Troubleshooting

**Connection errors?**
- Double-check credentials in `.env`
- Verify tables exist in new Supabase project
- Check backend logs for specific errors

**Sync not working?**
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is used (not anon key)
- Check backend logs for sync errors
- Verify MySQL is running

**Need help?**
- See detailed guide: `MIGRATE_TO_NEW_SUPABASE.md`
- Check Supabase dashboard logs
- Review backend `server.log`

