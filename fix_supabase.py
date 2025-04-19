import os
from dotenv import load_dotenv
from supabase import create_client
import traceback

# Load environment variables
load_dotenv()

# Supabase Setup
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    print("Error: SUPABASE_URL or SUPABASE_ANON_KEY environment variables not set.")
    exit(1)

try:
    # Initialize Supabase client
    supabase = create_client(supabase_url, supabase_key)
    print("Supabase client initialized successfully.")
    
    # 1. Enable HTTP extension
    print("Enabling HTTP extension...")
    try:
        result = supabase.rpc(
            'exec_sql', 
            {'sql_string': 'CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;'}
        ).execute()
        print("HTTP extension enabled successfully.")
    except Exception as e:
        print(f"Error enabling HTTP extension: {e}")
        print("This might be normal if you don't have permission to create extensions.")
        print("You may need to enable this from the Supabase dashboard.")
    
    # 2. Grant permissions
    print("Granting permissions...")
    try:
        result = supabase.rpc(
            'exec_sql', 
            {'sql_string': 'GRANT USAGE ON SCHEMA extensions TO authenticated, anon;'}
        ).execute()
        print("Schema permissions granted successfully.")
    except Exception as e:
        print(f"Error granting schema permissions: {e}")
    
    try:
        result = supabase.rpc(
            'exec_sql', 
            {'sql_string': 'GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO authenticated, anon;'}
        ).execute()
        print("Function permissions granted successfully.")
    except Exception as e:
        print(f"Error granting function permissions: {e}")
    
    # 3. Add unique constraint to potential_partners table
    print("Adding unique constraint to potential_partners table...")
    try:
        # First check if the constraint already exists
        check_result = supabase.rpc(
            'exec_sql', 
            {'sql_string': "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'potential_partners' AND constraint_name = 'potential_partners_name_key';"}
        ).execute()
        
        if check_result.data and len(check_result.data) > 0:
            print("Unique constraint already exists.")
        else:
            result = supabase.rpc(
                'exec_sql', 
                {'sql_string': "ALTER TABLE potential_partners ADD CONSTRAINT potential_partners_name_key UNIQUE (name);"}
            ).execute()
            print("Unique constraint added successfully.")
    except Exception as e:
        print(f"Error adding unique constraint: {e}")
        traceback.print_exc()
    
    print("Setup completed. Please restart your application to apply the changes.")
    
except Exception as e:
    print(f"Error: {e}")
    traceback.print_exc()
    exit(1)
