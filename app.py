import os
import requests
import json
from flask import Flask, render_template, request, jsonify, send_from_directory, send_file
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime
import base64
import re
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import random
import traceback
from threading import Thread
import time  # Added for sleep function
# import sqlite3 # Removed SQLite
from supabase import create_client, Client # Added Supabase
from flask_cors import CORS
import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Load environment variables
load_dotenv()

# --- Supabase Setup ---
# Use Project URL and Anon Key from environment variables
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_ANON_KEY")

# Initialize client only if URL and Key are present
if supabase_url and supabase_key:
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        print("Supabase client initialized successfully.")
    except Exception as e:
        print(f"Error initializing Supabase client: {e}")
        supabase = None # Set client to None on error
else:
    print("Warning: SUPABASE_URL or SUPABASE_ANON_KEY environment variables not set. Supabase client not initialized.")
    supabase = None
# --- End Supabase Setup ---

# Set up static folder for React build
static_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dura-react', 'dist')
if not os.path.exists(static_folder):
    print(f"Warning: Static folder not found at {static_folder}. Creating it...")
    os.makedirs(static_folder, exist_ok=True)

print(f"Using static folder: {static_folder}")
app = Flask(__name__, static_folder=static_folder)
CORS(app, resources={r"/*": {"origins": "*"}})

# Register blueprints
from app.routes.potential_partners import potential_partners_bp
from app.routes.partner_research import partner_research_bp
from app.routes.seed_data import seed_data_bp
from app.routes.top_partners import top_partners_bp
from app.routes.generate_research import generate_research_bp
app.register_blueprint(potential_partners_bp)
app.register_blueprint(partner_research_bp)
app.register_blueprint(seed_data_bp)
app.register_blueprint(top_partners_bp)
app.register_blueprint(generate_research_bp)

# Add a debug route to test partner research
@app.route('/api/debug/partner-research/<partner_id>', methods=['GET'])
def debug_partner_research(partner_id):
    """Debug endpoint for partner research"""
    print(f"DEBUG: Received request for partner research with ID: {partner_id}")
    return jsonify({
        'success': True,
        'message': 'Debug endpoint reached successfully',
        'partner_id': partner_id
    })

# Add a test route for LinkedIn Data API
@app.route('/api/test/linkedin-data/<company_name>', methods=['GET'])
def test_linkedin_data(company_name):
    """Test endpoint for LinkedIn Data API"""
    print(f"TEST: Fetching LinkedIn data for company: {company_name}")

    # Make a direct API call to LinkedIn Data API
    try:
        # Get RapidAPI key from header first, then environment variable
        rapidapi_key = request.headers.get("X-RapidAPI-Key") or os.environ.get("RAPIDAPI_KEY")
        print(f"Using RapidAPI key: {rapidapi_key[:10]}..." if rapidapi_key else "No RapidAPI key found")

        if not rapidapi_key:
            return jsonify({
                'success': False,
                'company_name': company_name,
                'error': "No RapidAPI key found in headers or environment variables"
            })

        # Format company name
        formatted_company_name = company_name.lower().replace(' ', '')

        # Configure API request
        url = f"https://linkedin-data-api.p.rapidapi.com/get-company-insights"
        querystring = {"username": formatted_company_name}
        headers = {
            "X-RapidAPI-Key": rapidapi_key,
            "X-RapidAPI-Host": "linkedin-data-api.p.rapidapi.com"
        }

        # Make the request
        print(f"Making direct API request to: {url} for company: {company_name}")
        response = requests.get(url, headers=headers, params=querystring)

        # Check response
        if response.status_code == 200:
            data = response.json()
            return jsonify({
                'success': True,
                'company_name': company_name,
                'raw_data': data,
                'formatted_data': format_linkedin_data(data) if data.get('success') and data.get('data') else None
            })
        else:
            return jsonify({
                'success': False,
                'company_name': company_name,
                'status_code': response.status_code,
                'error': response.text
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'company_name': company_name,
            'error': str(e)
        })

# Helper function to format LinkedIn data
def format_linkedin_data(data):
    """Format LinkedIn data into a more usable structure"""
    if not data.get('success') or not data.get('data'):
        return None

    company_data = data.get('data', {})

    # Format the data to match the expected Coresignal format
    coresignal_data = {
        "company_details": {
            "name": company_data.get("name", ""),
            "website": company_data.get("website", ""),
            "headquarters": "",
            "size": company_data.get("staffCountRange", ""),
            "industry": ", ".join(company_data.get("industries", [])) if company_data.get("industries") else "",
            "founded": company_data.get("founded", ""),
            "company_type": company_data.get("type", ""),
            "description": company_data.get("description", "")
        },
        "leadership": {
            "executives": []
        },
        "products_and_services": []
    }

    # Format headquarters
    if company_data.get("headquarter"):
        hq = company_data.get("headquarter")
        hq_parts = []
        if hq.get("city"):
            hq_parts.append(hq.get("city"))
        if hq.get("geographicArea"):
            hq_parts.append(hq.get("geographicArea"))
        if hq.get("country"):
            hq_parts.append(hq.get("country"))
        coresignal_data["company_details"]["headquarters"] = ", ".join(hq_parts)

    # Add specialties as products/services
    if company_data.get("specialities"):
        for specialty in company_data.get("specialities", []):
            coresignal_data["products_and_services"].append({
                "name": specialty,
                "description": ""
            })

    # Add logo
    if company_data.get("Images") and company_data.get("Images").get("logo"):
        coresignal_data["company_details"]["logo"] = company_data.get("Images").get("logo")

    return coresignal_data

# Database setup - Removed DB_PATH

# Global variables
previously_considered_companies = set()
search_history = []

# Removed init_db() function definition and call

# Load initial data from Supabase if client is available
# (Moved this logic below the function definitions)


# Function to add a search to history
def add_search_to_history(search_type, query, results_count):
    """Add a search to the history database (Supabase)"""
    if not supabase:
        print("Error: Supabase client not available.")
        return False
    try:
        # timestamp is handled by default value in Supabase
        data, count = supabase.table('search_history').insert({
            "search_type": search_type,
            "query": query,
            "results_count": results_count
        }).execute()

        # Also update in-memory search history for current session
        # Fetch the newly inserted record to get the timestamp
        if data and len(data) > 0 and len(data[1]) > 0:
             new_entry = data[1][0]
             # Ensure search_history is initialized
             if 'search_history' not in globals() or search_history is None:
                 search_history = []
             search_history.append({
                 "timestamp": new_entry.get('timestamp'), # Get timestamp from Supabase
                 "type": search_type,
                 "query": query,
                 "results_count": results_count
             })
        else:
             # Fallback if insert didn't return data as expected
             if 'search_history' not in globals() or search_history is None:
                 search_history = []
             search_history.append({
                 "timestamp": datetime.now().isoformat(), # Use current time as fallback
                 "type": search_type,
                 "query": query,
                 "results_count": results_count
             })

        return True
    except Exception as e:
        print(f"Error adding search to Supabase history: {str(e)}")
        traceback.print_exc() # Print stack trace for debugging
        return False

# Function to add company to previously considered list
def add_company_to_considered(company_name):
    """Add a company to the previously considered companies database (Supabase)"""
    global previously_considered_companies

    if not supabase:
        print("Error: Supabase client not available.")
        return False
    try:
        # Instead of direct table insert, call the RPC function that bypasses RLS
        data = supabase.rpc('add_considered_company', {"company_name_param": company_name}).execute()

        # Also update in-memory set for current session
        # Ensure the set exists
        if 'previously_considered_companies' not in globals() or previously_considered_companies is None:
            previously_considered_companies = set()
        previously_considered_companies.add(company_name)

        return True
    except Exception as e:
        print(f"Error adding company to Supabase previously considered: {str(e)}")
        traceback.print_exc() # Print stack trace for debugging
        return False

# Function to save non-conflicting company to potential partners database
def save_potential_partner(company, industry):
    """Save company to potential_partners table (Supabase)"""
    if not supabase:
        print("Error: Supabase client not available.")
        return False
    try:
        # Safety check on input
        if not company or not isinstance(company, dict):
            print(f"Error: Invalid company data for save_potential_partner: {company}")
            return False

        name = company.get('name')
        if not name or not isinstance(name, str) or len(name.strip()) == 0:
            print(f"Error: Company name is required to save potential partner: {company}")
            return False

        # Get score as float
        try:
            score = float(company.get('partnership_score', 0))
        except (ValueError, TypeError):
            score = 0.0

        print(f"Saving partner {name} to Supabase with score: {score} (type: {type(score)})")

        # Prepare data for Supabase, ensuring JSON fields are dicts/lists
        description = company.get('description', '')[:1000] if company.get('description') else ''

        # Leadership
        key_leadership = []
        if 'key_leadership' in company and isinstance(company['key_leadership'], list):
            key_leadership = company['key_leadership']
        elif 'coresignal_data' in company and 'leadership' in company['coresignal_data'] and 'executives' in company['coresignal_data']['leadership']:
             executives = company['coresignal_data']['leadership']['executives'][:3]
             key_leadership = [f"{exec['name']} ({exec['title']})" for exec in executives]

        # Products
        key_products = []
        if 'key_products' in company and isinstance(company['key_products'], list):
            key_products = company['key_products']
        elif 'coresignal_data' in company and 'products_and_services' in company['coresignal_data']:
             products_list = company['coresignal_data']['products_and_services'][:3]
             key_products = [product['name'] for product in products_list]

        # Opportunities
        partnership_opportunities = []
        if 'partnership_opportunities' in company and isinstance(company['partnership_opportunities'], list):
            partnership_opportunities = company['partnership_opportunities']

        # Market Analysis
        market_analysis = {}
        if 'market_analysis' in company and isinstance(company['market_analysis'], dict):
            market_analysis = company['market_analysis']

        # Partnership Potential
        partnership_potential = {}
        if 'partnership_potential' in company and isinstance(company['partnership_potential'], dict):
            partnership_potential = company['partnership_potential']

        # Headquarters (use hq_location in Supabase)
        hq_location = ""
        if 'coresignal_data' in company and 'company_details' in company['coresignal_data'] and 'headquarters' in company['coresignal_data']['company_details']:
            hq_location = company['coresignal_data']['company_details']['headquarters']

        # Website
        website = ""
        if 'coresignal_data' in company and 'company_details' in company['coresignal_data'] and 'website' in company['coresignal_data']['company_details']:
            website = company['coresignal_data']['company_details']['website']

        # Company Size (use size_range in Supabase)
        size_range = ""
        if 'coresignal_data' in company and 'company_details' in company['coresignal_data'] and 'size' in company['coresignal_data']['company_details']:
            size_range = company['coresignal_data']['company_details']['size']

        # Logo
        logo_url = company.get('logo', '')

        # Collect all details for the partner
        details = {
            "leadership": key_leadership,
            "products": key_products,
            "opportunities": partnership_opportunities,
            "market_analysis": market_analysis,
            "partnership_potential": partnership_potential,
            "hq_location": hq_location,
            "website": website,
            "size_range": size_range,
            "logo": logo_url
        }

        # Try the simple direct REST API approach first
        try:
            # Import the simple direct insert function
            from simple_db_insert import insert_partner_simple

            # Try to insert/update the partner using the simple approach
            success = insert_partner_simple(name, score, industry, description, details)

            if success:
                print(f"Successfully saved partner {name} using simple direct REST API")
                return True
            else:
                print(f"Simple direct REST API approach failed for {name}, trying fallback methods")
        except ImportError:
            print("Could not import simple_db_insert module, trying fallback methods")
        except Exception as e:
            print(f"Error using simple direct REST API: {e}")

        # If the simple approach failed, try the Supabase client directly
        try:
            # Prepare the record for upsert
            partner_record = {
                "name": name,
                "score": score,
                "industry": industry,
                "description": description,
                "leadership": key_leadership,
                "products": key_products,
                "opportunities": partnership_opportunities,
                "market_analysis": market_analysis,
                "partnership_potential": partnership_potential,
                "hq_location": hq_location,
                "website": website,
                "size_range": size_range,
                "logo": logo_url
            }

            # Try a direct upsert first
            try:
                # Use upsert with on_conflict parameter
                response = supabase.table('potential_partners').upsert(
                    partner_record,
                    on_conflict='name'
                ).execute()
                print(f"Successfully upserted partner {name} using Supabase client")
                return True
            except Exception as upsert_error:
                print(f"Upsert failed: {upsert_error}, trying insert/update approach")

                # Try insert/update approach
                try:
                    # Check if the partner already exists
                    existing = supabase.table('potential_partners').select('id').eq('name', name).execute()

                    if existing.data and len(existing.data) > 0:
                        # Update existing partner
                        supabase.table('potential_partners').update(partner_record).eq('name', name).execute()
                        print(f"Updated existing partner {name} using Supabase client")
                        return True
                    else:
                        # Insert new partner
                        supabase.table('potential_partners').insert(partner_record).execute()
                        print(f"Inserted new partner {name} using Supabase client")
                        return True
                except Exception as insert_update_error:
                    print(f"Insert/update approach failed: {insert_update_error}")

                    # Try with simplified record as last resort
                    try:
                        simplified_record = {
                            "name": name,
                            "score": score,
                            "industry": industry,
                            "description": description
                        }
                        supabase.table('potential_partners').insert(simplified_record).execute()
                        print(f"Inserted simplified partner record for {name}")
                        return True
                    except Exception as simplified_error:
                        print(f"All Supabase client approaches failed: {simplified_error}")
        except Exception as e:
            print(f"Error in Supabase client fallback: {e}")

        # If we got here, all approaches failed
        print(f"Failed to save partner {name} after trying all approaches")
        return False

    except Exception as e:
        print(f"Error saving potential partner to Supabase: {e}")
        traceback.print_exc() # Print stack trace for debugging
        return False

# Function to get potential partners from database
def get_potential_partners():
    """Get all potential partners from Supabase, sorted by score (highest first)"""
    if not supabase:
        print("Error: Supabase client not available.")
        return []
    try:
        # Select all relevant columns, including the newly added ones
        response = supabase.table('potential_partners').select(
            'id, name, score, industry, description, leadership, products, opportunities, market_analysis, partnership_potential, hq_location, website, size_range, logo, created_at, updated_at'
        ).order('score', desc=True).execute()

        if response.data:
            # Supabase client automatically parses JSONB fields
            # Map Supabase columns back to expected keys if needed by frontend/other logic
            partners = []
            for row in response.data:
                 partner_data = {
                     'id': row.get('id'),
                     'name': row.get('name'),
                     'score': row.get('score'),
                     'industry': row.get('industry'),
                     'description': row.get('description'),
                     'leadership': row.get('leadership', []), # Default to empty list
                     'products': row.get('products', []), # Default to empty list
                     'opportunities': row.get('opportunities', []), # Default to empty list
                     'market_analysis': row.get('market_analysis', {}), # Default to empty dict
                     'partnership_potential': row.get('partnership_potential', {}), # Default to empty dict
                     'headquarters': row.get('hq_location'), # Map back
                     'website': row.get('website'),
                     'company_size': row.get('size_range'), # Map back
                     'logo_url': row.get('logo'), # Map back
                     'created_at': row.get('created_at'),
                     'last_updated': row.get('updated_at') # Map back
                 }
                 partners.append(partner_data)
            return partners
        else:
            return []
    except Exception as e:
        print(f"Error getting potential partners from Supabase: {e}")
        traceback.print_exc() # Print stack trace for debugging
        return []

# Function to get search history from database
def get_search_history_from_db():
    """Retrieve search history from the database (Supabase)"""
    if not supabase:
        print("Error: Supabase client not available.")
        return []
    try:
        response = supabase.table('search_history').select(
            'timestamp, search_type, query, results_count'
        ).order('timestamp', desc=True).limit(50).execute()

        history = []
        for row in response.data:
            history.append({
                "timestamp": row.get('timestamp'),
                "type": row.get('search_type'),
                "query": row.get('query'),
                "results_count": row.get('results_count')
            })

        return history
    except Exception as e:
        print(f"Error retrieving search history from Supabase: {str(e)}")
        traceback.print_exc() # Print stack trace for debugging
        return []

# Function to get previously considered companies from database
def get_previously_considered_from_db():
    """Retrieve previously considered companies from the database (Supabase)"""
    if not supabase:
        print("Error: Supabase client not available.")
        return []
    try:
        response = supabase.table('previously_considered').select(
            'company_name'
        ).execute()

        companies = [row.get('company_name') for row in response.data if row.get('company_name')]

        return companies
    except Exception as e:
        print(f"Error retrieving previously considered companies from Supabase: {str(e)}")
        traceback.print_exc() # Print stack trace for debugging
        return []

# Function to clear history
def clear_history_from_db():
    """Clear all history from database (Supabase)"""
    if not supabase:
        print("Error: Supabase client not available.")
        return False
    try:
        # Delete all records from search_history table
        supabase.table('search_history').delete().execute()

        # Delete all records from previously_considered table
        supabase.table('previously_considered').delete().execute()

        # Also clear in-memory cache
        global search_history
        global previously_considered_companies

        search_history = []
        previously_considered_companies = set()

        return True
    except Exception as e:
        print(f"Error clearing history from Supabase: {str(e)}")
        traceback.print_exc() # Print stack trace for debugging
        return False

# Load previously considered companies on startup
def load_previously_considered():
    """Load previously considered companies from the database (Supabase)"""
    global previously_considered_companies

    # Initialize if not already initialized
    if 'previously_considered_companies' not in globals() or previously_considered_companies is None:
        previously_considered_companies = set()

    if not supabase:
        print("Error: Supabase client not available.")
        previously_considered_companies = set()
        return

    try:
        response = supabase.table('previously_considered').select('company_name').execute()

        if response.data:
            previously_considered_companies = set([row.get('company_name') for row in response.data if row.get('company_name')])
            print(f"Loaded {len(previously_considered_companies)} previously considered companies from Supabase")
        else:
            previously_considered_companies = set()
            print("No previously considered companies found in Supabase")

    except Exception as e:
        print(f"Error loading previously considered companies from Supabase: {str(e)}")
        traceback.print_exc() # Print stack trace for debugging
        previously_considered_companies = set()

# Function to load search history
def load_search_history():
    """Load search history from the database into memory"""
    global search_history
    search_history = get_search_history_from_db()
    print(f"Loaded {len(search_history)} recent searches from database")

# Load recent search history for current session
search_history = get_search_history_from_db()
print(f"Loaded {len(search_history)} recent searches from database")

# Global variable to track search progress and previously considered companies
search_status = {
    "status": "idle",
    "message": "Ready to search",
    "progress": 0,
    "results": None,
    "error": None
}

# Initialize OpenAI client with proper error handling and configuration
try:
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OpenAI API key not found in environment variables")

    # Import httpx for custom client
    import httpx

    # Create custom HTTP client without proxy settings
    http_client = httpx.Client(
        timeout=60.0,
        limits=httpx.Limits(max_connections=100, max_keepalive_connections=20)
    )

    # Initialize OpenAI with custom client
    openai = OpenAI(
        api_key=api_key,
        http_client=http_client
    )
    print("OpenAI client initialized successfully with API key:", api_key[:10] + "..." + api_key[-5:])
except Exception as e:
    print(f"Error initializing OpenAI client: {str(e)}")
    openai = None

# Exa API key
EXA_API_KEY = os.getenv('EXA_API_KEY')

# Coresignal API credentials
CORESIGNAL_API_KEY = os.getenv('CORESIGNAL_API_KEY')
CORESIGNAL_BASE_URL = "https://api.coresignal.com/cdapi/v1"

# List of current partners
CURRENT_PARTNERS = [
    {"name": "MLSE", "category": "Sports and Entertainment", "description": "Maple Leaf Sports & Entertainment - Owner and operator of sports teams and venues", "inclusions": ["Sports teams", "Entertainment venues", "Sports management"], "exclusions": ["Competing sports organizations"]},
    {"name": "MLSE Digital Labs", "category": "Technology and Digital Innovation", "description": "Digital innovation arm of MLSE focused on technology solutions for sports and entertainment", "inclusions": ["Sports technology", "Digital innovation", "Fan experience technology"], "exclusions": ["Competing digital sports platforms"]},
    {"name": "Rogers", "category": "Telecommunications and Media", "description": "Telecommunications, internet, and media company", "inclusions": ["Telecommunications", "Media broadcasting", "Internet services"], "exclusions": ["Competing telecom providers"]},
    {"name": "A&W", "category": "QSR Burger", "description": "Quick service hamburgers", "inclusions": ["Hamburgers", "Fast food"], "exclusions": ["Other QSR burger chains"]},
    {"name": "Adidas", "category": "Athletic apparel and athletic footwear", "description": "Manufacturing of athletic apparel and athletic footwear products", "inclusions": ["Athletic apparel", "Athletic footwear", "Sports equipment"], "exclusions": ["Nike", "Under Armour", "Other major athletic apparel brands"]},
    {"name": "Air Canada", "category": "Commercial air carrier and vacation tour company services", "description": "Commercial air carrier and vacation tour company services", "inclusions": ["Air travel", "Vacation packages"], "exclusions": ["Other airlines", "Other travel booking services"]},
    {"name": "Amazon Web Services (AWS)", "category": "Enterprise level cloud infrastructure services", "description": "Enterprise level cloud infrastructure services and enterprise cognitive intelligence/enterprise artificial intelligence platforms", "inclusions": ["Cloud services", "AI platforms"], "exclusions": ["Microsoft Azure", "Google Cloud", "Other cloud providers"]},
    {"name": "AMJ Campbell Inc", "category": "Commercial and residential moving services", "description": "Business of providing commercial and residential moving services", "inclusions": ["Moving services", "Storage solutions"], "exclusions": ["Other moving companies"]},
    {"name": "Audible", "category": "Audiobook Streaming Platform", "description": "Audiobook streaming services", "inclusions": ["Audiobooks", "Audio content"], "exclusions": ["Other audiobook platforms"]},
    {"name": "Avis", "category": "Vehicle rental", "description": "Automobile and truck rentals and vehicle sharing services", "inclusions": ["Car rentals", "Truck rentals"], "exclusions": ["Other car rental companies"]},
    {"name": "Bochner Eye Institute", "category": "Laser eye correction and repair", "description": "Laser eye correction and repair services", "inclusions": ["Eye surgery", "Vision correction"], "exclusions": ["Other eye surgery centers"]},
    {"name": "BodyArmor", "category": "Sports Drinks", "description": "Sports drinks primarily intended for sports hydration and fitness", "inclusions": ["Sports hydration beverages"], "exclusions": ["Energy drinks", "Gatorade"]},
    {"name": "Canada Goose", "category": "Cold weather luxury outerwear", "description": "Manufacturing of cold weather luxury jackets and pants", "inclusions": ["Luxury winter jackets", "Cold weather apparel"], "exclusions": ["Other luxury outerwear brands"]},
    {"name": "Canadian Rack", "category": "Warehouse storage solutions", "description": "Warehouse storage solutions and warehouse equipment sales", "inclusions": ["Warehouse equipment", "Storage solutions"], "exclusions": ["Other warehouse equipment providers"]},
    {"name": "Canadian Tire Corp.", "category": "Retail", "description": "Home improvement, house and home, tire, seasonal, sporting and outdoor goods, automotive accessories, and party retail categories", "inclusions": ["Home improvement", "Automotive", "Sporting goods"], "exclusions": ["Other major retail chains"]},
    {"name": "Castrol Canada", "category": "Motor oil and automotive products", "description": "Manufacture of motor oil, automotive degreaser, cleaners and automotive oil filters", "inclusions": ["Motor oil", "Automotive fluids"], "exclusions": ["Other automotive oil brands"]},
    {"name": "CDW Canada", "category": "IT products and services", "description": "Business to business resale of third party IT products and services", "inclusions": ["IT services", "Technology reselling"], "exclusions": ["Other IT service providers"]},
    {"name": "Chewy", "category": "Online Retail of Pet Supplies", "description": "Online retail of pet supplies", "inclusions": ["Pet food", "Pet supplies", "Online pet retail"], "exclusions": ["Other pet supply retailers"]},
    {"name": "Chungchun", "category": "QSR rice hotdogs", "description": "Deep-fried quick serve restaurant hot dog rolled in a sticky rice flour batter", "inclusions": ["Rice hotdogs", "Korean-style hotdogs"], "exclusions": ["Other hotdog vendors"]},
    {"name": "Citizen", "category": "Watches and timepieces", "description": "Watches, clocks and time pieces", "inclusions": ["Watches", "Timepieces"], "exclusions": ["Other watch brands"]},
    {"name": "Coca-Cola Refreshments", "category": "Non-alcoholic beverages", "description": "Carbonated and non-carbonated soft drinks, waters, cold tea, vegetable fruit drinks, fruit drinks and juices", "inclusions": ["Soft drinks", "Juices", "Water"], "exclusions": ["Pepsi products", "Other competing beverage brands"]},
    {"name": "Dairy Farmers of Ontario", "category": "Dairy-based products", "description": "Milk, flavoured milk, butter, snack cheese and cheese", "inclusions": ["Milk", "Cheese", "Dairy products"], "exclusions": ["Non-Ontario dairy producers"]},
    {"name": "Dandurand Wines", "category": "Wine", "description": "Wine products", "inclusions": ["Wine", "Wine products"], "exclusions": ["Other wine distributors"]},
    {"name": "Diageo Canada", "category": "Spirits", "description": "Spirit-based coolers, ready-to-drink spirit based cocktails", "inclusions": ["Spirits", "RTD cocktails"], "exclusions": ["Other spirit brands"]},
    {"name": "e.l.f", "category": "Non-premium cosmetics", "description": "Manufacturing of non-premium cosmetics", "inclusions": ["Affordable cosmetics", "Makeup"], "exclusions": ["Premium cosmetics brands"]},
    {"name": "Enercare", "category": "Home equipment services", "description": "Selling, renting, installing, maintaining and/or servicing of water heaters, HVAC equipment, water treatment products, standby generators, EV chargers, and energy solutions", "inclusions": ["HVAC", "Water heaters", "Home energy"], "exclusions": ["Other home service providers"]},
    {"name": "Entripy", "category": "Promotional merchandise", "description": "Customization of promotional merchandise with third party logos and branding", "inclusions": ["Promotional items", "Custom branded merchandise"], "exclusions": ["Other promotional merchandise companies"]},
    {"name": "ESSO (Imperial Oil)", "category": "Petroleum", "description": "Gasoline products", "inclusions": ["Gasoline", "Fuel products"], "exclusions": ["Other gas station brands"]},
    {"name": "Fallsview", "category": "Land-based casinos", "description": "Land based casinos, racetracks with slot machines, and bingo parlours in Ontario", "inclusions": ["Casino gaming", "In-person gambling"], "exclusions": ["Online gambling", "Other casino operators"]},
    {"name": "FedEx", "category": "Delivery services", "description": "Provision of express, ground and freight delivery services", "inclusions": ["Package delivery", "Shipping services"], "exclusions": ["UPS", "Other shipping companies"]},
    {"name": "Firehouse Subs", "category": "Submarine sandwiches", "description": "Submarine sandwich restaurant", "inclusions": ["Submarine sandwiches", "Hot subs"], "exclusions": ["Other sandwich chains"]},
    {"name": "Flutter (PokerStars/FanDuel)", "category": "Online gaming", "description": "Daily Fantasy Sports Contests, Online Sports Betting, Online Casinos, and Free to Play games", "inclusions": ["Online betting", "Fantasy sports"], "exclusions": ["Other online betting platforms"]},
    {"name": "Ford Motor Company of Canada", "category": "Automobiles and trucks", "description": "Manufacture, sale and leasing of automobiles and trucks, both new and used, and automotive service centers", "inclusions": ["Ford vehicles", "Lincoln vehicles"], "exclusions": ["Other automotive manufacturers"]},
    {"name": "Freed", "category": "Residential property development", "description": "Residential property development (houses and condominiums) including Ontario-based ski resorts and golf courses", "inclusions": ["Residential development", "Condominiums"], "exclusions": ["Other property developers"]},
    {"name": "French's", "category": "Ketchup and mustard", "description": "Sale, marketing and manufacturing of ketchup and mustard", "inclusions": ["Ketchup", "Mustard"], "exclusions": ["Other condiment brands"]},
    {"name": "Frito-Lay", "category": "Chips", "description": "Packaged snacks including pretzels, potato chips, tortilla chips, cheese snacks, corn chips", "inclusions": ["Potato chips", "Corn chips", "Packaged snacks"], "exclusions": ["Other chip brands"]},
    {"name": "Gatorade", "category": "Sports Drink and Nutrition", "description": "Sports drinks, sports beverages, isotonics, electrolyte and fluid replacement beverages, and sports nutrition products", "inclusions": ["Sports drinks", "Electrolyte beverages"], "exclusions": ["BodyArmor", "Other sports drink brands"]},
    {"name": "GFL", "category": "Waste management", "description": "Recycling, waste removal and construction infrastructure services", "inclusions": ["Waste management", "Recycling services"], "exclusions": ["Other waste management companies"]},
    {"name": "GoodLife Fitness", "category": "Fitness facility", "description": "Member-based brick and mortar fitness facility", "inclusions": ["Gym memberships", "Fitness centers"], "exclusions": ["Other gym chains"]},
    {"name": "Google", "category": "Consumer electronics", "description": "Manufacturing and wholesaling of connected home devices, laptop computers, tablet computers, speakers, mobile phones and accessories, and headphones", "inclusions": ["Google devices", "Pixel phones", "Nest products"], "exclusions": ["Apple", "Samsung", "Other tech hardware manufacturers"]},
    {"name": "Hudson's Bay Company", "category": "Premium fashion apparel", "description": "Retailing of premium fashion apparel, casual wear, street wear, denim fashion and dress wear", "inclusions": ["Department store", "Fashion retail"], "exclusions": ["Other department stores"]},
    {"name": "IBM Canada", "category": "Professional services", "description": "Professional Cybersecurity Services and Technology Consulting Services", "inclusions": ["IT consulting", "Cybersecurity"], "exclusions": ["Other IT consulting firms"]},
    {"name": "Jackpot City", "category": "Online Casino Games", "description": "Online casino gaming services", "inclusions": ["Online casino games", "Virtual gambling"], "exclusions": ["Other online casinos"]},
    {"name": "King's Hawaiian", "category": "Baked bread products", "description": "Manufacturing of baked bread products including sliced bread, buns, sweet breads and rolls", "inclusions": ["Sweet rolls", "Hawaiian bread"], "exclusions": ["Other bread manufacturers"]},
    {"name": "Kruger", "category": "Tissue paper", "description": "Manufacturing of tissue paper products including bathroom tissue, facial tissue, paper towels, paper napkins, wet wipes", "inclusions": ["Tissue products", "Paper towels"], "exclusions": ["Other tissue paper manufacturers"]},
    {"name": "Leon's", "category": "Indoor Furniture Retailer", "description": "Retail sale of indoor household furniture", "inclusions": ["Furniture retail", "Home furnishings"], "exclusions": ["Other furniture retailers"]},
    {"name": "LG", "category": "Home electronics and appliances", "description": "Manufacture of home electronics products, major home appliances, air conditioning appliances, digital signage, and computer monitors", "inclusions": ["TVs", "Appliances", "Electronics"], "exclusions": ["Samsung", "Other electronics manufacturers"]},
    {"name": "Maple Leaf Foods", "category": "Meat and plant-based protein products", "description": "Manufacture of meat-based products and plant-based protein products", "inclusions": ["Meat products", "Plant-based proteins"], "exclusions": ["Other meat product manufacturers"]},
    {"name": "Marriott International", "category": "Hotels and Resorts", "description": "Hotels, resorts, and hotel rewards programs", "inclusions": ["Hotel accommodations", "Rewards programs"], "exclusions": ["Other hotel chains"]},
    {"name": "Mastercard", "category": "Payment systems", "description": "Payment system services including credit card, charge card, electronic payment, stored value and pre-paid card systems", "inclusions": ["Credit cards", "Payment processing"], "exclusions": ["Visa", "American Express", "Other payment processors"]},
    {"name": "MNP", "category": "Accounting services", "description": "Chartered accountant services, including tax services", "inclusions": ["Accounting", "Tax services"], "exclusions": ["Other accounting firms"]},
    {"name": "Molson Coors", "category": "Brewing industry", "description": "Beer, malt based coolers, other brewed malt beverages and ciders", "inclusions": ["Beer", "Cider", "Malt beverages"], "exclusions": ["Other beer manufacturers"]},
    {"name": "Mondelez", "category": "Packaged snacks", "description": "Manufacturing of pre-packaged chocolate, candy, cookies and crackers", "inclusions": ["Cookies", "Chocolate", "Candy"], "exclusions": ["Other snack manufacturers"]},
    {"name": "Nestle", "category": "Ice cream", "description": "Manufacture and retail sale of ice cream products", "inclusions": ["Ice cream", "Frozen desserts"], "exclusions": ["Other ice cream manufacturers"]},
    {"name": "OLG", "category": "Lottery and gaming", "description": "Lottery and gaming products including LottoMax, Lotto 649, Pro-Line, instant tickets", "inclusions": ["Lottery", "Gaming products"], "exclusions": ["Other lottery operators"]},
    {"name": "Ozempic (Novo Nordisk)", "category": "Diabetes Medication", "description": "Diabetes medication products", "inclusions": ["Diabetes medication", "GLP-1 medications"], "exclusions": ["Other diabetes drug manufacturers"]},
    {"name": "Peoples", "category": "Jewelry retail", "description": "Retailing of jewelry, including watches", "inclusions": ["Jewelry", "Watches"], "exclusions": ["Other jewelry retailers"]},
    {"name": "Pizza Pizza", "category": "Quick service pizza", "description": "Quick service pizza, panzerottis and calzones", "inclusions": ["Pizza", "Italian fast food"], "exclusions": ["Other pizza chains"]},
    {"name": "Playstation", "category": "Video game consoles", "description": "Home-based video game consoles and hand-held video game devices", "inclusions": ["Gaming consoles", "Video games"], "exclusions": ["Xbox", "Nintendo", "Other gaming platforms"]},
    {"name": "PointsBet", "category": "Sports betting", "description": "Online sports betting services", "inclusions": ["Sports betting", "Wagering"], "exclusions": ["Other sports betting platforms"]},
    {"name": "Popeyes", "category": "Quick service chicken", "description": "Quick service chicken food products including chicken tenders, fried chicken, chicken sandwiches, and chicken wings", "inclusions": ["Fried chicken", "Chicken sandwiches"], "exclusions": ["Other chicken fast food chains"]},
    {"name": "Red Tag", "category": "Travel services", "description": "Travel services including transportation, accommodation, and event attraction tickets", "inclusions": ["Travel booking", "Vacation packages"], "exclusions": ["Other travel agencies"]},
    {"name": "Redbull", "category": "Energy drinks", "description": "Energy drinks marketed to improve personal energy", "inclusions": ["Energy drinks"], "exclusions": ["Other energy drink brands"]},
    {"name": "Rogers", "category": "Telecommunications", "description": "Telecommunications services including cellular, telephone, television, internet/data, and streaming services", "inclusions": ["Mobile service", "Internet", "TV services"], "exclusions": ["Bell", "Telus", "Other telecom providers"]},
    {"name": "Salesforce", "category": "Customer relationship management", "description": "Customer relationship management services and enterprise applications for sales, service, marketing, commerce, and IT teams", "inclusions": ["CRM software", "Enterprise applications"], "exclusions": ["Other CRM providers"]},
    {"name": "Scotiabank", "category": "Banking and financial services", "description": "Retail banking services, financial products, and investment services with arena naming rights", "inclusions": ["Banking", "Financial services", "Naming rights"], "exclusions": ["Other banks", "Financial institutions"]},
    {"name": "Securian Canada", "category": "Life insurance", "description": "Life insurance products", "inclusions": ["Life insurance", "Insurance products"], "exclusions": ["Other insurance providers"]},
    {"name": "Shiseido", "category": "Premium cosmetics", "description": "Manufacturing of women's premium make-up and premium skincare products", "inclusions": ["Premium cosmetics", "Skincare"], "exclusions": ["Other premium cosmetic brands"]},
    {"name": "Sobeys", "category": "Grocery retail", "description": "Retail supermarket and grocery stores, online grocery stores, and meal kit delivery services", "inclusions": ["Grocery stores", "Supermarkets"], "exclusions": ["Other grocery chains"]},
    {"name": "SpotHero", "category": "Parking services", "description": "Online parking reservation platform", "inclusions": ["Parking reservations", "Parking services"], "exclusions": ["Other parking service providers"]},
    {"name": "Stella Artois", "category": "Beer", "description": "Premium beer products", "inclusions": ["Premium beer", "Belgian beer"], "exclusions": ["Other beer brands"]},
    {"name": "Sun Life", "category": "Insurance and financial services", "description": "Insurance, wealth, and asset management solutions", "inclusions": ["Insurance", "Financial planning"], "exclusions": ["Other insurance and financial service companies"]},
    {"name": "Tangerine", "category": "Digital banking", "description": "Digital banking services", "inclusions": ["Online banking", "Digital financial services"], "exclusions": ["Traditional banks", "Other digital banks"]},
    {"name": "TD Bank", "category": "Financial services", "description": "Banking, investment, and financial services", "inclusions": ["Banking", "Investments", "Financial services"], "exclusions": ["Other banks", "Financial institutions"]},
    {"name": "The Bay", "category": "Department store", "description": "Retail department store selling clothing, home goods, and accessories", "inclusions": ["Department store retail", "Home goods"], "exclusions": ["Other department stores"]},
    {"name": "The Brick", "category": "Furniture and appliance retail", "description": "Retail of furniture, mattresses, appliances, and electronics", "inclusions": ["Furniture", "Appliances", "Electronics retail"], "exclusions": ["Other furniture and appliance retailers"]},
    {"name": "TikTok", "category": "Social media", "description": "Short-form video hosting service and social media platform", "inclusions": ["Short-form video", "Social media platform"], "exclusions": ["Other social media platforms"]},
    {"name": "Tim Hortons", "category": "Coffee and baked goods", "description": "Quick service restaurant specializing in coffee, donuts, and other baked goods", "inclusions": ["Coffee", "Donuts", "Baked goods"], "exclusions": ["Other coffee chains"]},
    {"name": "Toshiba", "category": "Business solutions", "description": "Digital business technology solutions", "inclusions": ["Business technology", "Digital solutions"], "exclusions": ["Other business technology providers"]},
    {"name": "Uber Eats", "category": "Food delivery", "description": "Online food ordering and delivery platform", "inclusions": ["Food delivery", "Restaurant delivery"], "exclusions": ["Other food delivery services"]},
    {"name": "Unico", "category": "Mediterranean food products", "description": "Manufacture of packaged mediterranean food products including pasta, oils, canned goods", "inclusions": ["Mediterranean foods", "Italian foods", "Canned goods"], "exclusions": ["Other Mediterranean food brands"]},
    {"name": "Unilever", "category": "Mayonnaise and salad dressing", "description": "Manufacture of mayonnaise and salad dressing products", "inclusions": ["Mayonnaise", "Salad dressing"], "exclusions": ["Other condiment manufacturers"]},
    {"name": "Wegovy (Novo Nordisk)", "category": "Weight loss medication", "description": "Weight loss medication products", "inclusions": ["Weight loss medication", "GLP-1 medications"], "exclusions": ["Other weight loss drug manufacturers"]},
    {"name": "Yeti", "category": "Portable coolers and drinkware", "description": "Manufacturing of portable coolers and non-disposable drinkware including bottles, tumblers, mugs, and wine glasses", "inclusions": ["Coolers", "Insulated drinkware"], "exclusions": ["Other premium drinkware brands"]},
    {"name": "Access Storage", "category": "Self-storage and moving", "description": "Self-storage and moving services, portable storage, small business storage, and document storage and management", "inclusions": ["Storage services", "Moving services"], "exclusions": ["N/A"]},
    {"name": "ADP", "category": "Payroll processing services", "description": "Provision of payroll processing services and employee time management tracking services", "inclusions": ["Payroll services", "Time tracking"], "exclusions": ["N/A"]},
    {"name": "Arrow Workforce", "category": "Temporary staffing services", "description": "Provision of temporary staffing services", "inclusions": ["Temporary staffing"], "exclusions": ["Online job platforms and websites, permanent staffing recruitment"]},
    {"name": "Bell Canada", "category": "Telecommunication", "description": "Telecommunications services", "inclusions": ["Telecom services"], "exclusions": ["N/A"]},
    {"name": "Canada Dry Mott's Inc", "category": "Tomato clam cocktail beverages", "description": "Tomato clam cocktail beverage products and ready-to-drink Caesar cocktails", "inclusions": ["Clam cocktail beverages", "Caesar cocktails"], "exclusions": ["Fruit juices, soft drinks, energy drinks"]},
    {"name": "Canon Canada", "category": "Business print services", "description": "Suppliers of business print services and equipment, related software and services", "inclusions": ["Office print devices", "Print services"], "exclusions": ["N/A"]},
    {"name": "CarStar", "category": "Automobile collision and repair", "description": "Automobile collision and repair services", "inclusions": ["Collision repair", "Auto repair"], "exclusions": ["N/A"]},
    {"name": "Fitzrovia", "category": "Residential properties", "description": "Built long-term residential properties", "inclusions": ["Residential properties"], "exclusions": ["Short-term accommodations, commercial real estate, real estate brokerages"]},
    {"name": "George Brown", "category": "Canadian colleges", "description": "Accredited vocation schools and educational institutions", "inclusions": ["College education", "Vocational training"], "exclusions": ["Universities, trade schools outside Canada"]},
    {"name": "Gillette", "category": "Shave Care", "description": "Facial grooming products including shave preparation, razors, beard care, and facial trimmers", "inclusions": ["Grooming products", "Razors"], "exclusions": ["Shaving creams and lotions"]},
    {"name": "Kilani Jewellery", "category": "Jewelry", "description": "Retailing and manufacturing of jewellery", "inclusions": ["Jewelry retail", "Jewelry manufacturing"], "exclusions": ["N/A"]},
    {"name": "McDonald's", "category": "Quick service restaurant", "description": "Quick service restaurant beef food products, chicken food products and French fries", "inclusions": ["Fast food", "QSR"], "exclusions": ["Breakfast food items, beverage products, wraps, pizza"]},
    {"name": "Prime Hydration", "category": "Sports drinks", "description": "All forms of sports drinks, isotonic or electrolyte beverages", "inclusions": ["Sports drinks", "Electrolyte beverages"], "exclusions": ["Soft drinks, water, tea, coffee, energy drinks"]},
    {"name": "Sam McDadi Real Estate", "category": "Real estate", "description": "Purpose-built long-term residential rental properties", "inclusions": ["Real estate services"], "exclusions": ["Short-term accommodations, real estate developments"]},
    {"name": "SiriusXM", "category": "Audio music streaming", "description": "Audio music streaming services", "inclusions": ["Music streaming", "Podcast streaming"], "exclusions": ["Terrestrial radio stations, cable television providers"]},
    {"name": "StorageMart", "category": "Self-Storage", "description": "Self-Storage Provider", "inclusions": ["Storage units", "Self storage"], "exclusions": ["N/A"]},
    {"name": "Subway", "category": "QSR Submarine Sandwich", "description": "QSR Submarine Sandwich, Bowls and Wraps", "inclusions": ["Submarine sandwiches", "Bowls", "Wraps"], "exclusions": ["N/A"]},
    {"name": "Sysco", "category": "Food distribution", "description": "Distribution services to restaurants, healthcare and educational facilities of food products", "inclusions": ["Food distribution", "Restaurant supplies"], "exclusions": ["N/A"]},
    {"name": "The Keg", "category": "Casual fine dining", "description": "Operation of a casual fine dining and/or restaurant establishment", "inclusions": ["Restaurant", "Fine dining"], "exclusions": ["Non-Coca-Cola beverage or non-Molson malt beverage manufacturers"]},
    {"name": "Tissot", "category": "Watches", "description": "Watches, clocks, countdown clocks, jewelry pieces with a time piece included", "inclusions": ["Watches", "Timepieces"], "exclusions": ["Devices with timekeeping as an ancillary function"]},
    {"name": "Toronto Star", "category": "Daily Newspaper", "description": "Daily Print and Online Newspaper", "inclusions": ["News publication", "Online news"], "exclusions": ["N/A"]},
    {"name": "Turbo Tax", "category": "Tax software", "description": "Manufacturing and retailing of personal and business tax software", "inclusions": ["Tax software", "Tax preparation"], "exclusions": ["N/A"]},
    {"name": "Unilever Men's Grooming", "category": "Men's Grooming Products", "description": "Deodorant, antiperspirants, body sprays, soaps, body washes, hair products, and face wash", "inclusions": ["Men's grooming", "Personal care"], "exclusions": ["N/A"]},
    {"name": "Nike", "category": "Athletic apparel and footwear", "description": "Manufacturing of athletic apparel, athletic footwear, and sports equipment", "inclusions": ["Athletic apparel", "Athletic footwear", "Sports equipment"], "exclusions": ["Adidas", "Under Armour", "Other athletic apparel brands"]},
    {"name": "Apple", "category": "Consumer electronics", "description": "Manufacturing of smartphones, computers, tablets, wearables, and accessories", "inclusions": ["iPhones", "MacBooks", "iPads", "Apple Watch"], "exclusions": ["Google", "Samsung", "Other tech hardware manufacturers"]},
    {"name": "Tesla", "category": "Electric vehicles", "description": "Manufacturing of electric vehicles, energy storage systems, and solar products", "inclusions": ["Electric cars", "Energy solutions"], "exclusions": ["Traditional automotive manufacturers"]},
    {"name": "Starbucks", "category": "Coffee and beverages", "description": "Specialty coffee, tea, and food items in cafe setting", "inclusions": ["Coffee", "Tea", "Food items"], "exclusions": ["Tim Hortons", "Other coffee chains"]},
    {"name": "Microsoft", "category": "Technology", "description": "Software, cloud services, and hardware for consumers and businesses", "inclusions": ["Windows", "Office", "Azure", "Surface devices"], "exclusions": ["Other tech companies"]},
    {"name": "Netflix", "category": "Streaming entertainment", "description": "Online streaming platform for movies, TV shows, and original content", "inclusions": ["Video streaming", "Original content"], "exclusions": ["Other streaming services"]},
    {"name": "Lululemon", "category": "Athletic apparel", "description": "Athletic and leisure apparel and accessories", "inclusions": ["Yoga wear", "Athletic clothing"], "exclusions": ["Other athletic apparel brands"]},
    {"name": "Samsung", "category": "Consumer electronics", "description": "Manufacturing of smartphones, TVs, appliances, and other electronics", "inclusions": ["Galaxy phones", "TVs", "Home appliances"], "exclusions": ["Apple", "LG", "Other electronics manufacturers"]},
    {"name": "Whole Foods", "category": "Grocery retail", "description": "Premium grocery store focusing on organic and natural products", "inclusions": ["Organic groceries", "Premium food"], "exclusions": ["Other grocery chains"]},
    {"name": "Home Depot", "category": "Home improvement retail", "description": "Retail of home improvement supplies, tools, and building materials", "inclusions": ["Home improvement", "Tools", "Building materials"], "exclusions": ["Other home improvement retailers"]},
    {"name": "Shopify", "category": "E-commerce platform", "description": "E-commerce platform for online stores and retail point-of-sale systems", "inclusions": ["E-commerce software", "Online store solutions"], "exclusions": ["Other e-commerce platforms"]},
    {"name": "Under Armour", "category": "Athletic apparel", "description": "Performance apparel, footwear, and accessories", "inclusions": ["Athletic clothing", "Sports gear"], "exclusions": ["Nike", "Adidas", "Other athletic brands"]},
    {"name": "Spotify", "category": "Music streaming", "description": "Digital music, podcast, and video streaming service", "inclusions": ["Music streaming", "Podcast platform"], "exclusions": ["Other music streaming services"]},
    {"name": "IKEA", "category": "Furniture retail", "description": "Retail of ready-to-assemble furniture, kitchen appliances and home accessories", "inclusions": ["Furniture", "Home decor", "Household items"], "exclusions": ["Other furniture retailers"]},
    {"name": "Costco", "category": "Wholesale retail", "description": "Membership-based wholesale warehouse retail", "inclusions": ["Wholesale retail", "Bulk products"], "exclusions": ["Other warehouse retailers"]},
    {"name": "Uber", "category": "Transportation", "description": "Ridesharing, food delivery, and transportation network services", "inclusions": ["Ridesharing", "Transportation"], "exclusions": ["Other rideshare services"]},
    {"name": "American Express", "category": "Financial services", "description": "Credit card, charge card, and travel-related services", "inclusions": ["Credit cards", "Financial services"], "exclusions": ["Other credit card companies"]},
    {"name": "Disney", "category": "Entertainment", "description": "Media and entertainment company with theme parks, studios, and streaming", "inclusions": ["Entertainment content", "Theme parks"], "exclusions": ["Other entertainment companies"]},
    {"name": "Expedia", "category": "Travel services", "description": "Online travel booking for flights, hotels, cars, cruises, and packages", "inclusions": ["Travel booking", "Vacation planning"], "exclusions": ["Other travel booking platforms"]}
]

# Scoring criteria for partnership evaluation
SCORING_CRITERIA = {
    "location": {
        "name": "Location-Based Presence",
        "max_points": 2,
        "criteria": [
            {"points": 2, "description": "Headquartered in Toronto"},
            {"points": 1.5, "description": "Based in Ontario (outside Toronto)"},
            {"points": 1, "description": "Based in Canada (outside Ontario)"},
            {"points": 0.5, "description": "Based in North America (outside Canada)"},
            {"points": 0.2, "description": "International location"}
        ]
    },
    "employee_size": {
        "name": "Employee Size & Organizational Scale",
        "max_points": 1,
        "criteria": [
            {"points": 0.2, "description": "100+ employees"},
            {"points": 0.5, "description": "500+ employees"},
            {"points": 1, "description": "1,000+ employees"}
        ]
    },
    "revenue": {
        "name": "Annual Revenue",
        "max_points": 1,
        "criteria": [
            {"points": 0.3, "description": "Revenue > $1M/year"},
            {"points": 0.6, "description": "Revenue > $10M/year"},
            {"points": 1, "description": "Revenue > $50M/year"}
        ]
    },
    "funding": {
        "name": "Funding & Capital Activity",
        "max_points": 1,
        "criteria": [
            {"points": 0.3, "description": "Multiple funding rounds (2+)"},
            {"points": 0.6, "description": "5+ funding rounds"},
            {"points": 1, "description": "Total funding exceeds $50M+"}
        ]
    },
    "talent": {
        "name": "Talent Acquisition & Hiring Trends",
        "max_points": 1,
        "criteria": [
            {"points": 0.4, "description": "Actively hiring for Marketing/Brand roles"},
            {"points": 0.3, "description": "3 or more active job listings"},
            {"points": 0.3, "description": "10+ total open positions"}
        ]
    },
    "industry": {
        "name": "Industry Relevance & Vertical Fit",
        "max_points": 1.2,
        "criteria": [
            {"points": 0.4, "description": "Operates in Sports, Entertainment, or Events"},
            {"points": 0.4, "description": "Operates in Hospitality, Food & Beverage"},
            {"points": 0.4, "description": "Operates in Technology, Fintech, or AI"}
        ]
    },
    "brand": {
        "name": "Brand Visibility & Market Influence",
        "max_points": 1.2,
        "criteria": [
            {"points": 0.4, "description": "10,000+ LinkedIn followers"},
            {"points": 0.4, "description": "50,000+ total social media followers"},
            {"points": 0.4, "description": "Featured in prominent media outlets (e.g., Forbes, Bloomberg, TechCrunch)"}
        ]
    },
    "sponsorship": {
        "name": "Sponsorship & Activation History",
        "max_points": 0.8,
        "criteria": [
            {"points": 0.4, "description": "Proven history of sponsorships with sports, venues, or events"},
            {"points": 0.4, "description": "Has an active sponsorship/partnership program"}
        ]
    },
    "b2b": {
        "name": "B2B Synergy & Relationship Fit",
        "max_points": 0.7,
        "criteria": [
            {"points": 0.3, "description": "Existing relationship with Scotiabank Arena tenants (Raptors, Maple Leafs, etc.)"},
            {"points": 0.4, "description": "Past or current collaborations with Scotiabank or affiliated brands"}
        ]
    },
    "csr": {
        "name": "Corporate Social Responsibility & Impact",
        "max_points": 0.7,
        "criteria": [
            {"points": 0.3, "description": "Active in community programs or philanthropic initiatives"},
            {"points": 0.4, "description": "Dedicated CSR program or foundation"}
        ]
    }
}

# Calculate max total score
MAX_TOTAL_SCORE = sum(category["max_points"] for category in SCORING_CRITERIA.values())

# Function to generate a logo using logo.dev API
def generate_logo(company_name):
    try:
        # Clean the company name to create a domain-like string
        # Remove special characters and spaces, convert to lowercase
        domain_name = re.sub(r'[^a-zA-Z0-9]', '', company_name.lower())

        # Add .com to make it look like a domain
        if not domain_name.endswith('.com'):
            domain_name = f"{domain_name}.com"

        # Use logo.dev API to generate a logo
        logo_url = f"https://img.logo.dev/{domain_name}?token=pk_TCK5i8rzR92YmS65BY2fgQ&retina=true"

        return logo_url
    except Exception as e:
        print(f"Error generating logo: {e}")
        # Return a default logo if there's an error
        return "https://img.logo.dev/default.com?token=pk_TCK5i8rzR92YmS65BY2fgQ&retina=true"

# Function to search for companies in an industry
def search_companies_in_industry(industry, api_key):
    try:
        if not industry or not isinstance(industry, str) or not industry.strip():
            print("Error: Invalid industry query")
            return []

        if not api_key or not isinstance(api_key, str) or not api_key.strip():
            print("Error: Invalid API key")
            return []

        print(f"Searching for companies related to: {industry}")

        # Use requests to directly call the Exa API to find companies
        search_url = "https://api.exa.ai/search"
        headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json"
        }

        search_payload = {
            "query": f"top companies in {industry} industry",
            "num_results": 40,  # Increased from 20 to 40
            "use_autoprompt": True
        }

        # Make the search request with timeout
        try:
            print(f"Sending request to Exa API: {search_url}")
            search_response = requests.post(
                search_url,
                headers=headers,
                json=search_payload,
                timeout=15  # Add timeout to prevent request hanging
            )
            print(f"Received response with status code: {search_response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"Request error in search: {str(e)}")
            return []

        if search_response.status_code != 200:
            print(f"Error from Exa API: {search_response.status_code}")
            print(f"Response text: {search_response.text}")
            return []

        try:
            search_data = search_response.json()
        except json.JSONDecodeError as e:
            print(f"Failed to parse search response as JSON: {str(e)}")
            return []

        # Extract and process results
        search_results = []
        results = search_data.get('results', [])

        if not results:
            print("No results found in search response")
            return []

        for result in results:
            try:
                # Get content for each result - using base URL properly
                content_url = "https://api.exa.ai/content" # Updated URL
                content_payload = {
                    "url": result.get('url'),
                    "include_text": True
                }

                try:
                    content_response = requests.post(
                        content_url,
                        headers=headers,
                        json=content_payload,
                        timeout=10  # Add timeout to prevent hanging requests
                    )

                    if content_response.status_code == 200:
                        try:
                            content_data = content_response.json()
                            text_content = content_data.get('text', result.get('snippet', ''))
                        except json.JSONDecodeError:
                            text_content = result.get('snippet', '')
                    else:
                        # Gracefully handle error - just use the snippet instead
                        text_content = result.get('snippet', '')
                        if content_response.status_code != 404:  # Only log non-404 errors
                            print(f"Error fetching content (status {content_response.status_code})")
                except requests.exceptions.RequestException as re:
                    # Handle request exceptions (timeouts, connection errors)
                    text_content = result.get('snippet', '')
                    print(f"Request error fetching content: {str(re)}")

                search_results.append({
                    "title": result.get('title', ''),
                    "url": result.get('url', ''),
                    "text": text_content,
                    "snippet": result.get('snippet', '')
                })

            except Exception as e:
                print(f"Error processing result {result.get('url', 'unknown')}: {str(e)}")
                # Still add the result with whatever data we have
                search_results.append({
                    "title": result.get('title', ''),
                    "url": result.get('url', ''),
                    "text": result.get('snippet', ''),
                    "snippet": result.get('snippet', '')
                })

        print(f"Successfully processed {len(search_results)} search results")
        return search_results
    except Exception as e:
        print(f"Unexpected error in search_companies_in_industry: {str(e)}")
        traceback.print_exc()  # Print full stack trace for debugging
        return []

# Function to extract company names from search results
def extract_company_names(search_results, industry):
    try:
        # Check if search_results is empty or invalid
        if not search_results or not isinstance(search_results, list):
            print("Warning: Empty or invalid search results")
            return []

        # Format the results for OpenAI
        formatted_results = "\n\n".join([
            f"Title: {r.get('title', 'No Title')}\nURL: {r.get('url', 'No URL')}\nContent: {r.get('text', r.get('snippet', 'No Content'))}"
            for r in search_results
        ])

        # Make sure we have some content to analyze
        if not formatted_results.strip():
            print("Warning: No content to analyze in search results")
            return []

        prompt = f"""
        Based on the search results about the {industry} industry, identify the top 40 companies in this industry.
        Return ONLY a JSON array of company names, nothing else.

        SEARCH RESULTS:
        {formatted_results}
        """

        response = openai.chat.completions.create(
            model="gpt-4o",  # Upgraded from gpt-4o-mini to full gpt-4o
            messages=[
                {"role": "system", "content": "You are a professional business analyst specializing in partnership and competitive analysis."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )

        if not response or not response.choices or not response.choices[0].message.content:
            print("Warning: Empty or invalid response from OpenAI")
            return []

        content = response.choices[0].message.content.strip()

        # Make sure content is not empty
        if not content:
            print("Warning: Empty content from OpenAI")
            return []

        try:
            companies_json = json.loads(content)
            if isinstance(companies_json, dict) and "companies" in companies_json:
                return companies_json["companies"] or []
            elif isinstance(companies_json, list):
                return companies_json or []
            else:
                # Try to extract an array from the response
                for key in companies_json:
                    if isinstance(companies_json[key], list):
                        return companies_json[key] or []
                # If all else fails, return an empty list
                return []
        except Exception as e:
            print(f"Error parsing company names: {e}")
            # Try to extract company names using regex as a fallback
            company_pattern = r'"([^"]+)"'
            matches = re.findall(company_pattern, content)
            return matches if matches else []
    except Exception as e:
        print(f"Error extracting company names: {e}")
        return []

# Function to fetch company data from Coresignal
def fetch_coresignal_data(company_name):
    """
    Generate enhanced mock company data with comprehensive leadership, products, and detailed company information
    """
    print(f"Generating comprehensive mock data for {company_name} (Coresignal API unavailable)")

    # Create realistic mock data based on company name
    import random
    from datetime import datetime, timedelta

    # Generate consistent random data based on company name
    # This way the same company will get the same data on multiple calls
    seed = sum(ord(c) for c in company_name)
    random.seed(seed)

    # Generate company founding year (between 1950 and 2020)
    founding_year = random.randint(1950, 2020)

    # Generate company size (employees)
    size_options = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10000+"]
    size_weights = [0.05, 0.1, 0.2, 0.25, 0.2, 0.1, 0.05, 0.05]
    company_size = random.choices(size_options, weights=size_weights)[0]

    # Generate industry
    industries = [
        "Technology", "Finance", "Healthcare", "Education", "Retail",
        "Manufacturing", "Entertainment", "Media", "Food & Beverage",
        "Transportation", "Energy", "Sports", "Gaming", "Hospitality"
    ]
    company_industry = random.choice(industries)

    # Generate location
    locations = [
        "Toronto, Ontario", "Vancouver, BC", "Montreal, Quebec",
        "New York, NY", "San Francisco, CA", "London, UK",
        "Chicago, IL", "Boston, MA", "Austin, TX", "Seattle, WA"
    ]
    company_location = random.choice(locations)

    # Generate headquarters and offices
    headquarters = company_location
    num_offices = random.randint(1, 5)
    offices = [headquarters]
    for _ in range(num_offices - 1):
        new_office = random.choice(locations)
        if new_office not in offices:
            offices.append(new_office)

    # Generate website and social media
    domain_name = company_name.lower().replace(' ', '')
    domains = [".com", ".co", ".io", ".ai", ".net"]
    website = f"https://www.{domain_name}{random.choice(domains)}"

    social_media = {
        "linkedin": f"https://www.linkedin.com/company/{domain_name}",
        "twitter": f"https://twitter.com/{domain_name}",
        "facebook": f"https://www.facebook.com/{domain_name}",
        "instagram": f"https://www.instagram.com/{domain_name}"
    }

    # Generate revenue information
    revenue_ranges = ["Under $1M", "$1M-$5M", "$5M-$10M", "$10M-$50M", "$50M-$100M", "$100M-$500M", "$500M-$1B", "Over $1B"]
    revenue_weights = [0.1, 0.15, 0.2, 0.2, 0.15, 0.1, 0.05, 0.05]
    annual_revenue = random.choices(revenue_ranges, weights=revenue_weights)[0]

    # Generate growth metrics
    growth_rates = [f"{random.randint(-5, 40)}%" for _ in range(3)]

    # Generate funding rounds (0-5 rounds)
    num_funding_rounds = random.randint(0, 5)
    funding_rounds = []
    total_funding = 0

    if num_funding_rounds > 0:
        # Types of funding rounds
        round_types = ["Seed", "Series A", "Series B", "Series C", "Growth Equity", "Private Equity"]

        # Generate random funding rounds
        current_date = datetime.now()

        for i in range(num_funding_rounds):
            round_type = round_types[min(i, len(round_types) - 1)]

            # Each subsequent round is larger
            amount_multiplier = 2 ** i
            amount = random.randint(5, 20) * amount_multiplier * 1000000  # $5M to $20M * multiplier
            total_funding += amount

            # Each round is 1-2 years before the previous
            date = current_date - timedelta(days=random.randint(365, 730))
            current_date = date

            investors = []
            investor_count = random.randint(1, 3)
            investor_options = [
                "Accel", "Sequoia Capital", "Andreessen Horowitz", "Y Combinator",
                "Benchmark", "GV", "Tiger Global", "Founders Fund", "Lightspeed Venture Partners",
                "NEA", "Index Ventures", "Khosla Ventures", "Bessemer Venture Partners"
            ]

            for _ in range(investor_count):
                investor = random.choice(investor_options)
                if investor not in investors:
                    investors.append(investor)

            funding_rounds.append({
                "type": round_type,
                "amount": amount,
                "date": date.strftime("%B %Y"),
                "investors": ", ".join(investors),
                "valuation": amount * random.randint(3, 8) if i > 0 else amount * random.randint(2, 5)
            })

    # Generate company mission and vision
    mission_templates = [
        f"To transform the {company_industry.lower()} industry through innovative solutions.",
        f"Empowering customers to achieve more in {company_industry.lower()}.",
        f"Creating sustainable {company_industry.lower()} solutions for a better future.",
        f"Revolutionizing how people interact with {company_industry.lower()} products.",
        f"Building the future of {company_industry.lower()} through technology and innovation."
    ]

    vision_templates = [
        f"To be the global leader in {company_industry.lower()} solutions.",
        f"A world where {company_industry.lower()} is accessible to everyone.",
        f"Redefining standards in the {company_industry.lower()} sector.",
        f"Creating a more connected {company_industry.lower()} ecosystem.",
        f"To pioneer breakthroughs that shape the future of {company_industry.lower()}."
    ]

    # Generate target audience/market
    audience_templates = [
        f"Small to medium businesses in the {company_industry.lower()} sector",
        f"Enterprise-level organizations seeking {company_industry.lower()} solutions",
        f"Consumers interested in premium {company_industry.lower()} products",
        f"Tech-savvy professionals in need of advanced {company_industry.lower()} tools",
        f"{company_industry} professionals looking for specialized solutions"
    ]

    # Generate key executives (5-10)
    num_executives = random.randint(5, 10)
    executives = []

    first_names = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles",
                   "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen",
                   "Emily", "Daniel", "Matthew", "Andrew", "Christopher", "Ryan", "Jonathan", "Emma", "Olivia", "Sophia"]

    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson",
                 "Martinez", "Anderson", "Taylor", "Thomas", "Hernandez", "Moore", "Martin", "Jackson", "Thompson", "White",
                 "Lopez", "Lee", "Gonzalez", "Harris", "Clark", "Lewis", "Robinson", "Walker", "Perez", "Hall"]

    titles = ["CEO", "CTO", "CFO", "COO", "CMO", "CRO", "VP of Sales", "VP of Marketing", "VP of Engineering",
             "VP of Product", "Chief Strategy Officer", "Chief People Officer", "Head of Operations", "Head of Design",
             "Chief Innovation Officer", "Chief Security Officer", "VP of Customer Success", "Director of Business Development",
             "Head of Research", "VP of Partnerships"]

    backgrounds = [
        "Previously at Google, with 15+ years in tech leadership",
        "Former executive at Amazon, specializing in supply chain optimization",
        "MBA from Harvard Business School with consulting background at McKinsey",
        "Ph.D. in Computer Science from MIT, pioneering work in AI",
        "Serial entrepreneur with two successful exits",
        "Former investment banker with expertise in growth strategies",
        "Previously led product development at Microsoft",
        "Built and sold three startups in the same industry",
        "Industry veteran with 20+ years of experience",
        "Former Apple executive specializing in user experience design"
    ]

    # Ensure CEO is one of the executives
    ceo_name = f"{random.choice(first_names)} {random.choice(last_names)}"
    ceo_background = random.choice(backgrounds)
    executives.append({
        "name": ceo_name,
        "title": "CEO",
        "location": company_location,
        "background": ceo_background,
        "years_at_company": random.randint(1, min(2023 - founding_year, 20)),
        "education": random.choice(["MBA, Harvard", "MBA, Stanford", "MS, MIT", "BS, Princeton", "Ph.D., Berkeley"]),
        "linkedin": f"https://www.linkedin.com/in/{ceo_name.lower().replace(' ', '-')}"
    })

    # Add other executives
    used_titles = ["CEO"]
    for _ in range(num_executives - 1):
        title = random.choice(titles)
        while title in used_titles:
            title = random.choice(titles)
        used_titles.append(title)

        exec_name = f"{random.choice(first_names)} {random.choice(last_names)}"
        exec_background = random.choice(backgrounds)
        executives.append({
            "name": exec_name,
            "title": title,
            "location": random.choice(offices),
            "background": exec_background,
            "years_at_company": random.randint(1, min(2023 - founding_year, 15)),
            "education": random.choice(["MBA, Harvard", "MBA, Stanford", "MS, MIT", "BS, Princeton", "Ph.D., Berkeley",
                                       "BS, Yale", "MS, Columbia", "MBA, Wharton", "BS, Cornell", "MS, Georgia Tech"]),
            "linkedin": f"https://www.linkedin.com/in/{exec_name.lower().replace(' ', '-')}"
        })

    # Generate board members (3-7)
    num_board_members = random.randint(3, 7)
    board_members = []

    # CEO is typically on the board
    board_members.append({
        "name": ceo_name,
        "title": "CEO, Board Member",
        "organization": company_name
    })

    board_titles = ["Chairman", "Board Member", "Independent Director", "Investor Representative"]

    for _ in range(num_board_members - 1):
        board_name = f"{random.choice(first_names)} {random.choice(last_names)}"
        board_title = random.choice(board_titles)

        # Board members often represent investors or have external affiliations
        if random.random() < 0.4 and funding_rounds:
            # Pick a random investor from funding rounds
            round_idx = random.randint(0, len(funding_rounds) - 1)
            investors = funding_rounds[round_idx]["investors"].split(", ")
            if investors:
                affiliation = random.choice(investors)
                board_members.append({
                    "name": board_name,
                    "title": board_title,
                    "organization": affiliation,
                    "background": random.choice(backgrounds)
                })
                continue

        # Otherwise, give them an external affiliation
        external_companies = ["Amazon", "Google", "Microsoft", "Apple", "Meta", "IBM", "Oracle", "Salesforce",
                             "Adobe", "Intel", "Cisco", "Dell", "HP", "Netflix", "Twitter", "Shopify"]
        board_members.append({
            "name": board_name,
            "title": board_title,
            "organization": random.choice(external_companies),
            "background": random.choice(backgrounds)
        })

    # Generate products/services (3-7)
    num_products = random.randint(3, 7)
    products = []

    product_name_prefixes = ["Pro", "Advanced", "Smart", "Enterprise", "Cloud", "AI", "Core", "Premium", "Ultimate", "Essential"]
    product_name_suffixes = ["Suite", "Platform", "Solution", "Manager", "Hub", "Analytics", "System", "Service", "Engine", "Assistant"]

    product_types_by_industry = {
        "Technology": ["SaaS Platform", "Mobile App", "Developer Tools", "CRM Solution", "Analytics Platform", "Cloud Service"],
        "Finance": ["Payment Processing", "Investment Platform", "Banking Solution", "Financial Planning", "Trading Software"],
        "Healthcare": ["Patient Management", "Health Records System", "Telemedicine Platform", "Medical Device", "Wellness App"],
        "Sports": ["Fan Engagement Platform", "Team Management Software", "Performance Analytics", "Venue Solution", "Ticketing System"],
        "Gaming": ["Gaming Platform", "Betting Solution", "Player Analytics", "Social Gaming App", "Loyalty Program"],
        "Retail": ["E-commerce Platform", "Inventory Management", "POS System", "Customer Loyalty", "Omnichannel Solution"],
        "Media": ["Content Platform", "Streaming Service", "Publishing Tool", "Advertising Network", "Analytics Suite"]
    }

    # Default to Technology if industry not in the list
    product_types = product_types_by_industry.get(company_industry, product_types_by_industry["Technology"])

    for i in range(num_products):
        product_prefix = random.choice(product_name_prefixes)
        product_suffix = random.choice(product_name_suffixes)
        product_type = random.choice(product_types)

        # Create consistent name pattern for the company's products
        if i == 0:
            # Flagship product often uses company name
            product_name = f"{company_name} {product_suffix}"
        else:
            product_name = f"{company_name} {product_prefix} {product_suffix}"

        # Generate detailed product descriptions
        description_templates = [
            f"A comprehensive {product_type.lower()} designed for businesses seeking to optimize their {company_industry.lower()} operations.",
            f"An innovative {product_type.lower()} that revolutionizes how organizations approach {company_industry.lower()} challenges.",
            f"The premier {product_type.lower()} for {company_industry.lower()} professionals, offering unmatched performance and reliability.",
            f"A next-generation {product_type.lower()} built to address the evolving needs of the {company_industry.lower()} sector.",
            f"The industry-leading {product_type.lower()} trusted by top companies in the {company_industry.lower()} space."
        ]

        # Generate key features
        feature_count = random.randint(3, 6)
        feature_options = [
            "Advanced analytics and reporting",
            "AI-powered recommendations",
            "Real-time data processing",
            "Seamless integration capabilities",
            "Mobile-first design",
            "Enterprise-grade security",
            "Customizable workflows",
            "Automated compliance tools",
            "Collaborative workspace features",
            "Predictive modeling",
            "Cloud-native architecture",
            "Role-based access control",
            "Interactive dashboards",
            "API-first development",
            "Scalable infrastructure"
        ]

        features = []
        for _ in range(feature_count):
            feature = random.choice(feature_options)
            if feature not in features:
                features.append(feature)

        # Generate pricing tier info
        has_pricing_tiers = random.random() < 0.8
        pricing_tiers = []
        if has_pricing_tiers:
            tier_count = random.randint(2, 4)
            tier_names = ["Free", "Basic", "Pro", "Enterprise", "Ultimate"]
            price_points = [0, random.randint(10, 30), random.randint(50, 100), random.randint(200, 500), random.randint(1000, 5000)]

            for t in range(min(tier_count, len(tier_names))):
                tier_features = random.sample(features, min(t+1, len(features)))
                pricing_tiers.append({
                    "name": tier_names[t],
                    "price": price_points[t],
                    "billing": "monthly" if t < len(tier_names) - 1 else random.choice(["monthly", "annual", "custom"]),
                    "features": tier_features
                })

        products.append({
            "name": product_name,
            "type": product_type,
            "description": random.choice(description_templates),
            "features": features,
            "launch_year": random.randint(founding_year, 2023),
            "pricing_tiers": pricing_tiers if has_pricing_tiers else "Contact sales for pricing",
            "website": f"{website}/products/{product_name.lower().replace(' ', '-')}"
        })

    # Generate customer segments and notable clients
    customer_segments = []
    segment_count = random.randint(2, 4)
    segment_options = [
        "Enterprise (1000+ employees)",
        "Mid-market (100-999 employees)",
        "Small Business (10-99 employees)",
        "Startups",
        "Government Agencies",
        "Educational Institutions",
        "Healthcare Organizations",
        "Financial Institutions",
        "Retail Chains",
        "Technology Companies"
    ]

    for _ in range(segment_count):
        segment = random.choice(segment_options)
        if segment not in customer_segments:
            customer_segments.append(segment)

    # Generate notable clients
    client_count = random.randint(3, 8)
    enterprise_clients = [
        "Microsoft", "Google", "Amazon", "Apple", "Meta", "IBM", "Oracle", "Salesforce",
        "Adobe", "Intel", "Cisco", "Dell", "HP", "Nike", "Adidas", "Coca-Cola", "Pepsi",
        "Bank of America", "JPMorgan Chase", "Walmart", "Target", "Home Depot", "Starbucks",
        "McDonald's", "Disney", "Netflix", "Spotify", "Airbnb", "Uber", "Lyft", "Tesla"
    ]

    notable_clients = []
    for _ in range(client_count):
        client = random.choice(enterprise_clients)
        if client not in notable_clients:
            notable_clients.append(client)

    # Generate recent news/press releases
    news_count = random.randint(2, 5)
    news_items = []

    news_types = ["Product Launch", "Partnership Announcement", "Funding News", "Executive Hire", "Award", "Acquisition", "Expansion"]
    current_date = datetime.now()

    for i in range(news_count):
        news_date = current_date - timedelta(days=random.randint(30, 365))
        news_type = random.choice(news_types)

        if news_type == "Product Launch":
            if products:
                product = random.choice(products)
                title = f"{company_name} Announces Launch of {product['name']}"
                content = f"Today, {company_name} introduced its newest offering, {product['name']}, designed to transform how organizations approach {company_industry.lower()}. This innovative solution features {', '.join(product['features'][:2])} and more."
            else:
                title = f"{company_name} Unveils New Product Line"
                content = f"{company_name} today announced a major product update aimed at addressing evolving customer needs in the {company_industry.lower()} sector."

        elif news_type == "Partnership Announcement":
            partner = random.choice(enterprise_clients)
            while partner in notable_clients:
                partner = random.choice(enterprise_clients)

            title = f"{company_name} Forms Strategic Partnership with {partner}"
            content = f"{company_name} and {partner} today announced a strategic partnership to deliver integrated solutions for the {company_industry.lower()} market, combining {company_name}'s expertise with {partner}'s market-leading position."

        elif news_type == "Funding News" and funding_rounds:
            # Use the most recent funding round
            recent_round = funding_rounds[0]
            amount_millions = recent_round["amount"] / 1000000
            title = f"{company_name} Raises ${amount_millions:.0f}M in {recent_round['type']} Funding"
            content = f"{company_name} today announced it has secured ${amount_millions:.0f} million in {recent_round['type']} funding led by {recent_round['investors'].split(',')[0]}, with participation from {', '.join(recent_round['investors'].split(',')[1:] if ',' in recent_round['investors'] else [])}. The company plans to use the funds to accelerate product development and expand market reach."

        elif news_type == "Executive Hire":
            if executives and len(executives) > 1:
                exec = random.choice(executives[1:])  # Skip CEO
                title = f"{company_name} Appoints {exec['name']} as {exec['title']}"
                content = f"{company_name} today announced the appointment of {exec['name']} as its new {exec['title']}. With a background in {exec['background'].split(',')[0].lower()}, {exec['name'].split()[0]} brings valuable experience to help drive the company's next phase of growth."
            else:
                title = f"{company_name} Expands Leadership Team with Key Executive Hire"
                content = f"{company_name} today announced an addition to its executive team, bringing industry expertise to support the company's strategic initiatives in the {company_industry.lower()} sector."

        elif news_type == "Award":
            award_names = [
                f"Best {company_industry} Solution",
                f"Top {company_industry} Innovator",
                f"{company_industry} Excellence Award",
                "Industry Innovation Award",
                "Customer Choice Award"
            ]
            award = random.choice(award_names)
            title = f"{company_name} Wins {award} for {datetime.now().year}"
            content = f"{company_name} has been recognized with the prestigious {award}, highlighting the company's commitment to excellence and innovation in the {company_industry.lower()} industry."

        elif news_type == "Acquisition":
            acquisition_target = f"{random.choice(['Alpha', 'Beta', 'Nova', 'Apex', 'Pulse', 'Echo', 'Fusion', 'Quantum', 'Vector', 'Horizon'])} {random.choice(['Technologies', 'Solutions', 'Systems', 'Innovations', 'Labs'])}"
            title = f"{company_name} Acquires {acquisition_target} to Strengthen {company_industry} Offerings"
            content = f"{company_name} today announced the acquisition of {acquisition_target}, a move that strengthens its position in the {company_industry.lower()} market and expands its product portfolio with complementary technologies."

        else:  # Expansion
            expansion_location = random.choice(locations)
            while expansion_location in offices:
                expansion_location = random.choice(locations)

            title = f"{company_name} Announces Expansion to {expansion_location}"
            content = f"{company_name} today announced the opening of a new office in {expansion_location}, marking a significant milestone in the company's growth strategy and commitment to serving clients globally."

        news_items.append({
            "date": news_date.strftime("%B %d, %Y"),
            "title": title,
            "content": content,
            "url": f"{website}/news/{title.lower().replace(' ', '-').replace(',', '').replace('.', '')}"
        })

    # Create the comprehensive enriched data structure
    enriched_data = {
        "company_details": {
            "name": company_name,
            "founded_year": founding_year,
            "size": company_size,
            "industry": company_industry,
            "headquarters": headquarters,
            "offices": offices,
            "website": website,
            "social_media": social_media,
            "employee_count": int(company_size.split('-')[1].replace('+', '')) if '+' in company_size else random.randint(int(company_size.split('-')[0]), int(company_size.split('-')[1])),
            "annual_revenue": annual_revenue,
            "growth_rates": {
                "1_year": growth_rates[0],
                "3_year": growth_rates[1],
                "5_year": growth_rates[2]
            },
            "mission": random.choice(mission_templates),
            "vision": random.choice(vision_templates),
            "target_audience": random.choice(audience_templates)
        },
        "leadership": {
            "executives": executives,
            "board_members": board_members
        },
        "products_and_services": products,
        "market_presence": {
            "customer_segments": customer_segments,
            "notable_clients": notable_clients,
            "competitors": [random.choice(enterprise_clients) for _ in range(random.randint(2, 5))],
            "market_share": f"{random.randint(1, 30)}%",
            "geographical_presence": [office.split(',')[1].strip() if ',' in office else office for office in offices]
        },
        "funding": {
            "total_funding": total_funding,
            "funding_rounds": funding_rounds,
            "latest_valuation": funding_rounds[-1]["valuation"] if funding_rounds else None
        },
        "news_and_updates": news_items,
        "source": "Enhanced simulated data (Coresignal API unavailable)"
    }

    return enriched_data

# Split companies into chunks for parallel analysis
def split_into_chunks(companies, chunk_size=4):
    """Split a list of companies into chunks for parallel processing"""
    return [companies[i:i + chunk_size] for i in range(0, len(companies), chunk_size)]

# Process a chunk of companies for analysis
def process_company_chunk(companies_chunk, industry, formatted_partners, formatted_scoring):
    """Analyze a chunk of companies in parallel"""
    formatted_companies = ", ".join(companies_chunk)

    # Enhanced prompt with more explicit instructions for competitor detection
    prompt = f"""
    I need you to analyze the following companies in the {industry} industry:
    {formatted_companies}

    For each company, determine if they would compete with any of our current partners.
    This is EXTREMELY IMPORTANT - carefully evaluate each company against ALL current partners.
    Pay close attention to each partner's category, description, inclusions, and exclusions.

    A company competes with a partner if:

    2. They offer similar products/services mentioned in the partner's inclusions
    3. They are specifically mentioned in a partner's exclusions list

    Be thorough and conservative - if there's any significant overlap or competition, mark as competing.

    IMPORTANT: If a company competes with ANY current partner, its total_score MUST be set to 0.

    Provide a detailed analysis of each company, including:
    - Company overview
    - Products/services
    - Market position
    - Whether they compete with any current partners (specify which partners and why)
    - Score breakdown across all categories (set all scores to 0 if company competes with any partner)
    - Total score (must be 0 if company competes with any partner)

    Our current partners are:
    {formatted_partners}

    The scoring criteria are:
    {formatted_scoring}

    Return your analysis as a JSON object with the following structure:
    {{
        "companies": [
            {{
                "name": "Company Name",
                "description": "Company overview",
                "products_services": "Products and services",
                "market_position": "Market position",
                "competes_with_partners": true/false,
                "competing_partners": ["Partner1", "Partner2"],  // Only if competes_with_partners is true
                "competition_reasons": "Explanation of why they compete",  // Only if competes_with_partners is true
                "scores": {{
                    "brand_alignment": {{ "score": X, "max": Y, "explanation": "..." }},
                    "audience_fit": {{ "score": X, "max": Y, "explanation": "..." }},
                    "content_opportunities": {{ "score": X, "max": Y, "explanation": "..." }},
                    "digital_integration": {{ "score": X, "max": Y, "explanation": "..." }},
                    "innovation_potential": {{ "score": X, "max": Y, "explanation": "..." }}
                }},
                "total_score": XX  // MUST be 0 if competes_with_partners is true
            }}
        ]
    }}
    """

    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a professional business analyst specializing in partnership and competitive analysis. Your primary task is to thoroughly evaluate potential competition between companies and existing partners."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )

        # Check if response content exists and is valid
        if not response or not response.choices or not response.choices[0].message or not response.choices[0].message.content:
            print(f"Error: Empty or invalid response from OpenAI for chunk: {formatted_companies}")
            return [{"name": company, "description": f"Analysis failed for {company}", "competes_with_partners": False, "scores": {}, "total_score": 0} for company in companies_chunk]

        content = response.choices[0].message.content.strip()
        if not content:
            print(f"Error: Empty content from OpenAI for chunk: {formatted_companies}")
            return [{"name": company, "description": f"Analysis failed for {company}", "competes_with_partners": False, "scores": {}, "total_score": 0} for company in companies_chunk]

        try:
            chunk_analysis = json.loads(content)
            # Extract just the companies from the chunk result
            companies_data = chunk_analysis.get("companies", [])

            # Validate each company has required fields
            validated_companies = []
            for company_data in companies_data:
                # Ensure company has a name
                if not company_data.get("name"):
                    company_data["name"] = companies_chunk[len(validated_companies)] if len(validated_companies) < len(companies_chunk) else "Unknown Company"

                # Ensure company has required fields
                if not company_data.get("description"):
                    company_data["description"] = f"No description available for {company_data['name']}"

                if not isinstance(company_data.get("competes_with_partners"), bool):
                    company_data["competes_with_partners"] = False

                if not company_data.get("scores"):
                    company_data["scores"] = {}

                if not isinstance(company_data.get("total_score"), (int, float)):
                    company_data["total_score"] = 0

                # If the company competes with partners, set total_score to 0
                if company_data.get("competes_with_partners") == True:
                    original_score = company_data.get("total_score", 0)
                    company_data["total_score"] = 0
                    print(f"Initial processing: Setting score to 0 for {company_data['name']} due to competition (original: {original_score})")

                validated_companies.append(company_data)

            # If no valid companies were found or count doesn't match, create default entries
            if not validated_companies or len(validated_companies) != len(companies_chunk):
                missing_companies = [company for company in companies_chunk if company not in [c.get("name") for c in validated_companies]]
                for missing_company in missing_companies:
                    validated_companies.append({
                        "name": missing_company,
                        "description": f"Analysis could not be completed for {missing_company}",
                        "competes_with_partners": False,
                        "scores": {},
                        "total_score": 0
                    })

            return validated_companies

        except json.JSONDecodeError as e:
            print(f"JSON parsing error for chunk {formatted_companies}: {str(e)}")
            print(f"Raw content: {content[:500]}...")
            return [{"name": company, "description": f"Analysis failed for {company} - JSON parsing error", "competes_with_partners": False, "scores": {}, "total_score": 0} for company in companies_chunk]

    except Exception as e:
        print(f"Error analyzing chunk {formatted_companies}: {str(e)}")
        # Return a basic structure if parsing fails
        return [{"name": company, "description": f"Analysis failed for {company}", "competes_with_partners": False, "scores": {}, "total_score": 0} for company in companies_chunk]

# Function to generate company analysis
def generate_company_analysis(companies, industry):
    try:
        # Check input parameters
        if not companies or not isinstance(companies, list) or not all(isinstance(c, str) for c in companies):
            print("Error: Invalid companies list")
            return {
                "industry_overview": f"Analysis for {industry if industry else 'unknown'} industry",
                "companies": [],
                "suitable_partners": []
            }

        if not industry or not isinstance(industry, str):
            industry = "unspecified industry"

        # Create a formatted list of current partners for OpenAI
        formatted_partners = "\n\n".join([
            f"Partner: {p['name']}\nCategory: {p['category']}\nDescription: {p['description']}\nInclusions: {', '.join(p['inclusions'])}\nExclusions: {', '.join(p['exclusions'])}"
            for p in CURRENT_PARTNERS
        ])

        # Format the scoring criteria for OpenAI
        formatted_scoring = "\n\n".join([
            f"Category: {cat['name']} (Max: {cat['max_points']} pts)\nCriteria: " +
            "; ".join([f"{c['points']} pts - {c['description']}" for c in cat['criteria']])
            for cat_key, cat in SCORING_CRITERIA.items()
        ])

        # Format the companies list for the industry overview
        formatted_companies_all = ", ".join(companies)

        # First, get industry overview separately
        print(f"Getting industry overview for: {industry}")
        industry_overview = f"The {industry} industry offers various partnership opportunities."

        try:
            industry_prompt = f"""
            Provide a brief overview of the {industry} industry, focusing on its relevance to sports and entertainment partnerships.
            Return only a JSON object with the structure: {{"industry_overview": "Your overview text here"}}
            """

            industry_response = openai.chat.completions.create(
                model="gpt-3.5-turbo",  # Use faster model for overview
                messages=[
                    {"role": "system", "content": "You are a professional business analyst specializing in partnership and competitive analysis."},
                    {"role": "user", "content": industry_prompt}
                ],
                response_format={"type": "json_object"}
            )

            # Safely extract the overview, handling potential errors
            if industry_response and industry_response.choices and industry_response.choices[0].message and industry_response.choices[0].message.content:
                try:
                    industry_data = json.loads(industry_response.choices[0].message.content)
                    if isinstance(industry_data, dict) and "industry_overview" in industry_data:
                        industry_overview = industry_data["industry_overview"]
                except json.JSONDecodeError as e:
                    print(f"Error parsing industry overview: {e}")
                    # Keep default overview
        except Exception as e:
            print(f"Error getting industry overview: {e}")
            # Industry overview already has default value

        print(f"Processing analysis for companies: {formatted_companies_all}")

        # Process the companies in parallel - split into smaller chunks for better performance
        company_chunks = split_into_chunks(companies)
        all_companies = []

        try:
            # Process chunks in parallel
            with ThreadPoolExecutor(max_workers=min(5, len(company_chunks))) as executor:
                # Submit all chunks for processing
                futures = []
                for chunk in company_chunks:
                    future = executor.submit(
                        process_company_chunk,
                        chunk,
                        industry,
                        formatted_partners,
                        formatted_scoring
                    )
                    futures.append(future)

                # Collect results as they complete
                for future in as_completed(futures):
                    try:
                        chunk_companies = future.result()
                        if chunk_companies and isinstance(chunk_companies, list):
                            all_companies.extend(chunk_companies)
                    except Exception as e:
                        print(f"Error getting results from future: {e}")
        except Exception as e:
            print(f"Error in parallel processing: {e}")
            # Fallback to basic data if parallel processing fails
            all_companies = [{"name": company, "description": "No description available", "competes_with_partners": False, "scores": {}, "total_score": 0} for company in companies]

        # Identify suitable partners (companies that don't compete with current partners)
        suitable_partners = [company["name"] for company in all_companies if not company.get("competes_with_partners", True)]

        # Create the final analysis structure
        analysis = {
            "industry_overview": industry_overview,
            "companies": all_companies,
            "suitable_partners": suitable_partners
        }

        return analysis

    except Exception as e:
        print(f"Unexpected error in generate_company_analysis: {str(e)}")
        return {
            "industry_overview": f"Analysis for the {industry if industry else 'unknown'} industry could not be completed due to an error.",
            "companies": [{"name": company, "description": "Analysis failed", "competes_with_partners": False, "scores": {}, "total_score": 0} for company in companies] if isinstance(companies, list) else [],
            "suitable_partners": []
        }

# Process a single company for parallel processing
def process_company(company):
    """Process a single company in parallel - enrich all companies regardless of score or competition status"""
    try:
        if not company or not isinstance(company, dict):
            print(f"Error: Invalid company data structure")
            return {
                "name": "Unknown Company",
                "description": "Invalid company data received",
                "competes_with_partners": False,
                "total_score": 0.0,
                "partnership_score": 0.0,
                "enriched": False
            }

        # Ensure company has a name
        company_name = company.get('name', 'Unknown Company')
        if not company_name or not isinstance(company_name, str):
            company_name = 'Unknown Company'
            company['name'] = company_name

        # Calculate scaled score (1-10)
        max_total_score = sum(criteria['max_points'] for criteria in SCORING_CRITERIA.values())

        try:
            total_score = float(company.get('total_score', 0))
        except (ValueError, TypeError):
            total_score = 0.0

        scaled_score = (total_score / max_total_score) * 10

        # Enrich the company data
        enriched_data = fetch_coresignal_data(company_name)

        # Calculate partnership score
        partnership_score = scaled_score * 0.7 + random.uniform(0, 3)

        # Create the enriched company data structure
        enriched_company = {
            "name": company_name,
            "description": enriched_data["company_details"]["mission"],
            "competes_with_partners": company.get("competes_with_partners", False),
            "total_score": total_score,
            "partnership_score": partnership_score,
            "enriched": True
        }

        return enriched_company

    except Exception as e:
        print(f"Error processing company: {str(e)}")
        return {
            "name": company_name,
            "description": f"Error processing {company_name}",
            "competes_with_partners": False,
            "total_score": 0.0,
            "partnership_score": 0.0,
            "enriched": False
        }

# Process a single company for parallel processing
def process_company(company):
    """Process a single company in parallel - enrich all companies regardless of score or competition status"""
    try:
        if not company or not isinstance(company, dict):
            print(f"Error: Invalid company data structure")
            return {
                "name": "Unknown Company",
                "description": "Invalid company data received",
                "competes_with_partners": False,
                "total_score": 0.0,
                "partnership_score": 0.0,
                "enriched": False
            }

        # Ensure company has a name
        company_name = company.get('name', 'Unknown Company')
        if not company_name or not isinstance(company_name, str):
            company_name = 'Unknown Company'
            company['name'] = company_name

        # Calculate scaled score (1-10)
        max_total_score = sum(criteria['max_points'] for criteria in SCORING_CRITERIA.values())

        try:
            total_score = float(company.get('total_score', 0))
        except (ValueError, TypeError):
            total_score = 0.0
            company['total_score'] = 0.0

        if not isinstance(total_score, (int, float)):
            total_score = 0.0
            company['total_score'] = 0.0

        # Check if company competes with partners
        competes_with_partners = company.get('competes_with_partners', False)
        if not isinstance(competes_with_partners, bool):
            competes_with_partners = False
            company['competes_with_partners'] = False

        # Set partnership_score to 0 if company competes with existing partners
        if competes_with_partners:
            original_score = scaled_score = round((total_score / max_total_score) * 10) if max_total_score > 0 else 0
            scaled_score = 0.0
            company['total_score'] = 0.0  # Also set total_score to 0
            print(f"  - Setting score to 0 due to competition (original score was {original_score}/10)")
        else:
            scaled_score = round((total_score / max_total_score) * 10) if max_total_score > 0 else 0

        # Add partnership_score property that the frontend uses - ensure it's a float
        company['partnership_score'] = float(scaled_score)

        # Add has_competition property for frontend compatibility
        company['has_competition'] = competes_with_partners

        competing_with = []
        if competes_with_partners and isinstance(company.get('competing_partners'), list):
            competing_with = company.get('competing_partners', [])

        if competes_with_partners:
            print(f"ENRICHING COMPETING COMPANY: {company_name} (Score: {scaled_score}/10)")
            if competing_with:
                print(f"  - Competes with: {', '.join(competing_with)}")
            competition_reason = company.get('competition_reasons', '')
            if isinstance(competition_reason, str) and competition_reason:
                print(f"  - Reason: {competition_reason}")
            else:
                print(f"  - Reason: No specific reason provided")
        else:
            print(f"ENRICHING NON-COMPETING COMPANY: {company_name} (Score: {scaled_score}/10)")
            # For non-competing companies, perform more extensive enrichment
            print(f"  - Conducting deep research on {company_name} as a promising partner candidate")

        # Generate company logo
        try:
            company['logo'] = generate_logo(company_name)
        except Exception as e:
            print(f"  - Error generating logo: {str(e)}")
            company['logo'] = "https://img.logo.dev/default.com?token=pk_TCK5i8rzR92YmS65BY2fgQ&retina=true"

        # Fetch Coresignal data for ALL companies (but do more with non-competing ones)
        try:
            coresignal_data = fetch_coresignal_data(company_name)
            if coresignal_data:
                company['coresignal_data'] = coresignal_data
                company['enriched'] = True

                # For non-competing companies, extract and highlight key partnership insights
                if not competes_with_partners and scaled_score > 0:
                    # Extract key leadership information
                    if 'leadership' in coresignal_data and 'executives' in coresignal_data['leadership']:
                        executives = coresignal_data['leadership']['executives']
                        # Add a summary of key leadership to the main company object for easy access
                        company['key_leadership'] = [
                            f"{exec['name']} ({exec['title']})" for exec in executives[:3]
                        ]

                    # Extract product information
                    if 'products_and_services' in coresignal_data:
                        products = coresignal_data['products_and_services']
                        # Add a summary of key products to the main company object
                        company['key_products'] = [
                            product['name'] for product in products[:3]
                        ]

                    # Add partnership opportunities based on data
                    partnership_opportunities = []

                    # Check for co-marketing opportunities
                    if 'market_presence' in coresignal_data and 'customer_segments' in coresignal_data['market_presence']:
                        segments = coresignal_data['market_presence']['customer_segments']
                        if segments and len(segments) > 0:
                            partnership_opportunities.append(f"Co-marketing to {', '.join(segments[:2])} audiences")

                    # Check for technology integration opportunities
                    if 'products_and_services' in coresignal_data and len(coresignal_data['products_and_services']) > 0:
                        products = coresignal_data['products_and_services']
                        if products:
                            partnership_opportunities.append(f"Technology integration with {products[0]['name']}")

                    # Check for event sponsorship opportunities
                    if random.random() < 0.7:  # 70% chance of having event opportunities
                        partnership_opportunities.append("Joint event sponsorship opportunities")

                    # Check for content collaboration
                    if 'company_details' in coresignal_data and 'target_audience' in coresignal_data['company_details']:
                        partnership_opportunities.append(f"Content collaboration targeting {coresignal_data['company_details']['target_audience']}")

                    # Include partnership opportunities in the main company object
                    company['partnership_opportunities'] = partnership_opportunities

                    # Generate partnership potential assessment
                    company['partnership_potential'] = {
                        "strategic_alignment": random.randint(7, 10) if scaled_score >= 7 else random.randint(5, 8),
                        "audience_overlap": random.randint(6, 10) if scaled_score >= 6 else random.randint(4, 7),
                        "technology_compatibility": random.randint(7, 10) if scaled_score >= 7 else random.randint(5, 8),
                        "brand_alignment": random.randint(6, 10) if scaled_score >= 6 else random.randint(4, 7),
                        "overall_recommendation": "Highly Recommended" if scaled_score >= 7 else "Recommended" if scaled_score >= 5 else "Consider"
                    }

                    # Perform deep market analysis
                    market_analysis = {
                        "growth_trajectory": f"{random.choice(['Strong', 'Moderate', 'Rapid', 'Steady'])} growth in the {coresignal_data['company_details']['industry']} sector",
                        "market_position": f"{random.choice(['Leading', 'Established', 'Emerging', 'Innovative'])} player in their market segment",
                        "competitive_advantage": random.choice([
                            "Proprietary technology platform",
                            "Strong brand recognition",
                            "Unique service offering",
                            "Extensive distribution network",
                            "Innovative business model",
                            "Superior customer experience"
                        ]),
                        "future_outlook": random.choice([
                            "Positioned for continued expansion",
                            "Strong potential for market leadership",
                            "Innovating in emerging market segments",
                            "Well-positioned for industry changes",
                            "Adapting effectively to market trends"
                        ])
                    }
                    company['market_analysis'] = market_analysis

                    print(f"  - Completed comprehensive partner analysis for {company_name}")
                    print(f"  - Partnership recommendation: {company['partnership_potential']['overall_recommendation']}")

                print(f"  - Successfully enriched with external data")
            else:
                company['enriched'] = False
                print(f"  - Failed to retrieve external data")
        except Exception as e:
            company['enriched'] = False
            print(f"  - Error fetching external data: {str(e)}")

        return company

    except Exception as e:
        print(f"Unexpected error in process_company: {str(e)}")
        return {
            "name": company.get('name', 'Unknown Company') if isinstance(company, dict) else 'Unknown Company',
            "description": "Error processing company data",
            "competes_with_partners": False,
            "total_score": 0,
            "partnership_score": 0,
            "enriched": False
        }

@app.route('/api/')
def api_index():
    return jsonify({"status": "API is running"})

@app.route('/api/potential-partners-test', methods=['GET'])
def get_partners_test():
    """Get potential partners directly from Supabase"""
    try:
        if not supabase:
            return jsonify({
                "status": "error",
                "message": "Supabase client not available"
            }), 500

        # Get query parameters
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')

        # Execute query directly
        response = supabase.table('potential_partners').select('*').order(sort_by, desc=(sort_order.lower() == 'desc')).execute()

        # Process response
        if response.data:
            print(f"Found {len(response.data)} potential partners")
            return jsonify({
                "status": "success",
                "partners": response.data
            })
        else:
            return jsonify({
                "status": "success",
                "partners": []
            })
    except Exception as e:
        print(f"Error getting potential partners: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/search-status', methods=['GET'])
def get_search_status():
    """Get the current search status"""
    # Format the search_status to match what the React app expects
    formatted_status = {
        "current_step": search_status.get("status", "idle"),
        "message": search_status.get("message", "Ready to search"),
        "progress": search_status.get("progress", 0),
        "completed": search_status.get("status") == "completed" or search_status.get("completed", False),
        "results": search_status.get("results"),
        "error": search_status.get("error")
    }
    return jsonify(formatted_status)

# Add a non-prefixed route that forwards to the API route
@app.route('/search-status', methods=['GET'])
def proxy_search_status():
    """Proxy for the search status endpoint without the /api prefix"""
    return get_search_status()

@app.route('/api/search', methods=['POST'])
def search():
    try:
        global search_status
        global previously_considered_companies

        # Generate a unique search ID
        search_id = datetime.now().strftime("%Y%m%d%H%M%S")

        # Reset search status
        search_status = {
            "status": "starting",
            "message": "Initiating search process",
            "progress": 5,
            "results": None,
            "error": None
        }

        data = request.json
        query = data.get('query', '') if data else ''

        # Validate the query
        if not query or not isinstance(query, str) or len(query.strip()) == 0:
            search_status.update({
                "status": "error",
                "message": "Please provide a valid search query",
                "progress": 100,
                "completed": True
            })
            return jsonify({'error': 'Please provide a valid search query'}), 400

        # Normalize the query
        query = query.strip()

        # Get Exa API key from environment
        exa_api_key = os.getenv('EXA_API_KEY')
        if not exa_api_key:
            search_status.update({
                "status": "error",
                "message": "API key not configured",
                "progress": 100,
                "completed": True
            })
            return jsonify({'error': 'EXA_API_KEY not found in environment variables'}), 500

        # Update status - starting search
        search_status.update({
            "status": "searching",
            "message": f"Searching for companies related to: {query}",
            "progress": 10
        })

        # Search for companies in the industry
        search_results = search_companies_in_industry(query, exa_api_key)

        # Update status - extracting companies
        search_status.update({
            "status": "extracting",
            "message": "Extracting company names from search results",
            "progress": 30
        })

        # Extract company names from search results
        company_names = extract_company_names(search_results, query)

        # Filter out companies that are already partners
        current_partner_names = [p['name'] for p in CURRENT_PARTNERS]

        # Log checking against current partners
        print(f"Checking {len(company_names)} potential companies against {len(current_partner_names)} current partners")

        # Check for exact matches with current partners
        exact_matches = [name for name in company_names if name in current_partner_names]
        if exact_matches:
            print(f"Warning: Found {len(exact_matches)} companies that are already partners: {', '.join(exact_matches)}")

        filtered_companies = [name for name in company_names if name not in current_partner_names]

        search_status.update({
            "message": f"Found {len(filtered_companies)} potential companies after filtering out existing partners",
            "progress": 32
        })

        # Filter out previously considered companies
        not_previously_considered = [name for name in filtered_companies if name not in previously_considered_companies]

        search_status.update({
            "message": f"Filtered out {len(filtered_companies) - len(not_previously_considered)} previously considered companies",
            "progress": 35
        })

        # Add newly considered companies to our tracking set
        for name in not_previously_considered:
            add_company_to_considered(name)

        print(f"Previously considered companies (total: {len(previously_considered_companies)}): {previously_considered_companies}")

        # Limit to 40 companies for analysis (changed from 20)
        companies_to_analyze = not_previously_considered[:40]

        search_status.update({
            "message": f"Selected {len(companies_to_analyze)} new companies for analysis",
            "progress": 40
        })

        # If no companies found, return error
        if not companies_to_analyze:
            search_status.update({
                "status": "error",
                "message": "No new companies found in this industry. Try a different industry.",
                "progress": 100,
                "completed": True
            })
            return jsonify({
                'error': 'No new companies found in this industry. Try a different industry.',
                'industry': query,
                'search_results': search_results,
                'previously_considered_count': len(previously_considered_companies)
            }), 404

        # Update status - analyzing companies
        search_status.update({
            "status": "analyzing",
            "message": "Analyzing companies and checking for competition with current partners",
            "progress": 50
        })

        # Generate analysis for the companies
        analysis = generate_company_analysis(companies_to_analyze, query)

        # Calculate max total score
        max_total_score = sum(criteria['max_points'] for criteria in SCORING_CRITERIA.values())

        # Update status - enriching data
        search_status.update({
            "status": "enriching",
            "message": f"Enriching data for all {len(analysis['companies'])} companies",
            "progress": 80
        })

        # Process companies one at a time to avoid rate limiting, but only those with non-zero scores
        companies_to_process = [company for company in analysis['companies'] if float(company.get('total_score', 0)) > 0]
        all_company_names = [company['name'] for company in companies_to_process]
        search_status.update({
            "message": f"Processing {len(all_company_names)} companies with non-zero scores",
            "progress": 85
        })

        # Process each company sequentially
        completed = 0
        total = len(companies_to_process)

        for company in companies_to_process:
            # Update status for current company
            search_status.update({
                "message": f"Processing company {completed+1}/{total}: {company['name']} (Score: {company.get('total_score', 0)})",
                "progress": 85 + (completed / total * 10)  # Scale from 85 to 95
            })

            # Process the company
            process_company(company)

            # Update completion status
            completed += 1
            search_status.update({
                "message": f"Processed {completed}/{total} companies",
                "progress": 85 + (completed / total * 10)  # Scale from 85 to 95
            })

            # Add a small delay between API calls to avoid rate limiting
            time.sleep(1)

        # Mark companies with zero scores as not enriched
        for company in analysis['companies']:
            if float(company.get('total_score', 0)) <= 0:
                company['enriched'] = False

        # Calculate summary metrics
        final_competing_count = sum(1 for company in analysis['companies'] if company.get('competes_with_partners', False))
        final_enriched_count = sum(1 for company in analysis['companies'] if company.get('enriched', False))

        # Save non-conflicting companies to potential partners database
        saved_count = 0
        for company in analysis['companies']:
            if not company.get('competes_with_partners', False) and not company.get('has_competition', False):
                if save_potential_partner(company, query):
                    saved_count += 1

        # Update status - completed
        search_status.update({
            "status": "completed",
            "message": f"Search completed: Found {len(analysis['companies'])} companies, saved {saved_count} non-conflicting companies to database",
            "progress": 100,
            "completed": True
        })

        return jsonify({
            'industry': query,
            'analysis': analysis,
            'search_results': search_results,
            'scoring_criteria': SCORING_CRITERIA,
            'max_total_score': max_total_score
        })

    except Exception as e:
        # Update status - error
        search_status.update({
            "status": "error",
            "message": f"Error in search: {str(e)}",
            "progress": 100,
            "completed": True
        })
        print(f"Error in search: {e}")
        return jsonify({'error': str(e)}), 500

# Add a non-prefixed route that forwards to the API route
@app.route('/search', methods=['POST'])
def proxy_search():
    """Proxy for the search endpoint without the /api prefix"""
    return search()

@app.route('/api/ai-search', methods=['GET'])
def ai_search():
    global search_status

    try:
        print("\n=== Starting AI Search ===")

        # Reset search status
        search_status = {
            "status": "searching",
            "message": "Initiating AI-powered search...",
            "progress": 5,
            "results": None,
            "error": None
        }

        # Ensure environment variable is set
        api_key = os.environ.get('EXA_API_KEY')
        if not api_key:
            error_message = "API key not found. Please set the EXA_API_KEY environment variable."
            search_status.update({
                "status": "error",
                "message": error_message,
                "progress": 0,
                "error": error_message
            })
            print(f"Error: {error_message}")
            return jsonify({"message": error_message}), 500

        # Randomly select an industry for demo purposes
        industries = [
            "sports technology", "sports marketing", "sports media",
            "fan engagement", "sponsorship technology", "sports analytics",
            "esports", "sports betting", "sports equipment", "digital marketing"
        ]

        selected_industry = random.choice(industries)
        print(f"Selected industry for AI search: {selected_industry}")

        # Update status
        search_status.update({
            "status": "searching",
            "message": f"Searching for companies in {selected_industry}...",
            "progress": 10
        })

        # Start the search in a background thread
        thread = Thread(target=run_ai_search, args=(selected_industry, api_key))
        thread.daemon = True
        thread.start()

        return jsonify({"message": f"AI search started for {selected_industry}"}), 200

    except Exception as e:
        error_message = f"Error in AI search: {str(e)}"
        print(f"ERROR: {error_message}")
        traceback.print_exc()  # Print full traceback for debugging

        # Update search status with error
        search_status.update({
            "status": "error",
            "message": error_message,
            "progress": 0,
            "error": error_message
        })

        return jsonify({"message": error_message}), 500

def run_ai_search(industry, api_key):
    global search_status
    global previously_considered_companies

    try:
        print(f"Background thread: Searching for companies in {industry}")

        # Perform the search
        search_status.update({
            "status": "searching",
            "message": f"Finding companies in {industry}...",
            "progress": 20
        })

        # Search for companies in the industry
        search_results = search_companies_in_industry(industry, api_key)
        if not search_results or not isinstance(search_results, list):
            error_message = f"Failed to get search results for {industry}"
            print(f"Error: {error_message}")
            search_status.update({
                "status": "error",
                "message": error_message,
                "progress": 0,
                "error": error_message
            })
            return

        print(f"Found {len(search_results)} search results")

        # Update status
        search_status.update({
            "status": "processing",
            "message": "Extracting company names...",
            "progress": 50
        })

        # Extract company names
        companies = extract_company_names(search_results, industry)
        if not companies or not isinstance(companies, list) or len(companies) == 0:
            error_message = f"Failed to extract company names from search results for {industry}"
            print(f"Error: {error_message}")
            search_status.update({
                "status": "error",
                "message": error_message,
                "progress": 0,
                "error": error_message
            })
            return

        print(f"Extracted {len(companies)} company names")

        # Limit to 40 companies for analysis
        companies = companies[:40]

        # Update status
        search_status.update({
            "status": "analyzing",
            "message": f"Analyzing {len(companies)} companies...",
            "progress": 70
        })

        # Generate company analysis
        analysis = generate_company_analysis(companies, industry)
        if not analysis or not isinstance(analysis, dict):
            error_message = f"Failed to generate analysis for companies in {industry}"
            print(f"Error: {error_message}")
            search_status.update({
                "status": "error",
                "message": error_message,
                "progress": 0,
                "error": error_message
            })
            return

        print(f"Generated analysis for {len(analysis.get('companies', []))} companies")

        # Process only companies with non-zero scores to avoid rate limiting
        processed_companies = []
        if analysis.get('companies') and isinstance(analysis['companies'], list):
            # Filter companies with non-zero scores
            companies_to_process = [company for company in analysis['companies'] if float(company.get('total_score', 0)) > 0]

            # Update status
            search_status.update({
                "status": "processing",
                "message": f"Processing {len(companies_to_process)} companies with non-zero scores",
                "progress": 75
            })

            # Process each company sequentially
            completed = 0
            total = len(companies_to_process)

            for company in companies_to_process:
                try:
                    # Update status for current company
                    search_status.update({
                        "message": f"Processing company {completed+1}/{total}: {company['name']} (Score: {company.get('total_score', 0)})",
                        "progress": 75 + (completed / total * 15)  # Scale from 75 to 90
                    })

                    # Process the company
                    processed_company = process_company(company)

                    if processed_company:
                        processed_companies.append(processed_company)
                        # Add to previously considered companies
                        if processed_company.get('name'):
                            add_company_to_considered(processed_company['name'])

                    # Update completion status
                    completed += 1
                    search_status.update({
                        "message": f"Processed {completed}/{total} companies",
                        "progress": 75 + (completed / total * 15)  # Scale from 75 to 90
                    })

                    # Add a small delay between API calls to avoid rate limiting
                    time.sleep(1)
                except Exception as e:
                    print(f"Error processing company: {str(e)}")
                    # Continue with next company

            # Mark companies with zero scores as not enriched
            for company in analysis['companies']:
                if float(company.get('total_score', 0)) <= 0:
                    company['enriched'] = False

        # Update analysis with processed companies
        analysis['companies'] = processed_companies

        # Save non-conflicting companies to potential partners database
        saved_count = 0
        for company in processed_companies:
            if not company.get('competes_with_partners', False) and not company.get('has_competition', False):
                if save_potential_partner(company, industry):
                    saved_count += 1

        # Record the search in history
        add_search_to_history("AI Search", industry, len(processed_companies))

        # Update status to complete
        search_status.update({
            "status": "completed",
            "message": f"Search complete: Saved {saved_count} non-conflicting companies to database",
            "progress": 100,
            "results": analysis,
            "error": None
        })

        print("AI search completed successfully")

    except Exception as e:
        error_message = f"Error in AI search background process: {str(e)}"
        print(f"ERROR: {error_message}")
        traceback.print_exc()  # Print full stack trace

        # Update search status with error
        search_status.update({
            "status": "error",
            "message": error_message,
            "progress": 0,
            "error": error_message
        })

@app.route('/api/reset-history', methods=['POST'])
def reset_history():
    """Reset the previously considered companies list and potential partners"""
    global previously_considered_companies
    global search_status
    global search_history

    # Clear database
    clear_history_from_db()

    # Also clear potential partners
    if supabase:
        try:
            # Delete all records from potential_partners table
            supabase.table('potential_partners').delete().execute()
            print("Cleared potential partners from Supabase")
        except Exception as e:
            print(f"Error clearing potential partners from Supabase: {str(e)}")
            traceback.print_exc() # Print stack trace for debugging

    # Reset in-memory collections
    previously_considered_companies = set()
    search_history = []

    search_status = {
        "status": "idle",
        "message": "History cleared. Ready to search.",
        "progress": 0,
        "results": None,
        "error": None
    }

    return jsonify({
        'success': True,
        'message': 'Company history and potential partners have been reset.',
        'company_count': 0
    })

# Add a non-prefixed route that forwards to the API route
@app.route('/reset-history', methods=['POST'])
def proxy_reset_history():
    """Proxy for the reset history endpoint without the /api prefix"""
    return reset_history()

@app.route('/api/search-history', methods=['GET'])
def get_search_history():
    """Returns the search history and previously considered companies"""
    global previously_considered_companies

    # Get search history from database
    history = get_search_history_from_db()

    # Ensure previously_considered_companies is initialized
    if not hasattr(globals(), 'previously_considered_companies') or previously_considered_companies is None:
        previously_considered_companies = set()
        # Try to load from database
        load_previously_considered()

    # Get all previously considered companies (already loaded in-memory)
    companies = list(previously_considered_companies)

    return jsonify({
        'previously_considered': {
            'count': len(companies),
            'companies': companies
        },
        'search_history': history
    })

# Add a non-prefixed route that forwards to the API route
@app.route('/search-history', methods=['GET'])
def proxy_search_history():
    """Proxy for the search history endpoint without the /api prefix"""
    return get_search_history()

@app.route('/api/history', methods=['GET'])
def get_full_history():
    """Returns a detailed view of search history with formatted data"""
    # Get history from database
    history = get_search_history_from_db()

    formatted_history = []

    for item in history:
        formatted_item = {
            "date": item.get("timestamp", "Unknown Date"),
            "type": item.get("type", "Unknown Search Type"),
            "query": item.get("query", "Unknown Query"),
            "results_count": item.get("results_count", 0)
        }
        formatted_history.append(formatted_item)

    return jsonify({
        'count': len(formatted_history),
        'history': formatted_history
    })

# Add a non-prefixed route that forwards to the API route
@app.route('/history', methods=['GET'])
def proxy_history():
    """Proxy for the history endpoint without the /api prefix"""
    return get_full_history()

@app.route('/api/potential-partners-direct', methods=['GET'])
def get_partners_direct():
    """Get potential partners, with optional filtering by industry and search"""
    try:
        all_partners = get_potential_partners()

        # Handle search parameter
        search_query = request.args.get('search', '').lower()

        # Handle industry filter
        industry_filter = request.args.get('industry', '').lower()

        # Handle sorting
        sort_by = request.args.get('sort', 'score').lower()
        sort_order = request.args.get('order', 'desc').lower()

        # Apply filtering and sorting
        filtered_partners = all_partners

        # Apply industry filter if provided
        if industry_filter:
            filtered_partners = [p for p in filtered_partners if p.get('industry', '').lower() == industry_filter]

        # Apply search filter if provided
        if search_query:
            search_results = []
            for partner in filtered_partners:
                # Search in name, description, and industry
                name = partner.get('name', '').lower()
                description = partner.get('description', '').lower()
                industry = partner.get('industry', '').lower()

                # Also search in leadership, products, and opportunities
                leadership_text = ' '.join([str(leader) for leader in partner.get('leadership', [])]).lower()
                products_text = ' '.join([str(product) for product in partner.get('products', [])]).lower()
                opportunities_text = ' '.join([str(opp) for opp in partner.get('opportunities', [])]).lower()

                # Check if search query exists in any of these fields
                if (search_query in name or
                    search_query in description or
                    search_query in industry or
                    search_query in leadership_text or
                    search_query in products_text or
                    search_query in opportunities_text):
                    search_results.append(partner)

            filtered_partners = search_results

        # Apply sorting
        if sort_by == 'score':
            filtered_partners.sort(key=lambda x: float(x.get('score', 0)), reverse=(sort_order == 'desc'))
        elif sort_by == 'name':
            filtered_partners.sort(key=lambda x: x.get('name', '').lower(), reverse=(sort_order == 'desc'))
        elif sort_by == 'date':
            filtered_partners.sort(key=lambda x: x.get('created_at', ''), reverse=(sort_order == 'desc'))
        elif sort_by == 'industry':
            filtered_partners.sort(key=lambda x: x.get('industry', '').lower(), reverse=(sort_order == 'desc'))

        # Get counts for response metadata
        total_count = len(all_partners)
        filtered_count = len(filtered_partners)

        # Get unique industries for filters
        industries = sorted(list(set([p.get('industry', '') for p in all_partners if p.get('industry')])))

        # Format response with metadata
        response = {
            'partners': filtered_partners,
            'metadata': {
                'total_count': total_count,
                'filtered_count': filtered_count,
                'industries': industries,
                'search_query': search_query,
                'industry_filter': industry_filter,
                'sort_by': sort_by,
                'sort_order': sort_order
            }
        }

        return jsonify(response)
    except Exception as e:
        print(f"Error retrieving partners: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Add an endpoint to clear the potential partners database
@app.route('/api/clear-potential-partners', methods=['POST'])
def clear_partners():
    """Clear all potential partners from the database (Supabase)"""
    if not supabase:
        print("Error: Supabase client not available.")
        return jsonify({
            'success': False,
            'message': 'Supabase client not available'
        }), 500

    try:
        # Delete all records from potential_partners table
        supabase.table('potential_partners').delete().execute()

        return jsonify({
            'success': True,
            'message': 'All potential partners have been removed from the database'
        })
    except Exception as e:
        print(f"Error clearing potential partners from Supabase: {str(e)}")
        traceback.print_exc() # Print stack trace for debugging
        return jsonify({
            'success': False,
            'message': f'Error clearing potential partners: {str(e)}'
        }), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get statistics about the database (Supabase)"""
    if not supabase:
        print("Error: Supabase client not available.")
        return jsonify({
            'error': 'Supabase client not available'
        }), 500

    try:
        # Get count of previously considered companies
        considered_response = supabase.table('previously_considered').select('count', count='exact').execute()
        considered_count = considered_response.count if hasattr(considered_response, 'count') else 0

        # Get count of potential partners
        partners_response = supabase.table('potential_partners').select('count', count='exact').execute()
        partners_count = partners_response.count if hasattr(partners_response, 'count') else 0

        # Get average score of potential partners
        avg_score_response = supabase.table('potential_partners').select('score').execute()
        scores = [row.get('score', 0) for row in avg_score_response.data if row.get('score') is not None]
        avg_score = round(sum(scores) / len(scores), 2) if scores else 0

        # Get top 5 highest-scored potential partners
        top_partners_response = supabase.table('potential_partners').select('name, score').order('score', desc=True).limit(5).execute()
        top_partners = [{"name": row.get('name'), "score": row.get('score')} for row in top_partners_response.data]

        # Get count of searches
        search_response = supabase.table('search_history').select('count', count='exact').execute()
        search_count = search_response.count if hasattr(search_response, 'count') else 0

        # Get industry breakdown - this is more complex in Supabase without direct SQL
        # We'll fetch all industries and process them manually
        industry_response = supabase.table('potential_partners').select('industry, score').execute()

        # Process industry data manually
        industry_dict = {}
        for row in industry_response.data:
            industry = row.get('industry') or 'Unknown'
            score = row.get('score', 0) or 0

            if industry not in industry_dict:
                industry_dict[industry] = {'count': 0, 'total_score': 0}

            industry_dict[industry]['count'] += 1
            industry_dict[industry]['total_score'] += score

        # Calculate averages and format
        top_industries = []
        for industry, data in industry_dict.items():
            avg_score = round(data['total_score'] / data['count'], 2) if data['count'] > 0 else 0
            top_industries.append({
                'industry': industry,
                'count': data['count'],
                'avg_score': avg_score
            })

        # Sort by count and limit to top 5
        top_industries.sort(key=lambda x: x['count'], reverse=True)
        top_industries = top_industries[:5]

        return jsonify({
            'considered_companies': considered_count,
            'potential_partners': partners_count,
            'average_partner_score': avg_score,
            'top_partners': top_partners,
            'searches_performed': search_count,
            'top_industries': top_industries
        })
    except Exception as e:
        print(f"Error getting database stats from Supabase: {str(e)}")
        traceback.print_exc() # Print stack trace for debugging
        return jsonify({
            'error': f'Error getting stats: {str(e)}'
        }), 500

@app.route('/api/top-partners', methods=['GET'])
def get_top_partners():
    """Get top-scoring potential partners"""
    try:
        # Get all partners and sort by score
        all_partners = get_potential_partners()

        # Get the limit parameter, default to 5
        limit = request.args.get('limit', '5')
        try:
            limit = int(limit)
            # Ensure limit is a reasonable number
            if limit < 1:
                limit = 5
            elif limit > 50:
                limit = 50
        except ValueError:
            limit = 5

        # Get top partners by score
        top_partners = all_partners[:limit]

        # Format the response with additional metadata
        response = {
            'top_partners': top_partners,
            'metadata': {
                'total_partners': len(all_partners),
                'limit': limit
            }
        }

        return jsonify(response)
    except Exception as e:
        print(f"Error retrieving top partners: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/current-partners', methods=['GET'])
def get_current_partners():
    """Get the list of current partners"""
    try:
        # Get category filter if provided
        category_filter = request.args.get('category', '').lower()

        # Apply filtering if category is provided
        if category_filter:
            filtered_partners = [p for p in CURRENT_PARTNERS if p.get('category', '').lower() == category_filter]
        else:
            filtered_partners = CURRENT_PARTNERS

        # Get unique categories for filtering
        categories = sorted(list(set([p.get('category', '') for p in CURRENT_PARTNERS if p.get('category')])))

        # Format response with metadata
        response = {
            'current_partners': filtered_partners,
            'metadata': {
                'total_count': len(CURRENT_PARTNERS),
                'filtered_count': len(filtered_partners),
                'categories': categories
            }
        }

        return jsonify(response)
    except Exception as e:
        print(f"Error retrieving current partners: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/search-partners', methods=['GET'])
def search_partners():
    """Search through saved potential partners"""
    try:
        # Get query parameters
        query = request.args.get('q', '').lower()
        min_score = request.args.get('min_score', 0, type=float)
        industry = request.args.get('industry', '')
        sort_order = request.args.get('sort_order', 'desc').lower()

        # Get all partners from database
        partners = get_potential_partners()

        # Filter partners based on search criteria
        filtered_partners = []
        for partner in partners:
            # Filter by minimum score
            if float(partner.get('score', 0)) < min_score:
                continue

            # Filter by industry if specified
            if industry and industry.lower() not in partner.get('industry', '').lower():
                continue

            # Filter by search query
            if query:
                # Search in name, description, and industry
                name = partner.get('name', '').lower()
                description = partner.get('description', '').lower()
                partner_industry = partner.get('industry', '').lower()

                # Also search in leadership, products, and opportunities
                leadership_text = ' '.join([str(leader) for leader in partner.get('leadership', [])]).lower()
                products_text = ' '.join([str(product) for product in partner.get('products', [])]).lower()
                opportunities_text = ' '.join([str(opp) for opp in partner.get('opportunities', [])]).lower()

                # Combine all searchable text
                searchable_text = f"{name} {description} {partner_industry} {leadership_text} {products_text} {opportunities_text}"

                if query not in searchable_text:
                    continue

            # Partner passed all filters
            filtered_partners.append(partner)

        # Always sort by score by default (highest first)
        filtered_partners.sort(key=lambda x: float(x.get('score', 0)), reverse=(sort_order == 'desc'))

        # Get unique industries for filters
        all_industries = sorted(list(set([p.get('industry', '') for p in partners if p.get('industry')])))

        return jsonify({
            'partners': filtered_partners,
            'metadata': {
                'total_count': len(partners),
                'filtered_count': len(filtered_partners),
                'search_criteria': {
                    'query': query,
                    'min_score': min_score,
                    'industry': industry,
                    'sort_order': sort_order
                },
                'available_industries': all_industries
            }
        })
    except Exception as e:
        print(f"Error searching partners: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/partners-by-industry', methods=['GET'])
def get_partners_by_industry():
    """Get counts of partners by industry (Supabase)"""
    if not supabase:
        print("Error: Supabase client not available.")
        return jsonify({'error': 'Supabase client not available'}), 500

    try:
        # Get all industries from potential_partners table
        response = supabase.table('potential_partners').select('industry').execute()

        # Count occurrences of each industry
        industry_counts = {}
        for row in response.data:
            industry = row.get('industry')
            if not industry:
                industry = 'Unknown'

            if industry in industry_counts:
                industry_counts[industry] += 1
            else:
                industry_counts[industry] = 1

        # Convert to list of dictionaries
        result = [{'industry': industry, 'count': count} for industry, count in industry_counts.items()]

        # Sort by count in descending order
        result.sort(key=lambda x: x['count'], reverse=True)

        return jsonify(result)
    except Exception as e:
        print(f"Error getting partners by industry from Supabase: {str(e)}")
        traceback.print_exc() # Print stack trace for debugging
        return jsonify({'error': str(e)}), 500

@app.route('/api/company-details', methods=['POST'])
def get_company_details():
    try:
        # Get the company data from the request
        company_data = request.json

        if not company_data or not company_data.get('name'):
            return jsonify({'error': 'Company name is required'}), 400

        company_name = company_data.get('name')
        print(f"Fetching details for company: {company_name}")

        # Fetch Coresignal data (or mock data if not available)
        coresignal_data = fetch_coresignal_data(company_name)

        # We don't need LinkedIn data anymore since we're using the LinkedIn Data API for Coresignal data
        linkedin_data = {}

        # Combine the data
        company_details = {
            "name": company_name,
            "coresignal_data": coresignal_data,
            "linkedin_data": linkedin_data,
            "enriched": True  # Mark this company as enriched with additional data
        }

        # If original company data has additional fields, preserve them
        for key, value in company_data.items():
            if key not in company_details and key != "name":
                company_details[key] = value

        # Set partnership_score if not already defined
        if 'partnership_score' not in company_details and 'partnership_score' in company_data:
            company_details['partnership_score'] = float(company_data['partnership_score'])
        # Remove the default value of 5.0 - always use the original score

        # Always ensure has_competition field exists
        if 'has_competition' not in company_details and 'has_competition' in company_data:
            company_details['has_competition'] = bool(company_data['has_competition'])
        elif 'competes_with_partners' in company_data:
            company_details['has_competition'] = bool(company_data['competes_with_partners'])
        else:
            company_details['has_competition'] = False

        # If company competes with partners, add the details of competing partners
        # including their logo URLs for display
        if (company_details.get('has_competition') or company_details.get('competes_with_partners')) and \
           'competing_partners' in company_data and isinstance(company_data['competing_partners'], list):
            competing_partners = []
            partner_logos = {}

            # Generate a logo URL for each competing partner
            for partner in company_data['competing_partners']:
                if partner:
                    partner_logo = generate_logo(partner)
                    partner_logos[partner] = partner_logo
                    competing_partners.append({
                        "name": partner,
                        "logo": partner_logo
                    })

            company_details['competing_partners_details'] = competing_partners
            company_details['competing_partners_logos'] = partner_logos

        print(f"Successfully enriched data for {company_name}")
        return jsonify(company_details)
    except Exception as e:
        print(f"Error fetching company details: {str(e)}")
        traceback.print_exc()

        # Return minimal data if we have a company name
        if company_data and company_data.get('name'):
            fallback_data = {
                "name": company_data.get('name'),
                "description": "Company data unavailable at this time.",
                "enriched": False,
                "error": str(e)
            }

            # Copy any existing fields, ensuring we keep the original partnership_score
            for key, value in company_data.items():
                if key not in fallback_data and key != "name":
                    # Convert partnership_score to float for consistency
                    if key == 'partnership_score' and value is not None:
                        fallback_data[key] = float(value)
                    else:
                        fallback_data[key] = value

            return jsonify(fallback_data)
        else:
            return jsonify({'error': str(e)}), 500

# Function to fetch company data from Coresignal (replaced with LinkedIn Data API)
def fetch_coresignal_data(company_name):
    """
    Fetch company data from LinkedIn Data API via RapidAPI
    If API access is not available, generate realistic mock data
    """
    print(f"Attempting to fetch company data for {company_name} using LinkedIn Data API")

    # Check if RapidAPI key is available
    rapidapi_key = os.environ.get("RAPIDAPI_KEY")
    print(f"RapidAPI key found: {bool(rapidapi_key)}")

    if rapidapi_key:
        try:
            # Format company name for API query
            formatted_company_name = company_name.lower().replace(' ', '')
            print(f"Formatted company name for API query: {formatted_company_name}")

            # Configure RapidAPI request for LinkedIn Data API
            url = f"https://linkedin-data-api.p.rapidapi.com/get-company-insights"
            querystring = {"username": formatted_company_name}
            headers = {
                "X-RapidAPI-Key": rapidapi_key,
                "X-RapidAPI-Host": "linkedin-data-api.p.rapidapi.com"
            }

            print(f"Making API request to: {url}")
            # Make the API request
            response = requests.get(url, headers=headers, params=querystring)

            # Check if the request was successful
            print(f"API response status code: {response.status_code}")
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"API response contains success: {data.get('success', False)}")
                    print(f"API response contains data key: {bool(data.get('data'))}")

                    # Check if we got valid data
                    if data.get("success") and data.get("data"):
                        company_data = data.get("data", {})

                        # Format the data to match the expected Coresignal format
                        coresignal_data = {
                            "company_details": {
                                "name": company_data.get("name", company_name),
                                "website": company_data.get("website", ""),
                                "headquarters": "",
                                "size": company_data.get("staffCountRange", ""),
                                "industry": ", ".join(company_data.get("industries", [])) if company_data.get("industries") else "",
                                "founded": company_data.get("founded", ""),
                                "company_type": company_data.get("type", ""),
                                "description": company_data.get("description", "")
                            },
                            "leadership": {
                                "executives": []
                            },
                            "products_and_services": []
                        }

                        # Format headquarters
                        if company_data.get("headquarter"):
                            hq = company_data.get("headquarter")
                            hq_parts = []
                            if hq.get("city"):
                                hq_parts.append(hq.get("city"))
                            if hq.get("geographicArea"):
                                hq_parts.append(hq.get("geographicArea"))
                            if hq.get("country"):
                                hq_parts.append(hq.get("country"))
                            coresignal_data["company_details"]["headquarters"] = ", ".join(hq_parts)

                        # Add specialties as products/services
                        if company_data.get("specialities"):
                            for specialty in company_data.get("specialities", []):
                                coresignal_data["products_and_services"].append({
                                    "name": specialty,
                                    "description": ""
                                })

                        # Add logo
                        if company_data.get("Images") and company_data.get("Images").get("logo"):
                            coresignal_data["company_details"]["logo"] = company_data.get("Images").get("logo")

                        print(f"Successfully created company data object")
                        return coresignal_data
                    else:
                        print(f"Invalid or empty data in API response: {data}")
                except Exception as e:
                    print(f"Error parsing API response: {str(e)}")
                    print(f"Raw response content: {response.text[:500]}...")
            else:
                print(f"API request failed with status {response.status_code}: {response.text[:500]}...")
            # Don't fall back to mock data, return error information instead
            return {"error": f"API request failed with status {response.status_code}", "company_name": company_name}

        except Exception as e:
            print(f"Error fetching company data: {str(e)}")
            print(f"Stack trace: {traceback.format_exc()}")
            return {"error": f"Exception while fetching data: {str(e)}", "company_name": company_name}
    else:
        print(f"RapidAPI key not available for {company_name}")
        return {"error": "No RapidAPI key available", "company_name": company_name}

def generate_mock_coresignal_data(company_name):
    """Generate mock Coresignal data for a company"""
    import random

    print(f"Generating mock Coresignal data for {company_name}")

    try:
        # Generate consistent random data based on company name
        seed = sum(ord(c) for c in company_name)
        random.seed(seed)

        # Create domain name from company name
        formatted_company_name = company_name.lower().replace(' ', '')

        # Generate mock logo URL
        logo_url = f"https://logo.clearbit.com/{formatted_company_name}.com"

        # Generate industries
        industries = [
            "Software Development", "Information Technology", "Financial Services",
            "Healthcare", "Retail", "Manufacturing", "E-commerce", "Consulting",
            "Telecommunications", "Media", "Marketing", "Education"
        ]
        industry = random.choice(industries)

        # Generate specialties/products
        all_specialties = [
            "Artificial Intelligence", "Machine Learning", "Cloud Computing", "Data Analytics",
            "Digital Transformation", "Customer Experience", "Cybersecurity", "Business Intelligence",
            "Mobile Applications", "E-commerce", "Digital Marketing", "SaaS", "IoT", "Blockchain",
            "Healthcare IT", "EdTech", "FinTech", "Supply Chain", "Human Resources", "Consulting"
        ]

        # Select 3-6 random specialties for products
        num_products = random.randint(3, 6)
        products = []
        for specialty in random.sample(all_specialties, num_products):
            products.append({
                "name": specialty,
                "description": f"Leading {specialty.lower()} solutions for enterprise customers."
            })

        # Generate employee count/size
        employee_ranges = ["1-10", "11-50", "51-200", "201-500", "501-1,000", "1,001-5,000", "5,001-10,000", "10,001+"]
        size_range = random.choices(employee_ranges, weights=[0.05, 0.1, 0.2, 0.25, 0.2, 0.1, 0.05, 0.05])[0]

        # Generate founding year
        founding_year = random.randint(1950, 2020)

        # Generate company type
        company_types = ["Private Company", "Public Company", "Nonprofit", "Educational Institution", "Self-Employed", "Government Agency", "Sole Proprietorship"]
        company_type = random.choice(company_types)

        # Generate locations
        all_locations = [
            {"city": "San Francisco", "state": "CA", "country": "US"},
            {"city": "New York", "state": "NY", "country": "US"},
            {"city": "London", "state": "England", "country": "GB"},
            {"city": "Toronto", "state": "ON", "country": "CA"},
            {"city": "Sydney", "state": "NSW", "country": "AU"},
            {"city": "Berlin", "state": "BE", "country": "DE"},
            {"city": "Singapore", "state": "Singapore", "country": "SG"},
            {"city": "Tokyo", "state": "Tokyo", "country": "JP"},
            {"city": "Paris", "state": "IdF", "country": "FR"},
            {"city": "Austin", "state": "TX", "country": "US"}
        ]

        # Select headquarters
        hq = random.choice(all_locations)
        headquarters = f"{hq['city']}, {hq['state']}, {hq['country']}"

        # Generate executives
        executive_titles = ["CEO", "CTO", "CFO", "COO", "CMO", "CIO"]
        executive_names = ["John Smith", "Maria Rodriguez", "David Johnson", "Sarah Lee", "Michael Chen", "Emma Wilson"]

        executives = []
        for i in range(min(3, len(executive_titles))):
            executives.append({
                "name": random.choice(executive_names),
                "title": executive_titles[i]
            })

        # Generate description
        descriptions = [
            f"{company_name} is a leading provider of innovative solutions in the {industry.lower()} industry. "
            f"Founded in {founding_year}, we've grown to become a trusted partner for organizations worldwide.",

            f"At {company_name}, we're passionate about solving the most challenging problems in {industry.lower()}. "
            f"Since {founding_year}, we've been at the forefront of innovation, constantly pushing boundaries and setting new standards.",

            f"{company_name} was founded in {founding_year} with a simple mission: to make {industry.lower()} more accessible and effective. "
            f"Today, we're a {company_type.lower()} serving clients across {random.randint(10, 100)}+ countries with dedication and passion."
        ]

        # Create final mock Coresignal data
        coresignal_data = {
            "company_details": {
                "name": company_name,
                "website": f"https://{formatted_company_name}.com",
                "headquarters": headquarters,
                "size": size_range,
                "industry": industry,
                "founded": str(founding_year),
                "company_type": company_type,
                "description": random.choice(descriptions),
                "logo": logo_url
            },
            "leadership": {
                "executives": executives
            },
            "products_and_services": products
        }

        return coresignal_data
    except Exception as e:
        print(f"Error generating mock Coresignal data: {str(e)}")
        return None

# Function to save company research data
def save_company_research(company_name, research_data, source):
    """Save company research data to the database (Supabase)

    Args:
        company_name (str): The name of the company
        research_data (str): Research data in JSON or text format
        source (str): Source of the research data (e.g. 'deepseek', 'perplexity')

    Returns:
        bool: True if saving was successful, False otherwise
    """
    if not supabase:
        print("Error: Supabase client not available.")
        return False

    try:
        # Normalize company name to avoid inconsistencies
        company_name = company_name.strip() if company_name else ""

        if not company_name or not research_data or not source:
            print(f"Error: Missing data for save_company_research: company={company_name}, data_length={len(research_data) if research_data else 0}, source={source}")
            return False

        # Store research data as JSON string if it's a dict
        if isinstance(research_data, dict):
            research_data_str = json.dumps(research_data)
        else:
            research_data_str = str(research_data)

        print(f"Saving research for {company_name} from {source}, data length: {len(research_data_str)}")

        # Check if company research already exists
        existing_response = supabase.table('company_research').select('id').eq('company_name', company_name).execute()


        if existing_response.data and len(existing_response.data) > 0:
            # Update existing record
            current_timestamp = datetime.now().isoformat()
            supabase.table('company_research').update({
                'research_data': research_data_str,
                'source': source,
                'updated_at': current_timestamp
            }).eq('company_name', company_name).execute()
            print(f"Updated existing research for: {company_name}")
        else:
            # Insert new record
            current_timestamp = datetime.now().isoformat()
            supabase.table('company_research').insert({
                'company_name': company_name,
                'research_data': research_data_str,
                'source': source,
                'created_at': current_timestamp,
                'updated_at': current_timestamp
            }).execute()
            print(f"Saved new research for: {company_name} from {source}")

        return True

    except Exception as e:
        print(f"Error saving company research to Supabase: {e}")
        traceback.print_exc() # Print stack trace for debugging
        return False

# Function to get company research data
def get_company_research(company_name):
    """Get company research data from the database (Supabase)

    Args:
        company_name (str): The name of the company

    Returns:
        dict: Research data with keys 'data', 'source', 'created_at', 'updated_at', 'company_name'
        or None if no research data found
    """
    if not supabase:
        print("Error: Supabase client not available.")
        return None

    try:
        # Normalize company name to ensure consistent lookup
        company_name = company_name.strip() if company_name else ""

        if not company_name:
            print("Error: Company name is required to get research")
            return None

        print(f"Getting research for company: '{company_name}'")

        # Get the research data
        response = supabase.table('company_research').select(
            'research_data, source, created_at, updated_at, company_name'
        ).eq('company_name', company_name).execute()

        if response.data and len(response.data) > 0:
            row = response.data[0]

            # Try to parse research_data as JSON if possible
            try:
                research_data = json.loads(row.get('research_data'))
            except (json.JSONDecodeError, TypeError):
                research_data = row.get('research_data')

            return {
                'data': research_data,
                'source': row.get('source'),
                'created_at': row.get('created_at'),
                'updated_at': row.get('updated_at'),
                'company_name': row.get('company_name')  # Include company name for verification
            }
        else:
            print(f"No research found for company: '{company_name}'")
            return None
    except Exception as e:
        print(f"Error retrieving company research from Supabase: {e}")
        traceback.print_exc()
        return None

def generate_research_pdf(company_name, research_data):
    """Generate a PDF with company research data in a modern dark theme

    Args:
        company_name (str): The name of the company
        research_data (dict): The research data to include in the PDF

    Returns:
        bytes: The PDF file as bytes
    """
    # Create a file-like buffer to receive PDF data
    buffer = io.BytesIO()

    # Set up the document with letter size page and 0.5 inch margins
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.5 * inch,
        leftMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch
    )

    # Register a custom font for modern appearance
    # Use default fonts if custom ones aren't available
    try:
        pdfmetrics.registerFont(TTFont('Roboto', 'Roboto-Regular.ttf'))
        pdfmetrics.registerFont(TTFont('RobotoBold', 'Roboto-Bold.ttf'))
        base_font = 'Roboto'
        bold_font = 'RobotoBold'
    except:
        base_font = 'Helvetica'
        bold_font = 'Helvetica-Bold'

    # Create styles for dark theme
    styles = getSampleStyleSheet()

    # Create custom paragraph styles
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Title'],
        fontName=bold_font,
        fontSize=28,
        leading=32,
        textColor=colors.white,
        alignment=1  # Center alignment
    )

    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontName=base_font,
        fontSize=14,
        leading=18,
        textColor=colors.Color(0.7, 0.7, 0.9),  # Light blue/purple
        alignment=1  # Center alignment
    )

    heading1_style = ParagraphStyle(
        'Heading1',
        parent=styles['Heading1'],
        fontName=bold_font,
        fontSize=18,
        leading=22,
        textColor=colors.white,
        spaceBefore=16,
        spaceAfter=8
    )

    heading2_style = ParagraphStyle(
        'Heading2',
        parent=styles['Heading2'],
        fontName=bold_font,
        fontSize=14,
        leading=18,
        textColor=colors.Color(0.5, 0.7, 1.0),  # Light blue
        spaceBefore=12,
        spaceAfter=6
    )

    normal_style = ParagraphStyle(
        'Normal',
        parent=styles['Normal'],
        fontName=base_font,
        fontSize=10,
        leading=14,
        textColor=colors.Color(0.9, 0.9, 0.9)  # Almost white
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=normal_style,
        leftIndent=20,
        firstLineIndent=-20,
    )

    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontName=base_font,
        fontSize=8,
        textColor=colors.Color(0.6, 0.6, 0.7),  # Muted purple
        alignment=1  # Center alignment
    )

    # Create elements for the PDF
    elements = []

    # Add a title page
    elements.append(Spacer(1, 2 * inch))  # Space at top of page
    elements.append(Paragraph(company_name.upper(), title_style))
    elements.append(Spacer(1, 0.25 * inch))
    elements.append(Paragraph("Company Research Report", subtitle_style))
    elements.append(Spacer(1, 2 * inch))

    # Try to add company logo if available
    logo_url = None
    if research_data and 'data' in research_data:
        data = research_data['data']
        if isinstance(data, dict) and 'logo' in data and data['logo']:
            logo_url = data['logo']

        # Also check the LinkedIn data if available
        if not logo_url and 'linkedin_data' in data and isinstance(data['linkedin_data'], dict):
            linkedin = data['linkedin_data']
            if 'logo' in linkedin and linkedin['logo']:
                logo_url = linkedin['logo']

    # Add logo if available
    if logo_url:
        try:
            # Download the logo image
            logo_response = requests.get(logo_url, timeout=5)
            if logo_response.status_code == 200:
                logo_data = io.BytesIO(logo_response.content)
                logo_img = Image(logo_data, width=2*inch, height=2*inch)
                logo_img.hAlign = 'CENTER'
                elements.append(logo_img)
        except Exception as e:
            print(f"Error adding logo to PDF: {str(e)}")

    # Add date and disclaimer
    elements.append(Spacer(1, 1 * inch))
    date_generated = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    elements.append(Paragraph(f"Generated on: {date_generated}", footer_style))
    elements.append(Spacer(1, 0.25 * inch))
    elements.append(Paragraph("CONFIDENTIAL RESEARCH REPORT", footer_style))

    # Add a page break
    elements.append(PageBreak())

    # Add table of contents header
    elements.append(Paragraph("CONTENTS", heading1_style))
    elements.append(Spacer(1, 0.25 * inch))

    # Simple table of contents
    toc_data = []
    if research_data and 'data' in research_data:
        data = research_data['data']

        toc_items = [
            ("Company Description", 2),
            ("Key Products & Services", 2),
            ("Leadership Team", 3),
            ("Partnership Opportunities", 3),
            ("Market Analysis", 4),
            ("Partnership Potential", 5)
        ]

        for item, page in toc_items:
            toc_data.append([Paragraph(item, normal_style), Paragraph(str(page), normal_style)])

    if toc_data:
        # Create table of contents
        toc_table = Table(toc_data, colWidths=[4*inch, 0.5*inch])
        toc_table.setStyle(TableStyle([
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('LINEABOVE', (0, 0), (-1, 0), 1, colors.Color(0.3, 0.3, 0.5)),
            ('LINEBELOW', (0, -1), (-1, -1), 1, colors.Color(0.3, 0.3, 0.5)),
        ]))
        elements.append(toc_table)

    # Add a page break before main content
    elements.append(PageBreak())

    # Add research data sections
    if research_data and 'data' in research_data:
        data = research_data['data']

        # Company description
        if isinstance(data, dict) and 'description' in data:
            elements.append(Paragraph("Company Description", heading1_style))
            elements.append(Paragraph(data['description'], normal_style))
            elements.append(Spacer(1, 0.25 * inch))

        # Key Products/Services
        if isinstance(data, dict) and 'key_products' in data and data['key_products']:
            elements.append(Paragraph("Key Products & Services", heading1_style))
            if isinstance(data['key_products'], list):
                for product in data['key_products']:
                    if isinstance(product, str):
                        elements.append(Paragraph(f"• {product}", bullet_style))
                    elif isinstance(product, dict) and 'name' in product:
                        elements.append(Paragraph(f"• {product['name']}", bullet_style))
            elements.append(Spacer(1, 0.25 * inch))

        # Leadership
        if isinstance(data, dict) and 'key_leadership' in data and data['key_leadership']:
            elements.append(Paragraph("Leadership Team", heading1_style))
            if isinstance(data['key_leadership'], list):
                for leader in data['key_leadership']:
                    if isinstance(leader, str):
                        elements.append(Paragraph(f"• {leader}", bullet_style))
                    elif isinstance(leader, dict) and 'name' in leader:
                        title = leader.get('title', '')
                        leader_text = f"• {leader['name']}"
                        if title:
                            leader_text += f" ({title})"
                        elements.append(Paragraph(leader_text, bullet_style))
            elements.append(Spacer(1, 0.25 * inch))

        # Partnership Opportunities
        if isinstance(data, dict) and 'partnership_opportunities' in data and data['partnership_opportunities']:
            elements.append(Paragraph("Partnership Opportunities", heading1_style))
            if isinstance(data['partnership_opportunities'], list):
                for opportunity in data['partnership_opportunities']:
                    elements.append(Paragraph(f"• {opportunity}", bullet_style))
            elements.append(Spacer(1, 0.25 * inch))

        # Market Analysis
        if isinstance(data, dict) and 'market_analysis' in data and data['market_analysis']:
            elements.append(Paragraph("Market Analysis", heading1_style))
            market = data['market_analysis']
            if isinstance(market, dict):
                for key, value in market.items():
                    if key and value:
                        formatted_key = key.replace('_', ' ').title()
                        elements.append(Paragraph(formatted_key, heading2_style))
                        elements.append(Paragraph(str(value), normal_style))
                        elements.append(Spacer(1, 0.15 * inch))
            elements.append(Spacer(1, 0.25 * inch))

        # Partnership Potential
        if isinstance(data, dict) and 'partnership_potential' in data and data['partnership_potential']:
            elements.append(Paragraph("Partnership Potential", heading1_style))
            potential = data['partnership_potential']
            if isinstance(potential, dict):
                for key, value in potential.items():
                    if key and value:
                        formatted_key = key.replace('_', ' ').title()
                        elements.append(Paragraph(formatted_key, heading2_style))
                        elements.append(Paragraph(str(value), normal_style))
                        elements.append(Spacer(1, 0.15 * inch))

        # Include other important fields that may be available
        if isinstance(data, dict):
            # Website
            if 'website' in data and data['website']:
                elements.append(Paragraph("Website", heading1_style))
                elements.append(Paragraph(data['website'], normal_style))
                elements.append(Spacer(1, 0.25 * inch))

            # Headquarters
            if 'hq_location' in data and data['hq_location']:
                elements.append(Paragraph("Headquarters", heading1_style))
                elements.append(Paragraph(data['hq_location'], normal_style))
                elements.append(Spacer(1, 0.25 * inch))

            # Company Size
            if 'size_range' in data and data['size_range']:
                elements.append(Paragraph("Company Size", heading1_style))
                elements.append(Paragraph(data['size_range'], normal_style))
                elements.append(Spacer(1, 0.25 * inch))

    # Add a background to each page
    def add_dark_background(canvas, doc):
        # Save the canvas state
        canvas.saveState()

        # Set the fill color to a dark blue/gray color - more pleasant dark theme
        canvas.setFillColor(colors.Color(0.12, 0.14, 0.25))

        # Draw a rectangle that covers the entire page
        canvas.rect(
            0,
            0,
            letter[0],  # width of the page
            letter[1],  # height of the page
            fill=True
        )

        # Add a footer with page number to each page
        canvas.setFont(base_font, 8)
        canvas.setFillColor(colors.Color(0.6, 0.6, 0.7))  # Light gray/purple
        page_num = canvas.getPageNumber()
        text = f"Page {page_num}"
        canvas.drawCentredString(letter[0]/2, 0.25*inch, text)

        # Restore the canvas state
        canvas.restoreState()

    # Build the PDF with the dark background on every page
    doc.build(elements, onFirstPage=add_dark_background, onLaterPages=add_dark_background)

    # Get the PDF data from the buffer
    pdf_data = buffer.getvalue()
    buffer.close()

    return pdf_data

@app.route('/api/company-research', methods=['POST'])
def save_research_endpoint():
    """API endpoint to save company research data"""
    try:
        data = request.json

        if not data or not data.get('company_name'):
            return jsonify({'error': 'Company name is required'}), 400

        company_name = data.get('company_name')
        research_data = data.get('research_data')
        source = data.get('source', 'unknown')

        if not research_data:
            return jsonify({'error': 'Research data is required'}), 400

        success = save_company_research(company_name, research_data, source)

        if success:
            return jsonify({'success': True, 'message': f'Research saved for {company_name}'})
        else:
            return jsonify({'success': False, 'error': 'Failed to save research data'}), 500

    except Exception as e:
        print(f"Error saving research data: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/company-research/<company_name>', methods=['GET'])
def get_research_endpoint(company_name):
    """API endpoint to get company research data"""
    try:
        if not company_name:
            return jsonify({'error': 'Company name is required'}), 400

        # URL decode the company name
        company_name = company_name.replace('%20', ' ').strip()
        print(f"API: Retrieving research for: '{company_name}'")

        # Check if refresh is requested
        refresh_requested = request.args.get('refresh', 'false').lower() == 'true'

        # Get research data
        research = get_company_research(company_name)

        # If refresh is requested and no research exists, or refresh is explicitly requested
        if not research or refresh_requested:
            print(f"Research refresh requested for '{company_name}'")
            # Here you would typically trigger the research generation process
            # For now, we'll just return what we have (or don't have)
            # In a real implementation, you would call your research generation function

            # Mock: If this was a real implementation, you would add research generation code here
            # Example: research = generate_research_for_company(company_name)

            # If we still don't have research after attempting to generate it
            if not research:
                return jsonify({
                    'success': False,
                    'company_name': company_name,  # Include exact company name for verification
                    'message': f"No research found for '{company_name}', refresh was {'requested' if refresh_requested else 'not requested'}"
                }), 404

        # Return the research data
        return jsonify({
            'success': True,
            'company_name': company_name,  # The requested company name
            'research': research,
            'refreshed': refresh_requested,
            'research_company_name': research.get('company_name') if research else None  # The company name from the database
        })

    except Exception as e:
        print(f"Error retrieving research data: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e), 'company_name': company_name}), 500

@app.route('/api/company-research/<company_name>/export-pdf', methods=['GET'])
def export_research_pdf_endpoint(company_name):
    """API endpoint to export company research data as PDF"""
    try:
        if not company_name:
            return jsonify({'error': 'Company name is required'}), 400

        # URL decode the company name
        company_name = company_name.replace('%20', ' ').strip()
        print(f"API: Exporting PDF research for: '{company_name}'")

        # Get research data
        research = get_company_research(company_name)

        # If no research data found
        if not research:
            return jsonify({
                'success': False,
                'company_name': company_name,
                'message': f"No research found for '{company_name}'"
            }), 404

        # Generate PDF from research data
        pdf_data = generate_research_pdf(company_name, research)

        # Create a response with the PDF data
        filename = f"{company_name.replace(' ', '_')}_Research.pdf"

        # Set up the response to send the file
        response = send_file(
            io.BytesIO(pdf_data),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )

        return response

    except Exception as e:
        print(f"Error exporting research data as PDF: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e), 'company_name': company_name}), 500

@app.route('/api/api-healthcheck', methods=['GET'])
def api_healthcheck():
    """Check if the API keys are valid and services are operational"""
    try:
        results = {
            'api_server': True
        }

        # Check Perplexity API
        perplexity_api_key = os.getenv('PERPLEXITY_API_KEY', '')
        perplexity_api_url = os.getenv('PERPLEXITY_API_URL', 'https://api.perplexity.ai')

        print(f"API Healthcheck - PERPLEXITY_API_KEY: {perplexity_api_key[:5]}...")

        if perplexity_api_key:
            try:
                # Make a minimal API call to check if the key is valid
                headers = {
                    'Authorization': f'Bearer {perplexity_api_key}',
                    'Content-Type': 'application/json'
                }

                # Simple validation request with a valid model
                test_payload = {
                    "model": "sonar-pro",
                    "messages": [
                        {"role": "system", "content": "You are a helpful assistant."},
                        {"role": "user", "content": "Hello, just checking connection."}
                    ],
                    "max_tokens": 10
                }

                print(f"Making API test call with model: {test_payload['model']}")

                response = requests.post(
                    f"{perplexity_api_url}/chat/completions",
                    headers=headers,
                    json=test_payload,
                    timeout=5  # Short timeout for healthcheck
                )

                if response.status_code == 200:
                    results['perplexity_api'] = True
                    results['perplexity_model'] = test_payload['model']
                    results['perplexity_status'] = 'operational'
                else:
                    results['perplexity_api'] = False
                    results['perplexity_status'] = 'error'
                    results['perplexity_model'] = test_payload['model']
                    results['perplexity_error'] = f"Status code: {response.status_code}, Error: {response.text[:200]}"
                    print(f"API test failed: {response.text[:300]}")
            except Exception as e:
                results['perplexity_api'] = False
                results['perplexity_status'] = 'error'
                results['perplexity_error'] = str(e)
                results['perplexity_error_type'] = type(e).__name__
                print(f"Exception in API test: {str(e)}")
                traceback.print_exc()
        else:
            results['perplexity_api'] = False
            results['perplexity_status'] = 'not_configured'
            results['perplexity_error'] = "API key not configured"
            print("API key not configured")

        # Return all health check results
        return jsonify(results)
    except Exception as e:
        print(f"API healthcheck exception: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'api_server': False,
            'perplexity_api': False,
            'perplexity_status': 'error',
            'perplexity_error': str(e),
            'perplexity_error_type': type(e).__name__,
            'error': str(e)
        }), 500

@app.route('/api/perplexity-proxy', methods=['POST'])
def perplexity_proxy():
    """Proxy endpoint for Perplexity API calls"""
    try:
        # Get request data
        request_data = request.json
        endpoint = request_data.get('endpoint')
        data = request_data.get('data')

        if not endpoint or not data:
            return jsonify({
                'success': False,
                'message': 'Missing endpoint or data in request'
            }), 400

        # Get API key from environment
        perplexity_api_key = os.environ.get('PERPLEXITY_API_KEY')
        perplexity_api_url = os.environ.get('PERPLEXITY_API_URL', 'https://api.perplexity.ai')

        if not perplexity_api_key:
            return jsonify({
                'success': False,
                'message': 'Perplexity API key not configured on server'
            }), 500

        # Make the request to Perplexity API
        headers = {
            'Authorization': f'Bearer {perplexity_api_key}',
            'Content-Type': 'application/json'
        }

        print(f"Making proxy request to Perplexity API: {perplexity_api_url}{endpoint}")
        print(f"Request payload: {json.dumps(data, indent=2)}")

        response = requests.post(
            f"{perplexity_api_url}{endpoint}",
            headers=headers,
            json=data,
            timeout=60  # 60 second timeout
        )

        # Return the response from Perplexity API
        return jsonify(response.json()), response.status_code
    except Exception as e:
        print(f"Error in Perplexity API proxy: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error in Perplexity API proxy: {str(e)}'
        }), 500

@app.route('/api/test-perplexity', methods=['GET'])
def test_perplexity_endpoint():
    """Test endpoint for Perplexity API"""
    try:
        import requests

        # Get API key from environment
        perplexity_api_key = os.environ.get('PERPLEXITY_API_KEY')

        if not perplexity_api_key:
            return jsonify({
                'success': False,
                'message': 'Perplexity API key not configured'
            }), 500

        # Test the Perplexity API
        headers = {
            'Authorization': f'Bearer {perplexity_api_key}',
            'Content-Type': 'application/json'
        }

        payload = {
            'model': 'sonar-pro',
            'messages': [
                {
                    'role': 'user',
                    'content': 'Hello, this is a test message. Please respond with "Perplexity API is working!"'
                }
            ],
            'temperature': 0.1,
            'max_tokens': 100
        }

        response = requests.post(
            'https://api.perplexity.ai/chat/completions',
            headers=headers,
            json=payload
        )

        if response.status_code == 200:
            return jsonify({
                'success': True,
                'message': 'Perplexity API is working correctly',
                'status_code': response.status_code,
                'response': response.json()
            })
        else:
            return jsonify({
                'success': False,
                'message': f'Perplexity API returned status {response.status_code}',
                'status_code': response.status_code,
                'response': response.json() if response.text else None
            }), 500
    except Exception as e:
        print(f"Error testing Perplexity API: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error testing Perplexity API: {str(e)}'
        }), 500

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Test endpoint to verify Flask is running"""
    return jsonify({
        'status': 'success',
        'message': 'Flask server is running',
        'static_folder': app.static_folder,
        'static_folder_exists': os.path.exists(app.static_folder),
        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

@app.route('/scoring-criteria', methods=['GET'])
@app.route('/api/scoring-criteria', methods=['GET'])  # Add API prefixed route
def get_scoring_criteria():
    """Return the scoring criteria used for partnership evaluation"""
    try:
        # Format the scoring criteria for better readability
        formatted_criteria = {}
        for key, value in SCORING_CRITERIA.items():
            formatted_criteria[key] = value

        # Create a human-readable prompt from the criteria
        criteria_text = "\n\n".join([
            f"{value['name']} (Max: {value['max_points']} points)\n" +
            ("\n".join([f"- {c['points']} points: {c['description']}" for c in value['criteria']]))
            for key, value in SCORING_CRITERIA.items()
        ])

        scoring_prompt = f"Scoring Criteria for Partnership Evaluation:\n\n{criteria_text}"

        return jsonify({
            'status': 'success',
            'scoring_criteria': SCORING_CRITERIA,
            'max_total_score': MAX_TOTAL_SCORE,
            'scoring_prompt': scoring_prompt
        })
    except Exception as e:
        print(f"Error retrieving scoring criteria: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"Error retrieving scoring criteria: {str(e)}"
        }), 500

# Serve frontend static files
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    print(f"Serving path: {path}")
    if path and path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        print(f"Serving file: {path}")
        return send_from_directory(app.static_folder, path)
    else:
        print(f"Serving index.html for path: {path}")
        try:
            return send_from_directory(app.static_folder, 'index.html')
        except Exception as e:
            print(f"Error serving index.html: {str(e)}")
            return f"Error serving React app: {str(e)}", 500

# Entry point for Vercel
app.debug = True  # Enable debug for troubleshooting
if __name__ == '__main__':
    # Set up command line argument parsing
    parser = argparse.ArgumentParser(description='MLSE Partnership Analyzer')
    parser.add_argument('--port', type=int, default=5020, help='Port to run the server on')
    args = parser.parse_args()

    # Use the port from command line arguments or environment variable
    port = args.port or int(os.environ.get('PORT', 5020))
    print(f"Starting Flask server on port {port}")
    app.run(host='0.0.0.0', port=port)
