import os
import sqlite3
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv
import sys
import time

# Load environment variables
load_dotenv()

# Get database connection details
SQLITE_DB_PATH = os.getenv('DB_PATH', 'dura_history.db')
POSTGRES_DB_URL = os.getenv('DATABASE_URL', '')

if not POSTGRES_DB_URL:
    print("Error: DATABASE_URL environment variable is required")
    sys.exit(1)

def connect_sqlite():
    """Connect to SQLite database"""
    try:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row  # This enables column access by name
        return conn
    except sqlite3.Error as e:
        print(f"Error connecting to SQLite database: {e}")
        return None

def connect_postgres():
    """Connect to PostgreSQL database"""
    try:
        conn = psycopg2.connect(POSTGRES_DB_URL)
        return conn
    except psycopg2.Error as e:
        print(f"Error connecting to PostgreSQL database: {e}")
        return None

def migrate_search_history(sqlite_conn, pg_conn):
    """Migrate search history data"""
    try:
        # Get data from SQLite
        sqlite_cursor = sqlite_conn.cursor()
        sqlite_cursor.execute("SELECT search_type, query, results_count, timestamp FROM search_history")
        rows = sqlite_cursor.fetchall()
        
        if not rows:
            print("No search history data to migrate")
            return 0
        
        # Insert into PostgreSQL
        pg_cursor = pg_conn.cursor()
        
        # Convert rows to list of tuples for execute_values
        values = [(row['search_type'], row['query'], row['results_count'], row['timestamp']) for row in rows]
        
        execute_values(
            pg_cursor,
            "INSERT INTO search_history (search_type, query, results_count, timestamp) VALUES %s",
            values
        )
        
        pg_conn.commit()
        print(f"Migrated {len(rows)} search history records")
        return len(rows)
    except Exception as e:
        print(f"Error migrating search history: {e}")
        pg_conn.rollback()
        return 0

def migrate_previously_considered(sqlite_conn, pg_conn):
    """Migrate previously considered companies data"""
    try:
        # Get data from SQLite
        sqlite_cursor = sqlite_conn.cursor()
        sqlite_cursor.execute("SELECT company_name, considered_at FROM previously_considered")
        rows = sqlite_cursor.fetchall()
        
        if not rows:
            print("No previously considered companies data to migrate")
            return 0
        
        # Insert into PostgreSQL
        pg_cursor = pg_conn.cursor()
        
        # Convert rows to list of tuples for execute_values
        values = [(row['company_name'], row['considered_at']) for row in rows]
        
        execute_values(
            pg_cursor,
            "INSERT INTO previously_considered (company_name, considered_at) VALUES %s ON CONFLICT (company_name) DO NOTHING",
            values
        )
        
        pg_conn.commit()
        print(f"Migrated {len(rows)} previously considered companies records")
        return len(rows)
    except Exception as e:
        print(f"Error migrating previously considered companies: {e}")
        pg_conn.rollback()
        return 0

def migrate_company_research(sqlite_conn, pg_conn):
    """Migrate company research data"""
    try:
        # Get data from SQLite
        sqlite_cursor = sqlite_conn.cursor()
        sqlite_cursor.execute("SELECT company_name, research_data, source, created_at, updated_at FROM company_research")
        rows = sqlite_cursor.fetchall()
        
        if not rows:
            print("No company research data to migrate")
            return 0
        
        # Insert into PostgreSQL
        pg_cursor = pg_conn.cursor()
        
        # Convert rows to list of tuples for execute_values
        values = [(row['company_name'], row['research_data'], row['source'], row['created_at'], row['updated_at']) for row in rows]
        
        execute_values(
            pg_cursor,
            "INSERT INTO company_research (company_name, research_data, source, created_at, updated_at) VALUES %s ON CONFLICT (company_name) DO NOTHING",
            values
        )
        
        pg_conn.commit()
        print(f"Migrated {len(rows)} company research records")
        return len(rows)
    except Exception as e:
        print(f"Error migrating company research: {e}")
        pg_conn.rollback()
        return 0

def migrate_potential_partners(sqlite_conn, pg_conn):
    """Migrate potential partners data"""
    try:
        # Get data from SQLite
        sqlite_cursor = sqlite_conn.cursor()
        
        # Get all column names first
        sqlite_cursor.execute("PRAGMA table_info(potential_partners)")
        columns_info = sqlite_cursor.fetchall()
        column_names = [column[1] for column in columns_info]
        
        # Build query dynamically based on available columns
        select_columns = ", ".join(column_names)
        sqlite_cursor.execute(f"SELECT {select_columns} FROM potential_partners")
        rows = sqlite_cursor.fetchall()
        
        if not rows:
            print("No potential partners data to migrate")
            return 0
        
        # Insert into PostgreSQL
        pg_cursor = pg_conn.cursor()
        
        # Convert rows to list of tuples for execute_values
        # Handle potential missing columns
        values = []
        for row in rows:
            record = {}
            for col in column_names:
                if col in row.keys():
                    record[col] = row[col]
                else:
                    record[col] = None
            
            # Create a tuple with all required fields in the correct order
            # Adjust this list according to your table structure
            values.append((
                record.get('name'),
                record.get('score', 0),
                record.get('industry', ''),
                record.get('description', ''),
                record.get('leadership', ''),
                record.get('products', ''),
                record.get('opportunities', ''),
                record.get('market_analysis', ''),
                record.get('partnership_potential', ''),
                record.get('headquarters', ''),
                record.get('website', ''),
                record.get('company_size', ''),
                record.get('logo_url', ''),
                record.get('created_at'),
                record.get('last_updated')
            ))
        
        execute_values(
            pg_cursor,
            """
            INSERT INTO potential_partners 
                (name, score, industry, description, leadership, products, opportunities,
                market_analysis, partnership_potential, headquarters, website, company_size,
                logo_url, created_at, last_updated) 
            VALUES %s 
            ON CONFLICT (name) DO UPDATE SET
                score = EXCLUDED.score,
                industry = EXCLUDED.industry,
                description = EXCLUDED.description,
                leadership = EXCLUDED.leadership,
                products = EXCLUDED.products,
                opportunities = EXCLUDED.opportunities,
                market_analysis = EXCLUDED.market_analysis,
                partnership_potential = EXCLUDED.partnership_potential,
                headquarters = EXCLUDED.headquarters,
                website = EXCLUDED.website,
                company_size = EXCLUDED.company_size,
                logo_url = EXCLUDED.logo_url,
                last_updated = CURRENT_TIMESTAMP
            """,
            values
        )
        
        pg_conn.commit()
        print(f"Migrated {len(rows)} potential partners records")
        return len(rows)
    except Exception as e:
        print(f"Error migrating potential partners: {e}")
        pg_conn.rollback()
        return 0

def main():
    print("Starting migration from SQLite to PostgreSQL...")
    
    # Check if SQLite database exists
    if not os.path.exists(SQLITE_DB_PATH):
        print(f"Error: SQLite database not found at {SQLITE_DB_PATH}")
        return
    
    # Connect to databases
    sqlite_conn = connect_sqlite()
    if not sqlite_conn:
        print("Failed to connect to SQLite database")
        return
    
    pg_conn = connect_postgres()
    if not pg_conn:
        print("Failed to connect to PostgreSQL database")
        sqlite_conn.close()
        return
    
    try:
        # Perform migration for each table
        total_records = 0
        
        start_time = time.time()
        
        # Migrate tables
        total_records += migrate_search_history(sqlite_conn, pg_conn)
        total_records += migrate_previously_considered(sqlite_conn, pg_conn)
        total_records += migrate_company_research(sqlite_conn, pg_conn)
        total_records += migrate_potential_partners(sqlite_conn, pg_conn)
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"Migration completed successfully. Migrated {total_records} records in {duration:.2f} seconds.")
    
    except Exception as e:
        print(f"Error during migration: {e}")
    
    finally:
        # Close connections
        sqlite_conn.close()
        pg_conn.close()

if __name__ == "__main__":
    main() 