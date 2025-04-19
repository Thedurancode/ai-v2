-- Option 1: Enable RLS on the table (if not already enabled)
ALTER TABLE previously_considered ENABLE ROW LEVEL SECURITY;

-- Option 2: Create a policy that allows all operations for authenticated and anonymous users
CREATE POLICY "Allow all operations for all users" 
ON previously_considered
USING (true) 
WITH CHECK (true);

-- Option 3: Create separate policies for each operation type
CREATE POLICY "Allow inserts for all users" 
ON previously_considered
FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Allow selects for all users" 
ON previously_considered
FOR SELECT 
TO authenticated, anon
USING (true);

-- Option 4: Add a role-based column to the table
-- ALTER TABLE previously_considered ADD COLUMN user_id UUID DEFAULT auth.uid();
-- (This would require modifying the application code too) 