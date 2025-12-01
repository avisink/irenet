require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Using anon key for database operations (respects RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Using service role key for storage operations (bypasses RLS)
const supabaseStorage = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : supabase; // Fallback to anon key if service role not available

module.exports = { supabase, supabaseStorage };
