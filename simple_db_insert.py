import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Supabase URL and key
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")

def insert_partner_simple(name, score, industry, description, details=None):
    """
    Insert a partner directly using the Supabase REST API with a simplified approach
    This bypasses the Supabase client library and HTTP extension completely
    """
    try:
        if not SUPABASE_URL or not SUPABASE_KEY:
            print("Supabase URL or key not found in environment variables")
            return False
            
        # Use the REST API directly
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        
        # Prepare the data - start with basic fields
        data = {
            "name": name,
            "score": score,
            "industry": industry,
            "description": description
        }
        
        # Add additional details if provided
        if details and isinstance(details, dict):
            # Add each field individually to avoid nested JSON issues
            if "leadership" in details:
                data["leadership"] = details["leadership"]
            if "products" in details:
                data["products"] = details["products"]
            if "opportunities" in details:
                data["opportunities"] = details["opportunities"]
            if "market_analysis" in details:
                data["market_analysis"] = details["market_analysis"]
            if "partnership_potential" in details:
                data["partnership_potential"] = details["partnership_potential"]
            if "hq_location" in details:
                data["hq_location"] = details["hq_location"]
            if "website" in details:
                data["website"] = details["website"]
            if "size_range" in details:
                data["size_range"] = details["size_range"]
            if "logo" in details:
                data["logo"] = details["logo"]
        
        # First check if the partner exists
        check_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/potential_partners?name=eq.{name}&select=id",
            headers=headers
        )
        
        if check_response.status_code == 200 and check_response.json():
            # Partner exists, update it
            update_response = requests.patch(
                f"{SUPABASE_URL}/rest/v1/potential_partners?name=eq.{name}",
                headers=headers,
                json=data
            )
            
            if update_response.status_code in [200, 201, 204]:
                print(f"Successfully updated partner {name} via REST API")
                return True
            else:
                print(f"Error updating partner via REST API: {update_response.status_code} - {update_response.text}")
                return False
        else:
            # Partner doesn't exist, insert it
            insert_response = requests.post(
                f"{SUPABASE_URL}/rest/v1/potential_partners",
                headers=headers,
                json=data
            )
            
            if insert_response.status_code in [200, 201, 204]:
                print(f"Successfully inserted partner {name} via REST API")
                return True
            else:
                print(f"Error inserting partner via REST API: {insert_response.status_code} - {insert_response.text}")
                return False
        
    except Exception as e:
        print(f"Error in simple partner insert: {e}")
        return False

# Example usage:
# insert_partner_simple("Test Company", 4.5, "Technology", "A test company description")
# 
# # With additional details
# insert_partner_simple("Test Company", 4.5, "Technology", "A test company description", {
#     "leadership": ["John Doe (CEO)", "Jane Smith (CTO)"],
#     "products": ["Product A", "Product B"],
#     "opportunities": ["Opportunity 1", "Opportunity 2"],
#     "market_analysis": {"market_size": "$1B", "growth_rate": "10%"},
#     "partnership_potential": {"synergy": "High", "revenue_potential": "$500K"},
#     "hq_location": "Toronto, ON",
#     "website": "https://example.com",
#     "size_range": "501-1,000",
#     "logo": "https://example.com/logo.png"
# })
