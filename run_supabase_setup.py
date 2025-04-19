import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

# Supabase Setup
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    print("Error: SUPABASE_URL or SUPABASE_ANON_KEY environment variables not set.")
    exit(1)

try:
    # Initialize Supabase client
    supabase = create_client(supabase_url, supabase_key)
    print("Supabase client initialized successfully.")
    
    # Read SQL file
    with open('enable_http_extension.sql', 'r') as file:
        sql_commands = file.read()
    
    # Execute SQL commands
    print("Executing SQL commands to enable HTTP extension and add unique constraint...")
    
    # Split SQL commands by semicolon and execute each one
    for command in sql_commands.split(';'):
        if command.strip():
            try:
                # Execute SQL command using Supabase's raw SQL execution
                result = supabase.rpc('exec_sql', {'sql_string': command}).execute()
                print(f"Command executed successfully: {command.strip()}")
            except Exception as e:
                print(f"Error executing command: {command.strip()}")
                print(f"Error details: {e}")
    
    print("Setup completed successfully.")
    
except Exception as e:
    print(f"Error: {e}")
    exit(1)
