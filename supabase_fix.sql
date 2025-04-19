-- Enable the HTTP extension in Supabase
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Grant usage permissions to authenticated and anon roles
GRANT USAGE ON SCHEMA extensions TO authenticated, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO authenticated, anon;

-- Add unique constraint to potential_partners table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'potential_partners_name_key'
    ) THEN
        ALTER TABLE potential_partners ADD CONSTRAINT potential_partners_name_key UNIQUE (name);
    END IF;
END $$;
