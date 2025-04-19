import os
import sys
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
import traceback

# Load environment variables
load_dotenv()

# Supabase Setup
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_ANON_KEY")

def init_supabase():
    """Initialize the Supabase client"""
    if supabase_url and supabase_key:
        try:
            supabase_client = create_client(supabase_url, supabase_key)
            print("Supabase client initialized successfully.")
            return supabase_client
        except Exception as e:
            print(f"Error initializing Supabase client: {e}")
            traceback.print_exc()
            return None
    else:
        print("Warning: SUPABASE_URL or SUPABASE_ANON_KEY environment variables not set.")
        return None

def add_search_to_history(supabase_client, search_type, query, results_count):
    """Add a search to the history database (Supabase)"""
    try:
        # timestamp is handled by default value in Supabase
        response = supabase_client.table('search_history').insert({
            "search_type": search_type,
            "query": query,
            "results_count": results_count
        }).execute()
        
        print(f"Search added to history: {search_type} - {query} - {results_count}")
        print(f"Response: {response}")
        return True
    except Exception as e:
        print(f"Error adding search to Supabase history: {str(e)}")
        traceback.print_exc()
        return False

def get_search_history(supabase_client, limit=10):
    """Get search history from the database"""
    try:
        response = supabase_client.table('search_history').select('*').order('timestamp', desc=True).limit(limit).execute()
        print(f"Search history: {response}")
        return response
    except Exception as e:
        print(f"Error getting search history: {str(e)}")
        traceback.print_exc()
        return None

def main():
    """Main function to add a search to history"""
    # Get search parameters from command line arguments
    if len(sys.argv) < 3:
        print("Usage: python add_search_to_history.py <search_type> <query> [results_count]")
        print("Example: python add_search_to_history.py industry 'technology' 10")
        return
    
    search_type = sys.argv[1]
    query = sys.argv[2]
    results_count = int(sys.argv[3]) if len(sys.argv) > 3 else 0
    
    # Initialize Supabase client
    supabase_client = init_supabase()
    if not supabase_client:
        print("Failed to initialize Supabase client. Exiting.")
        return
    
    # Add search to history
    if add_search_to_history(supabase_client, search_type, query, results_count):
        print("Search added successfully!")
    else:
        print("Failed to add search to history.")
    
    # Get search history
    print("\nRetrieving search history...")
    get_search_history(supabase_client)

if __name__ == "__main__":
    main()
