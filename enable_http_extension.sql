-- Enable the HTTP extension in Supabase
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Grant usage permissions to authenticated and anon roles
GRANT USAGE ON SCHEMA extensions TO authenticated, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO authenticated, anon;

-- Add unique constraint to potential_partners table
ALTER TABLE potential_partners ADD CONSTRAINT potential_partners_name_key UNIQUE (name);
