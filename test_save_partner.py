import os
import sys
from dotenv import load_dotenv
import traceback
from supabase import create_client, Client

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

def test_save_partner():
    """Test saving a partner to the database"""
    supabase = init_supabase()
    if not supabase:
        print("Error: Supabase client not available.")
        return False
    
    try:
        # Test data
        test_partner = {
            "name": "Test Company",
            "score": 4.5,
            "industry": "Test Industry",
            "description": "This is a test company for debugging purposes."
        }
        
        print(f"Attempting to save test partner to Supabase...")
        
        # First check if the partner already exists
        existing = supabase.table('potential_partners').select('id').eq('name', test_partner["name"]).execute()
        
        if existing.data and len(existing.data) > 0:
            # Update existing partner
            print(f"Partner {test_partner['name']} already exists, updating record")
            result = supabase.table('potential_partners').update(test_partner).eq('name', test_partner["name"]).execute()
            print(f"Update response: {result}")
            print(f"Successfully updated partner {test_partner['name']}")
        else:
            # Insert new partner
            print(f"Partner {test_partner['name']} does not exist, inserting new record")
            result = supabase.table('potential_partners').insert(test_partner).execute()
            print(f"Insert response: {result}")
            print(f"Successfully saved partner {test_partner['name']}")
        
        return True
    except Exception as e:
        print(f"Error saving test partner to Supabase: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Testing partner save functionality...")
    success = test_save_partner()
    print(f"Test {'succeeded' if success else 'failed'}")
    sys.exit(0 if success else 1)
