# How to Fix Search History Not Saving to Database

The issue is with the Row Level Security (RLS) policy on the `search_history` table in your Supabase database. Here's how to fix it:

## 1. Access Supabase Dashboard

1. Go to the [Supabase Dashboard](https://app.supabase.com/)
2. Sign in with your credentials
3. Select your project (Partners)

## 2. Navigate to the SQL Editor

1. In the left sidebar, click on "SQL Editor"
2. Click "New Query" to create a new SQL query

## 3. Execute the Following SQL

Copy and paste this SQL into the editor and click "Run":

```sql
-- Enable RLS on the search_history table
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous insert" ON search_history;
DROP POLICY IF EXISTS "Allow anonymous select" ON search_history;

-- Create a policy to allow anonymous inserts
CREATE POLICY "Allow anonymous insert" ON search_history
FOR INSERT
TO anon
WITH CHECK (true);

-- Create a policy to allow anonymous selects
CREATE POLICY "Allow anonymous select" ON search_history
FOR SELECT
TO anon
USING (true);
```

## 4. Verify the Fix

After executing the SQL, run the test script again:

```bash
python3 test_search_history.py
```

You should now see "Successfully added search to history!" in the output.

## 5. Alternative: Disable RLS Temporarily

If you're still having issues, you can temporarily disable RLS on the table:

```sql
-- Disable RLS on the search_history table
ALTER TABLE search_history DISABLE ROW LEVEL SECURITY;
```

Note: This is less secure but will allow you to save searches while you troubleshoot the RLS policies.

## 6. Check Table Structure

If you're still having issues, verify the table structure:

```sql
-- Check table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'search_history';
```

Make sure the table has the following columns:
- id (uuid, primary key)
- timestamp (timestamptz, default: now())
- search_type (text)
- query (text)
- results_count (integer)

If the table structure is incorrect, you may need to recreate it:

```sql
-- Drop and recreate the table
DROP TABLE IF EXISTS search_history;
CREATE TABLE search_history (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp timestamptz DEFAULT now(),
    search_type text,
    query text,
    results_count integer
);

-- Enable RLS and create policies
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON search_history
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous select" ON search_history
FOR SELECT
TO anon
USING (true);
```

## 7. Verify Database Connection

Make sure your `.env` file has the correct Supabase URL and key:

```
SUPABASE_URL=https://holkojtkhubekpiqagbq.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in the Supabase dashboard under Project Settings > API.
