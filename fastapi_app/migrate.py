import os
import shutil
import sqlite3
from datetime import datetime

def migrate_database():
    """
    Migrate database data from Flask app to FastAPI app
    """
    source_db = '../dura_history.db'
    
    if not os.path.exists(source_db):
        print(f"Source database {source_db} not found. Please make sure the Flask app database exists.")
        return False
    
    # Backup the original database
    backup_path = f'../dura_history_backup_{datetime.now().strftime("%Y%m%d%H%M%S")}.db'
    try:
        shutil.copy2(source_db, backup_path)
        print(f"Created database backup at {backup_path}")
    except Exception as e:
        print(f"Error creating database backup: {str(e)}")
        return False
    
    # Copy the database to the FastAPI app
    try:
        # We'll just use the same database file for now
        # This is the simplest approach since the schema is the same
        print("The FastAPI app will use the same database file as the Flask app.")
        print(f"Database file: {os.path.abspath(source_db)}")
        print("No migration necessary.")
        return True
    except Exception as e:
        print(f"Error during migration: {str(e)}")
        return False

def migrate_env_file():
    """
    Copy the .env file from Flask app to FastAPI app
    """
    source_env = '../.env'
    target_env = './.env'
    
    if not os.path.exists(source_env):
        print(f"Source .env file {source_env} not found. Please make sure the Flask app .env file exists.")
        return False
    
    try:
        shutil.copy2(source_env, target_env)
        print(f"Copied .env file to {os.path.abspath(target_env)}")
        return True
    except Exception as e:
        print(f"Error copying .env file: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starting migration from Flask to FastAPI...")
    
    db_success = migrate_database()
    env_success = migrate_env_file()
    
    if db_success and env_success:
        print("\nMigration completed successfully!")
        print("\nYou can now run the FastAPI app with:")
        print("python run.py")
    else:
        print("\nMigration completed with some issues. Please check the error messages above.") 