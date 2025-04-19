import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_ANON_KEY")
supabase = None

def init_supabase():
    global supabase
    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL or SUPABASE_ANON_KEY environment variables not set")
        return None
    
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("Supabase client initialized successfully")
        return supabase
    except Exception as e:
        print(f"Error initializing Supabase client: {e}")
        return None

def get_supabase():
    global supabase
    if not supabase:
        return init_supabase()
    return supabase 