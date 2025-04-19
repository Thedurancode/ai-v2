-- Step 1: Identify duplicate names in the potential_partners table
SELECT name, COUNT(*) as count
FROM potential_partners
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Step 2: Create a temporary table to store the IDs we want to keep
-- (We'll keep the most recently updated record for each duplicate name)
CREATE TEMP TABLE records_to_keep AS
WITH ranked_records AS (
  SELECT 
    id,
    name,
    updated_at,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY updated_at DESC) as row_num
  FROM potential_partners
)
SELECT id
FROM ranked_records
WHERE row_num = 1;

-- Step 3: Delete duplicate records (keeping only the most recent one for each name)
DELETE FROM potential_partners
WHERE id NOT IN (SELECT id FROM records_to_keep)
AND name IN (
  SELECT name
  FROM potential_partners
  GROUP BY name
  HAVING COUNT(*) > 1
);

-- Step 4: Verify that duplicates are gone
SELECT name, COUNT(*) as count
FROM potential_partners
GROUP BY name
HAVING COUNT(*) > 1;

-- Step 5: Now add the unique constraint
ALTER TABLE potential_partners ADD CONSTRAINT potential_partners_name_key UNIQUE (name);

-- Step 6: Enable the HTTP extension if it's not already enabled
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Step 7: Grant permissions
GRANT USAGE ON SCHEMA extensions TO authenticated, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO authenticated, anon;
