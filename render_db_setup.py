#!/usr/bin/env python3
"""
Database setup script for Render deployment
This ensures the SQLite database exists and is properly configured
"""

import os
import sqlite3
import sys

DB_PATH = os.environ.get('DB_PATH', 'dura_history.db')

def init_db():
    """Initialize the database with the required tables"""
    try:
        print(f"Setting up database at {DB_PATH}...")
        
        # Connect to the database (or create it if it doesn't exist)
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Create table for search history if it doesn't exist
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS search_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            search_type TEXT NOT NULL,
            query TEXT NOT NULL,
            results_count INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Create table for previously considered companies
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS previously_considered (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT NOT NULL UNIQUE,
            considered_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Create table for storing company research data
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS company_research (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT NOT NULL UNIQUE,
            research_data TEXT NOT NULL,
            source TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Check and create potential_partners table with enhanced structure
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='potential_partners'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            # Create a new potential_partners table with enhanced structure
            cursor.execute('''
            CREATE TABLE potential_partners (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                score REAL NOT NULL,
                industry TEXT NOT NULL,
                description TEXT,
                leadership TEXT, 
                products TEXT,
                opportunities TEXT,
                market_analysis TEXT,
                partnership_potential TEXT,
                headquarters TEXT,
                website TEXT,
                company_size TEXT,
                logo_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            ''')
            print("Created potential_partners table with enhanced structure")
        
        # Commit changes and close connection
        conn.commit()
        conn.close()
        
        print("Database initialized successfully!")
        return True
    except sqlite3.Error as e:
        print(f"Database error during initialization: {e}")
        return False
    except Exception as e:
        print(f"Error initializing database: {e}")
        return False

if __name__ == "__main__":
    success = init_db()
    sys.exit(0 if success else 1) 