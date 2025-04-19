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

def verify_search_history_table(supabase_client):
    """Verify that the search_history table exists and has the correct structure"""
    try:
        # Check if the table exists by trying to select from it
        response = supabase_client.table('search_history').select('*').limit(1).execute()
        print(f"Search history table exists. Sample data: {response}")
        return True
    except Exception as e:
        print(f"Error accessing search_history table: {e}")
        traceback.print_exc()
        return False

def add_test_search(supabase_client):
    """Add a test search to the search_history table"""
    try:
        # Add a test search
        test_search = {
            "search_type": "test",
            "query": "test search",
            "results_count": 0
        }
        
        response = supabase_client.table('search_history').insert(test_search).execute()
        print(f"Test search added successfully: {response}")
        return True
    except Exception as e:
        print(f"Error adding test search: {e}")
        traceback.print_exc()
        return False

def fix_search_history_function():
    """Fix the add_search_to_history function in database.py"""
    try:
        # Read the current database.py file
        with open('database.py', 'r') as file:
            content = file.read()
        
        # Check if the function already exists
        if 'def add_search_to_history(' in content:
            print("Found add_search_to_history function in database.py")
            
            # Create a backup of the original file
            with open('database.py.bak', 'w') as file:
                file.write(content)
            print("Created backup of database.py as database.py.bak")
            
            # Replace the function with a fixed version
            fixed_function = """
def add_search_to_history(search_type, query, results_count):
    """Add a search to the history database (Supabase)"""
    global in_memory_search_history

    # Add to in-memory history
    timestamp = datetime.now().isoformat()
    in_memory_search_history.append({
        "timestamp": timestamp,
        "type": search_type,
        "query": query,
        "results_count": results_count
    })

    # Try to add to database
    if not supabase_client:
        print("Error: Supabase client not available.")
        return False

    try:
        # timestamp is handled by default value in Supabase
        data = supabase_client.table('search_history').insert({
            "search_type": search_type,
            "query": query,
            "results_count": results_count
        }).execute()
        
        print(f"Search added to history: {search_type} - {query} - {results_count}")
        return True
    except Exception as e:
        print(f"Error adding search to Supabase history: {str(e)}")
        traceback.print_exc()
        return False
"""
            
            # Replace the function in the content
            import re
            pattern = r'def add_search_to_history\([^)]*\):.*?(?=\n\w|\Z)'
            new_content = re.sub(pattern, fixed_function.strip(), content, flags=re.DOTALL)
            
            # Write the updated content back to the file
            with open('database.py', 'w') as file:
                file.write(new_content)
            
            print("Updated add_search_to_history function in database.py")
            return True
        else:
            print("Could not find add_search_to_history function in database.py")
            return False
    except Exception as e:
        print(f"Error fixing search history function: {e}")
        traceback.print_exc()
        return False

def fix_app_py_search_function():
    """Fix the search function in app.py to properly save searches"""
    try:
        # Read the current app.py file
        with open('app.py', 'r') as file:
            content = file.read()
        
        # Check if the search endpoint exists
        if '@api_bp.route(\'/search\', methods=[\'POST\'])' in content:
            print("Found search endpoint in app.py")
            
            # Create a backup of the original file
            with open('app.py.bak', 'w') as file:
                file.write(content)
            print("Created backup of app.py as app.py.bak")
            
            # Find the search function and add a call to add_search_to_history
            import re
            
            # Look for the search function
            search_pattern = r'@api_bp\.route\(\'/search\', methods=\[\'POST\'\]\).*?def search\(\):.*?return jsonify\('
            
            # Find the position to insert the add_search_to_history call
            match = re.search(search_pattern, content, re.DOTALL)
            if match:
                # Find the position right before the return statement
                return_pos = content.rfind('return jsonify(', 0, match.end())
                if return_pos != -1:
                    # Insert the add_search_to_history call before the return statement
                    insert_code = """
        # Log the search in history
        from app.models.database import add_search_to_history
        add_search_to_history("industry", industry, len(analysis['companies']) if 'companies' in analysis else 0)
        
        """
                    new_content = content[:return_pos] + insert_code + content[return_pos:]
                    
                    # Write the updated content back to the file
                    with open('app.py', 'w') as file:
                        file.write(new_content)
                    
                    print("Updated search function in app.py to save searches")
                    return True
                else:
                    print("Could not find return statement in search function")
                    return False
            else:
                print("Could not find search function in app.py")
                return False
        else:
            print("Could not find search endpoint in app.py")
            return False
    except Exception as e:
        print(f"Error fixing app.py search function: {e}")
        traceback.print_exc()
        return False

def main():
    """Main function to fix the search history functionality"""
    print("Starting search history fix...")
    
    # Initialize Supabase client
    supabase_client = init_supabase()
    if not supabase_client:
        print("Failed to initialize Supabase client. Exiting.")
        return
    
    # Verify search_history table
    if not verify_search_history_table(supabase_client):
        print("Failed to verify search_history table. Exiting.")
        return
    
    # Add a test search
    if not add_test_search(supabase_client):
        print("Failed to add test search. Exiting.")
        return
    
    # Fix the add_search_to_history function
    if not fix_search_history_function():
        print("Failed to fix add_search_to_history function. Exiting.")
        return
    
    # Fix the search function in app.py
    if not fix_app_py_search_function():
        print("Failed to fix search function in app.py. Exiting.")
        return
    
    print("Search history fix completed successfully!")
    print("Your searches should now be saved to the database.")
    print("To test, run the application and perform a search.")

if __name__ == "__main__":
    main()
