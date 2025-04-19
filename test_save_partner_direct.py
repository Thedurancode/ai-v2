import os
import sys
import traceback
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Supabase credentials
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")

def save_partner_direct_http(name, score, industry, description=""):
    """Save partner directly to Supabase using HTTP requests"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: Supabase URL or key not available.")
        return False
    
    try:
        print(f"Attempting to save partner {name} to Supabase with score: {score}")
        
        # Prepare headers for all requests
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        
        # First check if the partner already exists
        check_url = f"{SUPABASE_URL}/rest/v1/potential_partners"
        check_params = {
            "name": f"eq.{name}",
            "select": "id"
        }
        
        print(f"Checking if {name} exists")
        check_response = requests.get(check_url, headers=headers, params=check_params)
        
        if check_response.status_code == 200:
            data = check_response.json()
            if data and len(data) > 0:
                print(f"Partner {name} already exists, updating")
                
                # Update the existing partner
                update_url = f"{SUPABASE_URL}/rest/v1/potential_partners"
                update_params = {"name": f"eq.{name}"}
                update_data = {
                    "score": score,
                    "industry": industry,
                    "description": description,
                    "updated_at": "now()"
                }
                
                update_response = requests.patch(update_url, headers=headers, params=update_params, json=update_data)
                
                if update_response.status_code in [200, 201, 204]:
                    print(f"Successfully updated partner {name}")
                    return True
                else:
                    print(f"Error updating partner: {update_response.status_code} - {update_response.text}")
                    return False
            
            # Partner doesn't exist, insert it
            print(f"Partner {name} does not exist, inserting new record")
            
            # Prepare data for insert
            insert_data = {
                "name": name,
                "score": score,
                "industry": industry,
                "description": description,
                "created_at": "now()",
                "updated_at": "now()"
            }
            
            # Insert the record
            insert_url = f"{SUPABASE_URL}/rest/v1/potential_partners"
            insert_response = requests.post(insert_url, headers=headers, json=insert_data)
            
            if insert_response.status_code in [200, 201, 204]:
                print(f"Successfully inserted partner {name}")
                return True
            else:
                print(f"Error inserting partner: {insert_response.status_code} - {insert_response.text}")
                return False
        else:
            print(f"Error checking if partner exists: {check_response.status_code} - {check_response.text}")
            return False
    except Exception as e:
        print(f"Error in save_partner_direct_http: {e}")
        traceback.print_exc()
        return False

def test_save_partner():
    """Test saving a partner to the database"""
    # Test data
    test_partner = {
        "name": "Test Company Direct HTTP",
        "score": 4.5,
        "industry": "Test Industry",
        "description": "This is a test company for debugging purposes."
    }
    
    print(f"Attempting to save test partner to Supabase...")
    
    # Use our save_partner_direct_http function
    result = save_partner_direct_http(
        test_partner["name"], 
        test_partner["score"], 
        test_partner["industry"], 
        test_partner["description"]
    )
    
    print(f"Save result: {result}")
    return result

if __name__ == "__main__":
    print("Testing partner save functionality with direct HTTP...")
    success = test_save_partner()
    print(f"Test {'succeeded' if success else 'failed'}")
    sys.exit(0 if success else 1)
