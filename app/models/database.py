import os
from supabase import create_client, Client
import traceback

# --- Supabase Setup ---
def initialize_supabase():
    """Initialize and return the Supabase client"""
    # Use Project URL and Anon Key from environment variables
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_ANON_KEY")

    # Initialize client only if URL and Key are present
    if supabase_url and supabase_key:
        try:
            supabase: Client = create_client(supabase_url, supabase_key)
            print("Supabase client initialized successfully.")
            return supabase
        except Exception as e:
            print(f"Error initializing Supabase client: {e}")
            traceback.print_exc()  # Print stack trace for debugging
            return None  # Set client to None on error
    else:
        print("Warning: SUPABASE_URL or SUPABASE_ANON_KEY environment variables not set. Supabase client not initialized.")
        return None

# Initialize the client
supabase_client = initialize_supabase()

# History operations
def add_search_to_history(search_type, query, results_count):
    """Add a search to the history database (Supabase)"""
    if not supabase_client:
        print("Error: Supabase client not available.")
        return False
    try:
        # timestamp is handled by default value in Supabase
        data, count = supabase_client.table('search_history').insert({
            "search_type": search_type,
            "query": query,
            "results_count": results_count
        }).execute()

        return True if data else False
    except Exception as e:
        print(f"Error adding search to Supabase history: {str(e)}")
        traceback.print_exc()  # Print stack trace for debugging
        return False

def add_company_to_considered(company_name):
    """Add a company to the previously considered companies database (Supabase)"""
    # Keep track of considered companies in memory even if DB operation fails
    global in_memory_considered_companies
    if 'in_memory_considered_companies' not in globals():
        in_memory_considered_companies = set()
    in_memory_considered_companies.add(company_name)

    if not supabase_client:
        print("Error: Supabase client not available.")
        return False
    try:
        # Method 1: Use RPC to bypass RLS
        # Call a stored procedure that has SECURITY DEFINER permission
        try:
            data = supabase_client.rpc(
                'add_considered_company',
                {'company_name_param': company_name}
            ).execute()
            return True if data else False
        except Exception as e:
            # RPC method failed, try direct insert with error handling
            print(f"RPC method failed: {str(e)}")

            # Method 2: Try direct insert - just log error if it fails due to RLS
            try:
                data, count = supabase_client.table('previously_considered').upsert(
                    {"company_name": company_name},
                    on_conflict='company_name',
                    ignore_duplicates=True
                ).execute()
                return True if data else False
            except Exception as e2:
                print(f"Direct insert failed: {str(e2)}")
                # Continue operation with in-memory tracking
                return False
    except Exception as e:
        print(f"Error adding company to Supabase previously considered: {str(e)}")
        traceback.print_exc()  # Print stack trace for debugging
        return False

def save_potential_partner(company, industry):
    """Save company to potential_partners table (Supabase)"""
    if not supabase_client:
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

        # Prepare data for Supabase
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

        # Headquarters
        hq_location = ""
        if 'coresignal_data' in company and 'company_details' in company['coresignal_data'] and 'headquarters' in company['coresignal_data']['company_details']:
            hq_location = company['coresignal_data']['company_details']['headquarters']

        # Insert data
        data, count = supabase_client.table('potential_partners').insert({
            "name": name,
            "description": description,
            "industry": industry,
            "partnership_score": score,
            "key_leadership": key_leadership,
            "key_products": key_products,
            "partnership_opportunities": partnership_opportunities,
            "market_analysis": market_analysis,
            "partnership_potential": partnership_potential,
            "hq_location": hq_location
        }).execute()

        return True if data else False
    except Exception as e:
        print(f"Error saving potential partner to Supabase: {str(e)}")
        traceback.print_exc()
        return False

def get_potential_partners(search_query=None, date_from=None, date_to=None, sort_by='score', sort_order='desc'):
    """Get potential partners from the database with optional filtering and sorting

    Args:
        search_query (str, optional): Search term to filter by name or description
        date_from (str, optional): Start date in ISO format (YYYY-MM-DD)
        date_to (str, optional): End date in ISO format (YYYY-MM-DD)
        sort_by (str, optional): Field to sort by (score, name, created_at)
        sort_order (str, optional): Sort direction (asc or desc)

    Returns:
        list: List of potential partners matching the criteria
    """
    if not supabase_client:
        print("Error: Supabase client not available.")
        return []
    try:
        # Start building the query with specific fields
        query = supabase_client.table('potential_partners').select(
            'id, name, description, industry, hq_location, website, logo, company_logo, ' +
            'employee_count, size_range, annual_revenue, founded_year_min, score, ' +
            'leadership, opportunities, created_at, funding_last_round_type, ' +
            'last_funding_round_amount_raised, last_funding_round_name, marketcap, ' +
            'key_executives, country, hq_country, company_name_alias, company_legal_name')

        # Apply search filter if provided
        if search_query:
            # Search in name and description fields
            query = query.or_(f"name.ilike.%{search_query}%,description.ilike.%{search_query}%")

        # Apply date filters if provided
        if date_from:
            query = query.gte('created_at', f"{date_from}T00:00:00")
        if date_to:
            query = query.lte('created_at', f"{date_to}T23:59:59")

        # Apply sorting
        valid_sort_fields = ['score', 'name', 'created_at', 'updated_at']
        sort_field = sort_by if sort_by in valid_sort_fields else 'score'
        sort_direction = True if sort_order.lower() == 'desc' else False

        query = query.order(sort_field, desc=sort_direction)

        # Execute the query
        data, count = query.execute()
        print(f"Supabase query result structure: {type(data)}")

        if data and len(data) > 0:
            print(f"Data structure: {type(data)}, length: {len(data)}")
            if len(data) > 1 and isinstance(data[1], list):
                print(f"Returning {len(data[1])} partners from data[1]")
                return data[1]  # Supabase returns [count, data] format
            elif len(data) > 0 and isinstance(data[0], list):
                print(f"Returning {len(data[0])} partners from data[0]")
                return data[0]
            else:
                print(f"Returning {len(data)} partners from data directly")
                return data
        return []
    except Exception as e:
        print(f"Error getting potential partners from Supabase: {str(e)}")
        traceback.print_exc()
        return []

def get_search_history_from_db():
    """Get search history from the database"""
    if not supabase_client:
        print("Error: Supabase client not available.")
        return []
    try:
        data, count = supabase_client.table('search_history').select('*').order('timestamp', desc=True).execute()
        if data and len(data) > 0:
            return data[1]  # Supabase returns [count, data] format
        return []
    except Exception as e:
        print(f"Error getting search history from Supabase: {str(e)}")
        traceback.print_exc()
        return []

def get_previously_considered_from_db():
    """Get previously considered companies from the database"""
    # Start with in-memory set if available
    results = []
    if 'in_memory_considered_companies' in globals():
        results = [{"company_name": name} for name in in_memory_considered_companies]

    # Try to get from database as well
    if not supabase_client:
        print("Error: Supabase client not available.")
        return results  # Return in-memory results if available
    try:
        data, count = supabase_client.table('previously_considered').select('*').execute()
        if data and len(data) > 0 and len(data) >= 2 and data[1]:
            # Combine with in-memory results, avoiding duplicates
            db_results = data[1]  # Supabase returns [count, data] format
            db_company_names = {item.get("company_name") for item in db_results}
            in_memory_only = [item for item in results if item.get("company_name") not in db_company_names]
            return db_results + in_memory_only
        return results  # Return in-memory results if no DB results
    except Exception as e:
        print(f"Error getting previously considered companies from Supabase: {str(e)}")
        traceback.print_exc()
        return results  # Return in-memory results on error

def clear_history_from_db():
    """Clear all history from the database"""
    if not supabase_client:
        print("Error: Supabase client not available.")
        return False
    try:
        # Clear search history
        search_deleted, search_count = supabase_client.table('search_history').delete().execute()

        # Clear previously considered
        considered_deleted, considered_count = supabase_client.table('previously_considered').delete().execute()

        # Clear potential partners
        partners_deleted, partners_count = supabase_client.table('potential_partners').delete().execute()

        return True
    except Exception as e:
        print(f"Error clearing history from Supabase: {str(e)}")
        traceback.print_exc()
        return False

def save_company_research(company_name, research_data, source):
    """Save company research data to database"""
    if not supabase_client:
        print("Error: Supabase client not available.")
        return False
    try:
        # Use upsert to replace any existing data
        data, count = supabase_client.table('company_research').upsert({
            "company_name": company_name,
            "research_data": research_data,
            "source": source
        }, on_conflict='company_name').execute()

        return True if data else False
    except Exception as e:
        print(f"Error saving company research to Supabase: {str(e)}")
        traceback.print_exc()
        return False

def get_company_research(company_name):
    """Get company research data from database"""
    if not supabase_client:
        print("Error: Supabase client not available.")
        return None
    try:
        data, count = supabase_client.table('company_research').select('*').eq('company_name', company_name).execute()
        if data and len(data) > 0 and len(data[1]) > 0:
            return data[1][0]  # Return the first matching record
        return None
    except Exception as e:
        print(f"Error getting company research from Supabase: {str(e)}")
        traceback.print_exc()
        return None