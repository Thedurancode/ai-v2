#!/usr/bin/env python3
"""
Simple test script to verify Supabase connection
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client
import traceback

def test_supabase_connection():
    """Test Supabase database connection"""
    print("Testing Supabase database connection...")
    
    # Load environment variables
    load_dotenv()
    
    # Get Supabase credentials
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL or SUPABASE_ANON_KEY environment variables not set.")
        return False
    
    print(f"Supabase URL: {supabase_url}")
    print(f"Supabase Key: {supabase_key[:10]}...{supabase_key[-10:]}")
    
    try:
        # Initialize Supabase client
        print("\nInitializing Supabase client...")
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Test a simple query to verify connection
        print("\nTesting query to search_history table...")
        response = supabase.table('search_history').select('*').limit(5).execute()
        
        # Print results
        data = response.data
        print(f"Retrieved {len(data)} records from search_history table:")
        for record in data:
            print(f"  - {record.get('timestamp', 'N/A')}: {record.get('search_type', 'N/A')} - {record.get('query', 'N/A')}")
        
        # Test a simple query to previously_considered table
        print("\nTesting query to previously_considered table...")
        response = supabase.table('previously_considered').select('*').limit(5).execute()
        
        # Print results
        data = response.data
        print(f"Retrieved {len(data)} records from previously_considered table:")
        for record in data:
            print(f"  - {record.get('company_name', 'N/A')}")
        
        # Test a simple query to potential_partners table
        print("\nTesting query to potential_partners table...")
        response = supabase.table('potential_partners').select('id, name, industry, score').limit(5).execute()
        
        # Print results
        data = response.data
        print(f"Retrieved {len(data)} records from potential_partners table:")
        for record in data:
            print(f"  - {record.get('name', 'N/A')} ({record.get('industry', 'N/A')}): {record.get('score', 'N/A')}")
        
        print("\nAll tests completed successfully!")
        return True
        
    except Exception as e:
        print(f"Error during Supabase testing: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_supabase_connection()
