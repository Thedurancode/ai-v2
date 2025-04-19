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
