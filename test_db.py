#!/usr/bin/env python3
import os
from dotenv import load_dotenv
import db
import sys
import traceback

def test_database(use_postgres=True):
    """Test database connectivity and operations"""
    print("Testing database connectivity...")
    
    # Load environment variables
    print("Loading environment variables...")
    load_dotenv()
    
    # Set database type
    if use_postgres:
        os.environ['USE_POSTGRES'] = 'true'
        print("Using PostgreSQL database")
    else:
        os.environ['USE_POSTGRES'] = 'false'
        print("Using SQLite database")
    
    try:
        # Initialize database
        print("Initializing database...")
        db.init_db()
        
        # Try to add a test search to history
        print("\nTesting add_search_to_history...")
        success = db.add_search_to_history(
            search_type="test", 
            query="test database connection", 
            results_count=0
        )
        print(f"Adding search to history: {'Success' if success else 'Failed'}")
        
        # Try to retrieve recent searches
        print("\nTesting get_recent_searches...")
        searches = db.get_recent_searches(10)
        print(f"Retrieved {len(searches)} searches")
        for search in searches:
            print(f"  - {search['timestamp']}: {search['type']} - {search['query']}")
        
    except Exception as e:
        print(f"Error during database testing: {e}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    # Uncomment the desired option:
    test_database(use_postgres=True)   # Use PostgreSQL
    # test_database(use_postgres=False)  # Use SQLite 