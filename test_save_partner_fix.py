import os
import sys
from dotenv import load_dotenv
import traceback
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Import our database module
import database

def test_save_partner():
    """Test saving a partner to the database"""
    # Initialize Supabase client
    database.init_supabase()
    
    # Test data
    test_partner = {
        "name": "Test Company After Fix",
        "partnership_score": 4.5,
        "industry": "Test Industry",
        "description": "This is a test company for debugging purposes."
    }
    
    print(f"Attempting to save test partner to Supabase...")
    
    # Use our save_potential_partner function
    result = database.save_potential_partner(test_partner, test_partner["industry"])
    
    print(f"Save result: {result}")
    return result

if __name__ == "__main__":
    print("Testing partner save functionality with fixed code...")
    success = test_save_partner()
    print(f"Test {'succeeded' if success else 'failed'}")
    sys.exit(0 if success else 1)
