import os
import sys
from datetime import datetime
from database import add_search_to_history, get_search_history, init_supabase

def test_add_search():
    """Test adding a search to history"""
    print("Testing add_search_to_history function...")
    
    # Initialize Supabase client
    supabase_client = init_supabase()
    if not supabase_client:
        print("Failed to initialize Supabase client. Exiting.")
        return False
    
    # Add a test search
    search_type = "test"
    query = "Test search " + datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    results_count = 5
    
    success = add_search_to_history(search_type, query, results_count)
    if success:
        print("Successfully added search to history!")
    else:
        print("Failed to add search to history.")
    
    # Get search history
    print("\nRetrieving search history...")
    history = get_search_history()
    
    if history:
        print(f"Found {len(history)} search history entries:")
        for i, entry in enumerate(history[:5]):  # Show only the first 5 entries
            print(f"{i+1}. {entry.get('timestamp')} - {entry.get('type')} - {entry.get('query')} - {entry.get('results_count')}")
        return True
    else:
        print("No search history found or failed to retrieve history.")
        return False

if __name__ == "__main__":
    test_add_search()
