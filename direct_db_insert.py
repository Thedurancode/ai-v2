import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Supabase URL and key
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")

# Extract project reference from URL
project_ref = SUPABASE_URL.split('//')[1].split('.')[0] if SUPABASE_URL else None

# These would normally come from environment variables, but we'll derive them
DB_HOST = f"db.{project_ref}.supabase.co" if project_ref else None
DB_PORT = "5432"
DB_NAME = "postgres"
DB_USER = "postgres"
# We'll use the REST API instead since we don't have the DB password

def insert_partner_direct(name, score, industry, description):
    """
    Insert a partner directly into the database using Supabase REST API
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
            "Content-Type": "application/json"
        }

        # Prepare the data
        data = {
            "name": name,
            "score": score,
            "industry": industry,
            "description": description
        }

        # First check if the partner already exists
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
            insert_headers = headers.copy()
            insert_headers["Prefer"] = "return=minimal"

            insert_response = requests.post(
                f"{SUPABASE_URL}/rest/v1/potential_partners",
                headers=insert_headers,
                json=data
            )

            if insert_response.status_code in [200, 201, 204]:
                print(f"Successfully inserted partner {name} via REST API")
                return True
            else:
                print(f"Error inserting partner via REST API: {insert_response.status_code} - {insert_response.text}")
                return False

    except Exception as e:
        print(f"Error inserting partner directly: {e}")
        return False

def update_partner_details(name, details):
    """
    Update additional partner details directly using Supabase REST API
    """
    try:
        if not SUPABASE_URL or not SUPABASE_KEY:
            print("Supabase URL or key not found in environment variables")
            return False

        # Use the REST API directly
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }

        # First check if the partner exists
        check_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/potential_partners?name=eq.{name}&select=id",
            headers=headers
        )

        if check_response.status_code == 200 and check_response.json():
            # Partner exists, update it
            # Prepare the data
            data = {
                "leadership": details.get('leadership', []),
                "products": details.get('products', []),
                "opportunities": details.get('opportunities', []),
                "market_analysis": details.get('market_analysis', {}),
                "partnership_potential": details.get('partnership_potential', {}),
                "hq_location": details.get('hq_location', ''),
                "website": details.get('website', ''),
                "size_range": details.get('size_range', ''),
                "logo": details.get('logo', '')
            }

            # Make the request
            response = requests.patch(
                f"{SUPABASE_URL}/rest/v1/potential_partners?name=eq.{name}",
                headers=headers,
                json=data
            )

            # Check the response
            if response.status_code in [200, 201, 204]:
                print(f"Successfully updated details for partner {name} via REST API")
                return True
            else:
                print(f"Error updating partner details via REST API: {response.status_code} - {response.text}")
                return False
        else:
            print(f"Partner {name} not found, cannot update details")
            return False

    except Exception as e:
        print(f"Error updating partner details directly: {e}")
        return False

# Example usage:
# insert_partner_direct("Test Company", 4.5, "Technology", "A test company description")
# update_partner_details("Test Company", {
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
