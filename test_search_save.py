import os
import sys
import json
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_search_and_save():
    """Test the search endpoint and verify that partners are saved to the database"""
    # Make a search request
    search_query = "test search"
    print(f"Making search request with query: {search_query}")
    
    try:
        # Make the search request
        search_response = requests.post(
            "http://localhost:5020/search",
            json={"query": search_query}
        )
        
        if search_response.status_code != 200:
            print(f"Error making search request: {search_response.status_code} - {search_response.text}")
            return False
        
        print(f"Search request successful: {search_response.json()}")
        
        # Wait for the search to complete
        import time
        print("Waiting for search to complete...")
        for _ in range(10):  # Wait up to 10 seconds
            time.sleep(1)
            status_response = requests.get("http://localhost:5020/search-status")
            if status_response.status_code != 200:
                print(f"Error getting search status: {status_response.status_code} - {status_response.text}")
                continue
            
            status_data = status_response.json()
            print(f"Search status: {status_data.get('status')} - {status_data.get('message')}")
            
            if status_data.get('status') in ['completed', 'error']:
                break
        
        # Check if any partners were found and saved
        if status_data.get('status') == 'completed':
            results = status_data.get('results', {})
            companies = results.get('analysis', {}).get('companies', [])
            print(f"Found {len(companies)} companies in search results")
            
            # Check if any of these companies exist in the database
            supabase_url = os.environ.get("SUPABASE_URL")
            supabase_key = os.environ.get("SUPABASE_ANON_KEY")
            
            if not supabase_url or not supabase_key:
                print("Error: Supabase URL or key not available.")
                return False
            
            # Prepare headers for all requests
            headers = {
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
                "Content-Type": "application/json"
            }
            
            # Check for each company
            found_in_db = 0
            for company in companies:
                name = company.get('name')
                if not name:
                    continue
                
                # Check if the company exists in the database
                check_url = f"{supabase_url}/rest/v1/potential_partners"
                check_params = {
                    "name": f"eq.{name}",
                    "select": "id,name,score,industry"
                }
                
                check_response = requests.get(check_url, headers=headers, params=check_params)
                
                if check_response.status_code == 200:
                    data = check_response.json()
                    if data and len(data) > 0:
                        found_in_db += 1
                        print(f"Company {name} found in database: {data}")
            
            print(f"Found {found_in_db} out of {len(companies)} companies in the database")
            return found_in_db > 0
        
        return False
    except Exception as e:
        print(f"Error in test_search_and_save: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Testing search and save functionality...")
    success = test_search_and_save()
    print(f"Test {'succeeded' if success else 'failed'}")
    sys.exit(0 if success else 1)
