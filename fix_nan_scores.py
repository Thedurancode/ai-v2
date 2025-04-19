import os
import requests
from dotenv import load_dotenv
import json
import traceback

# Load environment variables
load_dotenv()

# Supabase Setup
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")

def get_partners_with_nan_scores():
    """Get all partners with NaN scores"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: Supabase URL or key not set.")
        return []
    
    # Use the REST API to get all partners
    url = f"{SUPABASE_URL}/rest/v1/potential_partners"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        print("Getting all potential partners...")
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            partners = response.json()
            print(f"Found {len(partners)} potential partners.")
            
            # Filter partners with NaN scores
            nan_partners = []
            for partner in partners:
                score = partner.get('score')
                if score is None or str(score).lower() == 'nan':
                    nan_partners.append(partner)
            
            print(f"Found {len(nan_partners)} partners with NaN scores.")
            return nan_partners
        else:
            print(f"Error getting partners: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        print(f"Error getting partners with NaN scores: {e}")
        traceback.print_exc()
        return []

def fix_nan_scores(nan_partners):
    """Fix NaN scores by setting them to 0"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: Supabase URL or key not set.")
        return False
    
    if not nan_partners:
        print("No partners with NaN scores to fix.")
        return True
    
    # Use the REST API to update partners
    url = f"{SUPABASE_URL}/rest/v1/potential_partners"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    success_count = 0
    error_count = 0
    
    for partner in nan_partners:
        partner_id = partner.get('id')
        partner_name = partner.get('name')
        
        if not partner_id:
            print(f"Skipping partner with no ID: {partner_name}")
            error_count += 1
            continue
        
        try:
            # Update the partner with score = 0
            update_url = f"{url}?id=eq.{partner_id}"
            update_data = {"score": 0}
            
            print(f"Updating partner {partner_name} (ID: {partner_id}) with score = 0...")
            response = requests.patch(update_url, headers=headers, json=update_data)
            
            if response.status_code == 204:
                print(f"✅ Successfully updated {partner_name}")
                success_count += 1
            else:
                print(f"❌ Error updating {partner_name}: {response.status_code} - {response.text}")
                error_count += 1
        except Exception as e:
            print(f"❌ Error updating {partner_name}: {e}")
            traceback.print_exc()
            error_count += 1
    
    print(f"\nUpdate summary:")
    print(f"- Successfully updated {success_count} partners")
    print(f"- Failed to update {error_count} partners")
    
    return success_count > 0 and error_count == 0

def main():
    """Main function to fix NaN scores"""
    print("Starting NaN score fix...")
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Supabase Key: {SUPABASE_KEY[:5]}...{SUPABASE_KEY[-5:] if SUPABASE_KEY else ''}")
    
    # Get partners with NaN scores
    nan_partners = get_partners_with_nan_scores()
    
    if not nan_partners:
        print("No partners with NaN scores found. Nothing to fix.")
        return
    
    # Fix NaN scores
    success = fix_nan_scores(nan_partners)
    
    if success:
        print("\n✅ NaN score fix completed successfully!")
        print("All NaN scores have been set to 0.")
    else:
        print("\n⚠️ NaN score fix completed with some errors.")
        print("Some partners may still have NaN scores.")
        print("Please check the logs for details.")

if __name__ == "__main__":
    main()
