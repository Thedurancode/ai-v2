#!/usr/bin/env python3
import os
from dotenv import load_dotenv
import sys
import traceback
from datetime import datetime

# Load environment variables first
print("Loading environment variables...")
load_dotenv()

# Set PostgreSQL flag before importing db module
os.environ['USE_POSTGRES'] = 'true'
print(f"USE_POSTGRES set to: {os.environ.get('USE_POSTGRES')}")
print(f"DATABASE_URL: {os.environ.get('DATABASE_URL')}")

# Now import the db module
import db

def test_postgres_database():
    """Test PostgreSQL database connectivity and operations"""
    print("Testing PostgreSQL database connectivity...")
    
    try:
        # Initialize database
        print("Initializing database...")
        db.init_db()
        
        # Try to add a test search to history
        print("\nTesting add_search_to_history...")
        test_query = f"postgres test {datetime.now().strftime('%H:%M:%S')}"
        success = db.add_search_to_history(
            search_type="postgres_test", 
            query=test_query, 
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
    test_postgres_database() 