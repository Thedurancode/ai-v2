import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase Setup
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_ANON_KEY")

# Initialize client only if URL and Key are present
supabase: Client = None

def init_supabase():
    """Initialize the Supabase client"""
    global supabase
    
    if supabase_url and supabase_key:
        try:
            supabase = create_client(supabase_url, supabase_key)
            print("Supabase client initialized successfully.")
            return supabase
        except Exception as e:
            print(f"Error initializing Supabase client: {e}")
            supabase = None  # Set client to None on error
    else:
        print("Warning: SUPABASE_URL or SUPABASE_ANON_KEY environment variables not set. Supabase client not initialized.")
        supabase = None
    
    return supabase

def get_supabase() -> Client:
    """Get the Supabase client instance"""
    global supabase
    if supabase is None:
        supabase = init_supabase()
    return supabase
