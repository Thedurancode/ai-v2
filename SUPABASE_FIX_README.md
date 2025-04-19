# Supabase HTTP Request Error Fix

This document provides instructions to fix the error:

```
Error saving potential partner to Supabase: {'code': '42883', 'details': None, 'hint': 'No function matches the given name and argument types. You might need to add explicit type casts.', 'message': 'function supabase_functions.http_request(unknown, unknown, unknown, text, unknown) does not exist'}
```

## The Problem

This error occurs because:

1. The PostgreSQL HTTP extension is not enabled in your Supabase project
2. The `potential_partners` table is missing a unique constraint on the `name` column, which is needed for the ON CONFLICT specification in upsert operations

## Solution

### Option 1: Using the Supabase Dashboard (Recommended)

1. **Enable the HTTP Extension**:
   - Log in to your Supabase dashboard
   - Go to your project
   - Navigate to "Database" > "Extensions"
   - Find "http" in the list and enable it
   - Make sure it's enabled for both `authenticated` and `anon` roles

2. **Add a Unique Constraint**:
   - In the Supabase dashboard, go to "SQL Editor"
   - Run the following SQL command:
   ```sql
   ALTER TABLE potential_partners ADD CONSTRAINT potential_partners_name_key UNIQUE (name);
   ```

### Option 2: Using the Provided Script

We've created a Python script that will attempt to fix these issues automatically:

1. Make sure your `.env` file contains the correct Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Run the setup script:
   ```bash
   python run_supabase_setup.py
   ```

### Option 3: Manual SQL Execution

If you prefer to run the SQL commands manually through another tool:

1. Connect to your Supabase PostgreSQL database
2. Run the commands in the `enable_http_extension.sql` file:
   ```sql
   -- Enable the HTTP extension in Supabase
   CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

   -- Grant usage permissions to authenticated and anon roles
   GRANT USAGE ON SCHEMA extensions TO authenticated, anon;
   GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO authenticated, anon;

   -- Add unique constraint to potential_partners table
   ALTER TABLE potential_partners ADD CONSTRAINT potential_partners_name_key UNIQUE (name);
   ```

## Code Changes

We've also updated the `database.py` file to:

1. Add missing imports for `json` and `datetime`
2. Improve the partner saving logic to use upsert with a fallback mechanism

These changes should resolve the error and make the partner saving process more robust.

## Verification

After applying these fixes, restart your application and try saving potential partners again. The error should be resolved.

If you continue to experience issues, please check the Supabase logs for more details.
