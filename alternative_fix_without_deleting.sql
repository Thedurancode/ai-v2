-- Alternative approach that doesn't delete any records
-- Instead, it renames duplicate entries by adding a suffix

-- Step 1: Identify duplicate names in the potential_partners table
SELECT name, COUNT(*) as count
FROM potential_partners
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Step 2: Update duplicate names by adding a suffix with their ID
DO $$
DECLARE
    duplicate_record RECORD;
BEGIN
    FOR duplicate_record IN (
        WITH duplicates AS (
            SELECT 
                id,
                name,
                ROW_NUMBER() OVER (PARTITION BY name ORDER BY updated_at DESC) as row_num
            FROM potential_partners
            WHERE name IN (
                SELECT name
                FROM potential_partners
                GROUP BY name
                HAVING COUNT(*) > 1
            )
        )
        SELECT id, name
        FROM duplicates
        WHERE row_num > 1
    ) LOOP
        UPDATE potential_partners
        SET name = duplicate_record.name || ' (' || duplicate_record.id || ')'
        WHERE id = duplicate_record.id;
    END LOOP;
END $$;

-- Step 3: Verify that duplicates are gone
SELECT name, COUNT(*) as count
FROM potential_partners
GROUP BY name
HAVING COUNT(*) > 1;

-- Step 4: Now add the unique constraint
ALTER TABLE potential_partners ADD CONSTRAINT potential_partners_name_key UNIQUE (name);

-- Step 5: Enable the HTTP extension if it's not already enabled
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Step 6: Grant permissions
GRANT USAGE ON SCHEMA extensions TO authenticated, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO authenticated, anon;
