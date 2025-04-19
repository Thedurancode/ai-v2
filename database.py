import os
import json
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
import traceback

# Load environment variables
load_dotenv()

# Supabase Setup
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_ANON_KEY")

# Global client variable
supabase_client = None

def init_supabase():
    """Initialize the Supabase client"""
    global supabase_client

    if supabase_url and supabase_key:
        try:
            supabase_client = create_client(supabase_url, supabase_key)
            print("Supabase client initialized successfully.")
            return supabase_client
        except Exception as e:
            print(f"Error initializing Supabase client: {e}")
            traceback.print_exc()
            supabase_client = None
    else:
        print("Warning: SUPABASE_URL or SUPABASE_ANON_KEY environment variables not set. Supabase client not initialized.")
        supabase_client = None

    return supabase_client

def get_supabase() -> Client:
    """Get the Supabase client instance (dependency injection for FastAPI)"""
    global supabase_client
    if supabase_client is None:
        supabase_client = init_supabase()
    return supabase_client

# Initialize the client on module import
init_supabase()

# In-memory storage as fallback
in_memory_considered_companies = set()
in_memory_search_history = []

# Database operations
def add_search_to_history_direct_http(search_type, query, results_count):
    """Add a search to the history database using direct HTTP requests"""
    if not supabase_url or not supabase_key:
        print("Error: Supabase URL or key not available.")
        return False

    try:
        import requests

        # Prepare headers for all requests
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }

        # Prepare data for insert
        insert_data = {
            "search_type": search_type,
            "query": query,
            "results_count": results_count
        }

        # Insert the record
        insert_url = f"{supabase_url}/rest/v1/search_history"

        print(f"[ADD_HISTORY_HTTP] Adding search to history: {search_type} - {query} - {results_count}")
        insert_response = requests.post(insert_url, headers=headers, json=insert_data)

        if insert_response.status_code == 201:
            print(f"[ADD_HISTORY_HTTP] Successfully added search to history")
            return True
        else:
            print(f"[ADD_HISTORY_HTTP] Failed to add search: {insert_response.status_code} - {insert_response.text}")
            return False
    except Exception as e:
        print(f"[ADD_HISTORY_HTTP] Error: {e}")
        traceback.print_exc()
        return False

def add_search_to_history(search_type, query, results_count):
    """Add a search to the history database (Supabase)"""
    global in_memory_search_history

    print(f"Adding search to history: {search_type} - {query} - {results_count}")

    # Add to in-memory history
    timestamp = datetime.now().isoformat()
    in_memory_search_history.append({
        "timestamp": timestamp,
        "type": search_type,
        "query": query,
        "results_count": results_count
    })

    # Import the direct SQL module
    try:
        from direct_db import add_search_to_history_direct_sql
        print(f"[ADD_HISTORY] Using direct SQL approach to add search history")
        result = add_search_to_history_direct_sql(search_type, query, results_count)
    except ImportError:
        print("[ADD_HISTORY] Direct SQL module not available, falling back to HTTP approach")
        result = add_search_to_history_direct_http(search_type, query, results_count)

    if not result:
        # Even if we fail to save to the database, we've saved to in-memory history
        print("Search saved to in-memory history only.")

    return result

def add_company_to_considered_direct_http(company_name):
    """Add a company to the previously considered companies database using direct HTTP requests"""
    if not supabase_url or not supabase_key:
        print("Error: Supabase URL or key not available.")
        return False

    try:
        import requests

        # Prepare headers for all requests
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }

        # Insert the record
        insert_url = f"{supabase_url}/rest/v1/previously_considered"
        insert_data = {"company_name": company_name}

        print(f"[ADD_CONSIDERED_HTTP] Adding {company_name} to previously considered")
        insert_response = requests.post(insert_url, headers=headers, json=insert_data)

        if insert_response.status_code in [201, 409]:  # 201 = Created, 409 = Conflict (already exists)
            print(f"[ADD_CONSIDERED_HTTP] Successfully added {company_name} to previously considered")
            return True
        else:
            print(f"[ADD_CONSIDERED_HTTP] Failed to add {company_name}: {insert_response.status_code} - {insert_response.text}")
            return False
    except Exception as e:
        print(f"[ADD_CONSIDERED_HTTP] Error: {e}")
        traceback.print_exc()
        return False

def add_company_to_considered(company_name):
    """Add a company to the previously considered companies database (Supabase)"""
    global in_memory_considered_companies

    # Add to in-memory set
    in_memory_considered_companies.add(company_name)

    # Import the direct SQL module
    try:
        from direct_db import add_company_to_considered_direct_sql
        print(f"[ADD_CONSIDERED] Using direct SQL approach to add {company_name}")
        return add_company_to_considered_direct_sql(company_name)
    except ImportError:
        print("[ADD_CONSIDERED] Direct SQL module not available, falling back to HTTP approach")
        return add_company_to_considered_direct_http(company_name)

def save_partner_direct(name, score, industry, description=""):
    """Save partner directly to the database using a direct REST API call"""
    if not supabase_url or not supabase_key:
        print("Error: Supabase URL or key not available.")
        return False

    try:
        import requests

        # Ensure score is a valid float
        try:
            score = float(score)
        except (ValueError, TypeError):
            score = 0.0

        # Sanitize inputs to prevent SQL injection and other issues
        safe_name = name.replace("'", "''")
        safe_industry = industry.replace("'", "''")
        safe_description = description[:1000].replace("'", "''") if description else ""

        # First try with direct REST API
        url = f"{supabase_url}/rest/v1/potential_partners"
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        data = {
            "name": safe_name,
            "score": score,
            "industry": safe_industry,
            "description": safe_description
        }

        print(f"[SAVE_PARTNER_DIRECT] Attempting direct REST API call to save {name}")
        response = requests.post(url, headers=headers, json=data)

        if response.status_code == 201:
            print(f"[SAVE_PARTNER_DIRECT] Successfully saved {name} via direct REST API")
            return True
        else:
            print(f"[SAVE_PARTNER_DIRECT] Direct REST API failed: {response.status_code} - {response.text}")

            # Try an alternative approach with a different content type
            try:
                print(f"[SAVE_PARTNER_DIRECT] Trying alternative approach with different content type")
                alt_headers = {
                    "apikey": supabase_key,
                    "Authorization": f"Bearer {supabase_key}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                }

                # Try with a simplified payload
                simplified_data = {
                    "name": safe_name,
                    "score": score,
                    "industry": safe_industry
                }

                alt_response = requests.post(url, headers=alt_headers, json=simplified_data)

                if alt_response.status_code == 201:
                    print(f"[SAVE_PARTNER_DIRECT] Successfully saved {name} via alternative approach")
                    return True
                else:
                    print(f"[SAVE_PARTNER_DIRECT] Alternative approach failed: {alt_response.status_code} - {alt_response.text}")
                    return False
            except Exception as alt_error:
                print(f"[SAVE_PARTNER_DIRECT] Error in alternative approach: {alt_error}")
                return False
    except Exception as e:
        print(f"[SAVE_PARTNER_DIRECT] Error in direct save: {e}")
        traceback.print_exc()
        return False

def check_partner_exists_direct(name):
    """Check if a partner exists using a direct REST API call"""
    if not supabase_url or not supabase_key:
        print("Error: Supabase URL or key not available.")
        return False

    try:
        import requests
        import urllib.parse

        # Direct query approach
        url = f"{supabase_url}/rest/v1/potential_partners"
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json"
        }

        # URL encode the name for the query parameter
        encoded_name = urllib.parse.quote(name)

        print(f"[CHECK_PARTNER_DIRECT] Checking if {name} exists via direct REST API")

        # Use exact match with eq operator
        response = requests.get(
            url,
            headers=headers,
            params={"name": f"eq.{encoded_name}", "select": "id"}
        )

        if response.status_code == 200:
            data = response.json()
            exists = len(data) > 0
            print(f"[CHECK_PARTNER_DIRECT] Partner {name} exists: {exists}")
            return exists
        else:
            print(f"[CHECK_PARTNER_DIRECT] Check failed: {response.status_code} - {response.text}")
            # If the check fails, assume the partner doesn't exist
            return False
    except Exception as e:
        print(f"[CHECK_PARTNER_DIRECT] Error checking partner: {e}")
        traceback.print_exc()
        # If there's an error, assume the partner doesn't exist
        return False

def save_potential_partner_direct_http(company, industry):
    """Save company to potential_partners table using direct HTTP requests to Supabase REST API"""
    if not supabase_url or not supabase_key:
        print("Error: Supabase URL or key not available.")
        return False

    try:
        import requests
        import urllib.parse

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

        print(f"[SAVE_PARTNER_HTTP] Attempting to save partner {name} to Supabase with score: {score}")
        print(f"[SAVE_PARTNER_HTTP] Industry: {industry}")

        # Prepare headers for all requests
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }

        # First check if the partner already exists
        check_url = f"{supabase_url}/rest/v1/potential_partners"
        check_params = {
            "name": f"eq.{name}",
            "select": "id"
        }

        print(f"[SAVE_PARTNER_HTTP] Checking if {name} exists")
        check_response = requests.get(check_url, headers=headers, params=check_params)

        if check_response.status_code == 200:
            data = check_response.json()
            if data and len(data) > 0:
                print(f"[SAVE_PARTNER_HTTP] Partner {name} already exists, updating")

                # Update the existing partner
                update_url = f"{supabase_url}/rest/v1/potential_partners"
                update_params = {"name": f"eq.{name}"}
                update_data = {
                    "score": score,
                    "industry": industry,
                    "description": company.get('description', '')[:1000] if company.get('description') else '',
                    "updated_at": "now()"
                }

                update_response = requests.patch(update_url, headers=headers, params=update_params, json=update_data)

                if update_response.status_code in [200, 201, 204]:
                    print(f"[SAVE_PARTNER_HTTP] Successfully updated partner {name}")
                    return True
                else:
                    print(f"[SAVE_PARTNER_HTTP] Error updating partner: {update_response.status_code} - {update_response.text}")
                    return False

            # Partner doesn't exist, insert it
            print(f"[SAVE_PARTNER_HTTP] Partner {name} does not exist, inserting new record")

            # Prepare data for insert with timestamps
            insert_data = {
                "name": name,
                "score": score,
                "industry": industry,
                "description": company.get('description', '')[:1000] if company.get('description') else '',
                "created_at": "now()",
                "updated_at": "now()"
            }

            # Insert the record
            insert_url = f"{supabase_url}/rest/v1/potential_partners"
            insert_response = requests.post(insert_url, headers=headers, json=insert_data)

            if insert_response.status_code in [200, 201, 204]:
                print(f"[SAVE_PARTNER_HTTP] Successfully inserted {name}")
                return True
            else:
                print(f"[SAVE_PARTNER_HTTP] Error inserting partner: {insert_response.status_code} - {insert_response.text}")

                # Try with a more minimal record
                minimal_data = {
                    "name": name,
                    "industry": industry,
                    "created_at": "now()",
                    "updated_at": "now()"
                }

                minimal_response = requests.post(insert_url, headers=headers, json=minimal_data)

                if minimal_response.status_code in [200, 201, 204]:
                    print(f"[SAVE_PARTNER_HTTP] Successfully inserted minimal record for {name}")
                    return True
                else:
                    print(f"[SAVE_PARTNER_HTTP] Minimal insert failed: {minimal_response.status_code} - {minimal_response.text}")
                    return False
        else:
            print(f"[SAVE_PARTNER_HTTP] Error checking if partner exists: {check_response.status_code} - {check_response.text}")
            return False
    except Exception as e:
        print(f"[SAVE_PARTNER_HTTP] Error: {e}")
        traceback.print_exc()
        return False

def save_potential_partner(company, industry):
    """Save company to potential_partners table (Supabase)"""
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

        description = company.get('description', '')[:1000] if company.get('description') else ''

        print(f"Saving partner {name} to Supabase with score: {score} (type: {type(score)})")

        # First try using direct HTTP approach which has been proven to work
        try:
            http_result = save_potential_partner_direct_http(company, industry)
            if http_result:
                return True
        except Exception as http_error:
            print(f"Error using direct HTTP approach: {http_error}")
            traceback.print_exc()
            # Fall through to other methods

        # Try using the Supabase client as a fallback
        if supabase_client:
            try:
                # Check if partner already exists
                existing = supabase_client.table('potential_partners').select('id').eq('name', name).execute()

                # Prepare data for insert/update
                partner_data = {
                    "name": name,
                    "score": score,
                    "industry": industry,
                    "description": description,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }

                if existing.data and len(existing.data) > 0:
                    # Update existing partner
                    print(f"Partner {name} already exists, updating record")
                    # Remove created_at from update data
                    update_data = partner_data.copy()
                    if 'created_at' in update_data:
                        del update_data['created_at']

                    supabase_client.table('potential_partners').update(update_data).eq('name', name).execute()
                    print(f"Successfully updated partner {name} via REST API")
                    return True
                else:
                    # Insert new partner
                    print(f"Partner {name} does not exist, inserting new record")
                    # Use direct SQL to bypass the trigger
                    try:
                        from direct_db import save_partner_direct_sql
                        print(f"[SAVE_PARTNER] Using direct SQL approach to save {name}")
                        sql_result = save_partner_direct_sql(name, score, industry, description)
                        if sql_result:
                            print(f"Successfully saved partner {name} using direct SQL")
                            return True
                    except ImportError:
                        # Fall back to Supabase client
                        print("[SAVE_PARTNER] Direct SQL module not available, using Supabase client")
                        supabase_client.table('potential_partners').insert(partner_data).execute()
                        print(f"Successfully saved partner {name} using simple direct REST API")
                        return True
            except Exception as e:
                print(f"Error using Supabase client to save partner: {e}")
                traceback.print_exc()
                # Fall through to other methods

        print(f"All approaches to save partner {name} failed")
        return False
    except Exception as e:
        print(f"Error in save_potential_partner: {e}")
        traceback.print_exc()
        return False

def get_potential_partners(search_query=None, industry=None, sort_by='score', sort_order='desc'):
    """Get potential partners from the database with optional filtering and sorting"""
    if not supabase_client:
        print("Error: Supabase client not available.")
        return []

    try:
        # Start building the query
        query = supabase_client.table('potential_partners').select('*')

        # Apply search filter if provided
        if search_query:
            query = query.or_(f"name.ilike.%{search_query}%,description.ilike.%{search_query}%")

        # Apply industry filter if provided
        if industry:
            query = query.eq('industry', industry)

        # Apply sorting
        valid_sort_fields = ['score', 'name', 'created_at', 'updated_at']
        sort_field = sort_by if sort_by in valid_sort_fields else 'score'
        sort_direction = True if sort_order.lower() == 'desc' else False

        query = query.order(sort_field, desc=sort_direction)

        # Execute the query
        response = query.execute()

        # Process the response
        if response.data:
            return response.data
        return []
    except Exception as e:
        print(f"Error getting potential partners from Supabase: {e}")
        traceback.print_exc()
        return []

def get_search_history():
    """Get search history from the database"""
    global in_memory_search_history

    if not supabase_client:
        print("Error: Supabase client not available.")
        return in_memory_search_history

    try:
        response = supabase_client.table('search_history').select(
            'timestamp, search_type, query, results_count'
        ).order('timestamp', desc=True).limit(50).execute()

        if response.data:
            history = []
            for row in response.data:
                history.append({
                    "timestamp": row.get('timestamp'),
                    "type": row.get('search_type'),
                    "query": row.get('query'),
                    "results_count": row.get('results_count')
                })
            return history
        return in_memory_search_history
    except Exception as e:
        print(f"Error retrieving search history from Supabase: {str(e)}")
        traceback.print_exc()
        return in_memory_search_history

def get_previously_considered():
    """Get previously considered companies from the database"""
    global in_memory_considered_companies

    if not supabase_client:
        print("Error: Supabase client not available.")
        return list(in_memory_considered_companies)

    try:
        response = supabase_client.table('previously_considered').select('company_name').execute()

        if response.data:
            companies = [row.get('company_name') for row in response.data if row.get('company_name')]
            # Merge with in-memory set
            in_memory_considered_companies.update(companies)
            return list(in_memory_considered_companies)
        return list(in_memory_considered_companies)
    except Exception as e:
        print(f"Error retrieving previously considered companies from Supabase: {str(e)}")
        traceback.print_exc()
        return list(in_memory_considered_companies)

def clear_history():
    """Clear all history from the database"""
    global in_memory_considered_companies
    global in_memory_search_history

    # Clear in-memory data
    in_memory_considered_companies.clear()
    in_memory_search_history.clear()

    if not supabase_client:
        print("Error: Supabase client not available.")
        return False

    try:
        # Clear search history
        supabase_client.table('search_history').delete().execute()

        # Clear previously considered
        supabase_client.table('previously_considered').delete().execute()

        # Clear potential partners
        supabase_client.table('potential_partners').delete().execute()

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
        # Normalize company name
        company_name = company_name.strip() if company_name else ""

        if not company_name or not research_data or not source:
            print(f"Error: Missing data for save_company_research")
            return False

        # Store research data as JSON string if it's a dict
        if isinstance(research_data, dict):
            research_data_str = json.dumps(research_data)
        else:
            research_data_str = str(research_data)

        # Use upsert to replace any existing data
        supabase_client.table('company_research').upsert({
            "company_name": company_name,
            "research_data": research_data_str,
            "source": source
        }, on_conflict='company_name').execute()

        return True
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
        # Normalize company name
        company_name = company_name.strip() if company_name else ""

        if not company_name:
            print("Error: Company name is required to get research")
            return None

        response = supabase_client.table('company_research').select(
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
                'company_name': row.get('company_name')
            }
        return None
    except Exception as e:
        print(f"Error retrieving company research from Supabase: {str(e)}")
        traceback.print_exc()
        return None
