import os
import requests
import json
from dotenv import load_dotenv
import traceback

# Load environment variables
load_dotenv()

# Supabase Setup
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")

# Extract project reference from URL
project_ref = SUPABASE_URL.split('//')[1].split('.')[0] if SUPABASE_URL else None

def create_rls_policy():
    """Create a permissive RLS policy for the search_history table"""
    if not SUPABASE_URL or not SUPABASE_KEY or not project_ref:
        print("Error: Supabase URL or key not set.")
        return False
    
    # SQL to enable RLS and create a permissive policy
    sql = """
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
    """
    
    # Use the REST API to execute the SQL
    url = f"{SUPABASE_URL}/rest/v1/rpc/execute_sql"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    data = {
        "query": sql
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            print("RLS policy created successfully!")
            return True
        else:
            print(f"Error creating RLS policy: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Error creating RLS policy: {e}")
        traceback.print_exc()
        return False

def test_search_history_access():
    """Test if we can insert and select from the search_history table"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: Supabase URL or key not set.")
        return False
    
    # Test insert
    insert_url = f"{SUPABASE_URL}/rest/v1/search_history"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    data = {
        "search_type": "test",
        "query": "RLS test",
        "results_count": 0
    }
    
    try:
        print("Testing insert...")
        insert_response = requests.post(insert_url, headers=headers, json=data)
        if insert_response.status_code == 201:
            print("Insert successful!")
            print(f"Response: {insert_response.text}")
        else:
            print(f"Error inserting: {insert_response.status_code} - {insert_response.text}")
            return False
        
        # Test select
        print("\nTesting select...")
        select_url = f"{SUPABASE_URL}/rest/v1/search_history?order=timestamp.desc&limit=5"
        select_response = requests.get(select_url, headers=headers)
        if select_response.status_code == 200:
            print("Select successful!")
            print(f"Response: {json.dumps(select_response.json(), indent=2)}")
            return True
        else:
            print(f"Error selecting: {select_response.status_code} - {select_response.text}")
            return False
    except Exception as e:
        print(f"Error testing search history access: {e}")
        traceback.print_exc()
        return False

def main():
    """Main function to fix RLS policy and test access"""
    print("Starting RLS policy fix...")
    
    # Create RLS policy
    if not create_rls_policy():
        print("Failed to create RLS policy. Exiting.")
        return
    
    # Test search history access
    if not test_search_history_access():
        print("Failed to test search history access. Exiting.")
        return
    
    print("\nRLS policy fix completed successfully!")
    print("Your searches should now be saved to the database.")
    print("To test, run the application and perform a search.")

if __name__ == "__main__":
    main()
