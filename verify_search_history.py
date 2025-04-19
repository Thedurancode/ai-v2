import os
import requests
from dotenv import load_dotenv
import json
from datetime import datetime

# Load environment variables
load_dotenv()

# Supabase Setup
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")

def test_direct_api_insert():
    """Test inserting a search directly using the REST API"""
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
        "query": f"API Test {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "results_count": 10
    }
    
    try:
        print("Testing direct API insert...")
        print(f"URL: {insert_url}")
        print(f"Headers: {headers}")
        print(f"Data: {data}")
        
        insert_response = requests.post(insert_url, headers=headers, json=data)
        print(f"Status code: {insert_response.status_code}")
        print(f"Response: {insert_response.text}")
        
        if insert_response.status_code == 201:
            print("✅ Insert successful!")
            return True
        else:
            print(f"❌ Error inserting: {insert_response.status_code} - {insert_response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing direct API insert: {e}")
        return False

def test_get_search_history():
    """Test getting search history using the REST API"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: Supabase URL or key not set.")
        return False
    
    # Test select
    select_url = f"{SUPABASE_URL}/rest/v1/search_history?order=timestamp.desc&limit=5"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        print("\nTesting get search history...")
        print(f"URL: {select_url}")
        
        select_response = requests.get(select_url, headers=headers)
        print(f"Status code: {select_response.status_code}")
        
        if select_response.status_code == 200:
            print("✅ Select successful!")
            data = select_response.json()
            if data:
                print(f"Found {len(data)} search history entries:")
                for i, entry in enumerate(data):
                    print(f"{i+1}. {entry.get('timestamp')} - {entry.get('search_type')} - {entry.get('query')} - {entry.get('results_count')}")
            else:
                print("No search history entries found.")
            return True
        else:
            print(f"❌ Error selecting: {select_response.status_code} - {select_response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing get search history: {e}")
        return False

def check_rls_policies():
    """Check RLS policies on the search_history table"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: Supabase URL or key not set.")
        return False
    
    # Use the REST API to execute SQL
    url = f"{SUPABASE_URL}/rest/v1/rpc/execute_sql"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "query": """
        SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies
        WHERE tablename = 'search_history';
        """
    }
    
    try:
        print("\nChecking RLS policies...")
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            print("✅ Policy check successful!")
            policies = response.json()
            if policies:
                print(f"Found {len(policies)} policies:")
                for i, policy in enumerate(policies):
                    print(f"{i+1}. {policy.get('policyname')} - {policy.get('cmd')} - {policy.get('roles')}")
            else:
                print("No policies found for search_history table.")
            return True
        else:
            print(f"❌ Error checking policies: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error checking RLS policies: {e}")
        return False

def main():
    """Main function to verify search history functionality"""
    print("Starting search history verification...")
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Supabase Key: {SUPABASE_KEY[:5]}...{SUPABASE_KEY[-5:] if SUPABASE_KEY else ''}")
    
    # Test direct API insert
    insert_success = test_direct_api_insert()
    
    # Test get search history
    get_success = test_get_search_history()
    
    # Check RLS policies
    # policy_success = check_rls_policies()
    
    if insert_success and get_success:
        print("\n✅ Search history verification completed successfully!")
        print("Your searches should now be saved to the database.")
    else:
        print("\n❌ Search history verification failed.")
        print("Please follow the instructions in supabase_rls_instructions.md to fix the issue.")

if __name__ == "__main__":
    main()
