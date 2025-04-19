import os
import psycopg2
import psycopg2.extras
import urllib.parse
from dotenv import load_dotenv
import traceback

# Load environment variables
load_dotenv()

# Get database connection details from environment variables
DB_HOST = os.environ.get("SUPABASE_DB_HOST")
DB_PORT = os.environ.get("SUPABASE_DB_PORT", "5432")
DB_NAME = os.environ.get("SUPABASE_DB_NAME")
DB_USER = os.environ.get("SUPABASE_DB_USER")
DB_PASSWORD = os.environ.get("SUPABASE_DB_PASSWORD")

def get_db_connection():
    """Get a direct connection to the Supabase PostgreSQL database"""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        traceback.print_exc()
        return None

def save_partner_direct_sql(name, score, industry, description=""):
    """Save partner directly to the database using a direct SQL connection"""
    conn = get_db_connection()
    if not conn:
        print("Error: Database connection not available.")
        return False

    try:
        # Create a cursor
        cur = conn.cursor()

        # Check if partner already exists
        check_query = "SELECT id FROM potential_partners WHERE name = %s"
        cur.execute(check_query, (name,))
        existing = cur.fetchone()

        if existing:
            print(f"[DIRECT_SQL] Partner {name} already exists, updating")
            # Update the partner
            update_query = """
            UPDATE potential_partners
            SET score = %s, industry = %s, description = %s, updated_at = NOW()
            WHERE name = %s
            """

            # Ensure score is a float
            try:
                score = float(score)
            except (ValueError, TypeError):
                score = 0.0

            # Truncate description if needed
            if description and len(description) > 1000:
                description = description[:1000]

            # Execute the query
            cur.execute(update_query, (score, industry, description, name))

            # Commit the transaction
            conn.commit()

            print(f"[DIRECT_SQL] Successfully updated {name}")
            conn.close()
            return True

        # Insert the partner with timestamps
        insert_query = """
        INSERT INTO potential_partners (name, score, industry, description, created_at, updated_at)
        VALUES (%s, %s, %s, %s, NOW(), NOW())
        """

        # Ensure score is a float
        try:
            score = float(score)
        except (ValueError, TypeError):
            score = 0.0

        # Truncate description if needed
        if description and len(description) > 1000:
            description = description[:1000]

        # Execute the query
        cur.execute(insert_query, (name, score, industry, description))

        # Commit the transaction
        conn.commit()

        print(f"[DIRECT_SQL] Successfully inserted {name}")
        return True
    except Exception as e:
        print(f"[DIRECT_SQL] Error: {e}")
        traceback.print_exc()

        # Try to rollback
        try:
            conn.rollback()
        except:
            pass

        return False
    finally:
        # Close the connection
        try:
            conn.close()
        except:
            pass

def add_company_to_considered_direct_sql(company_name):
    """Add a company to the previously considered companies database using direct SQL"""
    conn = get_db_connection()
    if not conn:
        print("Error: Database connection not available.")
        return False

    try:
        # Create a cursor
        cur = conn.cursor()

        # Insert the company, ignoring if it already exists
        insert_query = """
        INSERT INTO previously_considered (company_name)
        VALUES (%s)
        ON CONFLICT (company_name) DO NOTHING
        """

        # Execute the query
        cur.execute(insert_query, (company_name,))

        # Commit the transaction
        conn.commit()

        print(f"[DIRECT_SQL] Successfully added {company_name} to previously considered")
        return True
    except Exception as e:
        print(f"[DIRECT_SQL] Error adding to previously considered: {e}")
        traceback.print_exc()

        # Try to rollback
        try:
            conn.rollback()
        except:
            pass

        return False
    finally:
        # Close the connection
        try:
            conn.close()
        except:
            pass

def add_search_to_history_direct_sql(search_type, query, results_count):
    """Add a search to the history database using direct SQL"""
    conn = get_db_connection()
    if not conn:
        print("Error: Database connection not available.")
        return False

    try:
        # Create a cursor
        cur = conn.cursor()

        # Insert the search
        insert_query = """
        INSERT INTO search_history (search_type, query, results_count)
        VALUES (%s, %s, %s)
        """

        # Execute the query
        cur.execute(insert_query, (search_type, query, results_count))

        # Commit the transaction
        conn.commit()

        print(f"[DIRECT_SQL] Successfully added search to history: {search_type} - {query}")
        return True
    except Exception as e:
        print(f"[DIRECT_SQL] Error adding search to history: {e}")
        traceback.print_exc()

        # Try to rollback
        try:
            conn.rollback()
        except:
            pass

        return False
    finally:
        # Close the connection
        try:
            conn.close()
        except:
            pass
