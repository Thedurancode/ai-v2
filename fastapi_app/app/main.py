import os
import requests
import json
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime
import base64
import re
import random
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
import sqlite3
from threading import Thread
import sys

# Import utility functions
from .utils import (
    search_companies_in_industry,
    extract_company_names,
    generate_company_analysis,
    process_company,
    CURRENT_PARTNERS,
    SCORING_CRITERIA
)

# Load environment variables
load_dotenv()

# Get port from environment variable for Fly.io
PORT = int(os.getenv("PORT", 8080))
HOST = os.getenv("HOST", "0.0.0.0")

print(f"Configured to listen on {HOST}:{PORT}")
print(f"Python version: {sys.version}")
print(f"Environment: {os.environ.get('FLY_APP_NAME', 'development')}")

app = FastAPI(
    title="Dura API", 
    description="API for Dura partnership search and analysis",
    docs_url="/docs", 
    redoc_url="/redoc",
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://search-beta-mlse-1.netlify.app",
        "http://localhost:3000",  # For local development
        "http://localhost:5000",
        "*"  # Keep wildcard temporarily during development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DB_PATH = os.getenv('DB_PATH', 'dura_history.db')
print(f"Using database at: {DB_PATH}")

# Global variables
previously_considered_companies = set()
search_history = []
search_status = {
    "status": "idle",
    "message": "No search in progress",
    "progress": 0,
    "results": None,
    "error": None
}

# Pydantic models for request and response validation
class SearchQuery(BaseModel):
    query: str

class SearchResponse(BaseModel):
    industry: str
    analysis: Dict[str, Any]
    search_results: List[Any]
    scoring_criteria: Dict[str, Any]
    max_total_score: float

class ErrorResponse(BaseModel):
    error: str

# Database functions
def init_db():
    """Initialize the database with the required tables"""
    try:
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
        
        # Check if potential_partners table exists
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
            print("Created new potential_partners table with enhanced structure")
        else:
            # Check if the table needs to be updated with new columns
            cursor.execute("PRAGMA table_info(potential_partners)")
            columns = cursor.fetchall()
            column_names = [column[1] for column in columns]
            
            # We're checking if the table is using the old schema or the new one
            if 'company_name' in column_names and 'name' not in column_names:
                # This is the old schema, we need to migrate the data
                print("Migrating potential_partners table to new schema...")
                
                # Create a new table with the enhanced structure
                cursor.execute('''
                CREATE TABLE potential_partners_new (
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
                
                # Copy data from old table to new table
                cursor.execute('''
                INSERT INTO potential_partners_new 
                    (name, score, industry, description, logo_url, created_at)
                SELECT 
                    company_name, partnership_score, industry, description, logo_url, saved_at
                FROM potential_partners
                ''')
                
                # Drop the old table
                cursor.execute('DROP TABLE potential_partners')
                
                # Rename the new table to the original name
                cursor.execute('ALTER TABLE potential_partners_new RENAME TO potential_partners')
                
                print("Migration completed successfully")
            else:
                # Check for missing columns in the current schema
                required_columns = ['leadership', 'products', 'opportunities', 'market_analysis', 
                                   'partnership_potential', 'headquarters', 'website', 'company_size']
                
                for column in required_columns:
                    if column not in column_names:
                        # Add the missing column
                        print(f"Adding missing column: {column}")
                        cursor.execute(f"ALTER TABLE potential_partners ADD COLUMN {column} TEXT")
        
        # Commit changes and close connection
        conn.commit()
        conn.close()
        
        print("Database initialized successfully")
        
        # Load previously considered companies
        load_previously_considered()
        
        # Load search history
        load_search_history()
        
        return True
    except sqlite3.Error as e:
        print(f"Database error during initialization: {e}")
        return False
    except Exception as e:
        print(f"Error initializing database: {e}")
        return False

def load_previously_considered():
    """Load previously considered companies from database to in-memory set"""
    global previously_considered_companies
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT company_name FROM previously_considered")
        companies = cursor.fetchall()
        conn.close()
        
        previously_considered_companies = set(company[0] for company in companies)
        print(f"Loaded {len(previously_considered_companies)} previously considered companies")
        return True
    except Exception as e:
        print(f"Error loading previously considered companies: {str(e)}")
        return False

def load_search_history():
    """Load search history from database to in-memory list"""
    global search_history
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT timestamp, search_type, query, results_count FROM search_history ORDER BY timestamp DESC LIMIT 100")
        history_items = cursor.fetchall()
        conn.close()
        
        search_history = [{
            "timestamp": item[0],
            "type": item[1],
            "query": item[2],
            "results_count": item[3]
        } for item in history_items]
        
        print(f"Loaded {len(search_history)} search history items")
        return True
    except Exception as e:
        print(f"Error loading search history: {str(e)}")
        return False

def add_search_to_history(search_type, query, results_count):
    """Add a search to the history database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        cursor.execute(
            "INSERT INTO search_history (timestamp, search_type, query, results_count) VALUES (?, ?, ?, ?)",
            (timestamp, search_type, query, results_count)
        )
        
        conn.commit()
        conn.close()
        
        # Also update in-memory search history for current session
        search_history.append({
            "timestamp": timestamp,
            "type": search_type,
            "query": query,
            "results_count": results_count
        })
        
        return True
    except Exception as e:
        print(f"Error adding search to history: {str(e)}")
        return False

def add_company_to_considered(company_name):
    """Add a company to the previously considered companies database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        cursor.execute(
            "INSERT OR IGNORE INTO previously_considered (company_name, considered_at) VALUES (?, ?)",
            (company_name, timestamp)
        )
        
        conn.commit()
        conn.close()
        
        # Also update in-memory set for current session
        previously_considered_companies.add(company_name)
        
        return True
    except Exception as e:
        print(f"Error adding company to previously considered: {str(e)}")
        return False

def save_potential_partner(company, industry):
    """Save company to potential_partners table"""
    try:
        # Safety check on input
        if not company or not isinstance(company, dict):
            print(f"Error: Invalid company data for save_potential_partner: {company}")
            return False
            
        name = company.get('name')
        if not name or not isinstance(name, str) or len(name.strip()) == 0:
            print(f"Error: Invalid company name for save_potential_partner: {name}")
            return False
            
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if company already exists
        cursor.execute("SELECT id FROM potential_partners WHERE name = ?", (name,))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing company
            cursor.execute('''
            UPDATE potential_partners SET 
                score = ?,
                industry = ?,
                description = ?,
                leadership = ?,
                products = ?,
                opportunities = ?,
                market_analysis = ?,
                partnership_potential = ?,
                headquarters = ?,
                website = ?,
                company_size = ?,
                logo_url = ?,
                last_updated = ?
            WHERE name = ?
            ''', (
                company.get('score', 0),
                industry,
                company.get('description', ''),
                company.get('leadership', ''),
                company.get('products', ''),
                company.get('opportunities', ''),
                company.get('market_analysis', ''),
                company.get('partnership_potential', ''),
                company.get('headquarters', ''),
                company.get('website', ''),
                company.get('company_size', ''),
                company.get('logo_url', ''),
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                name
            ))
            
            print(f"Updated existing potential partner: {name}")
        else:
            # Insert new company
            cursor.execute('''
            INSERT INTO potential_partners (
                name, score, industry, description, leadership, products, opportunities,
                market_analysis, partnership_potential, headquarters, website, company_size,
                logo_url, created_at, last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                name,
                company.get('score', 0),
                industry,
                company.get('description', ''),
                company.get('leadership', ''),
                company.get('products', ''),
                company.get('opportunities', ''),
                company.get('market_analysis', ''),
                company.get('partnership_potential', ''),
                company.get('headquarters', ''),
                company.get('website', ''),
                company.get('company_size', ''),
                company.get('logo_url', ''),
                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            ))
            
            print(f"Inserted new potential partner: {name}")
            
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving potential partner: {str(e)}")
        traceback.print_exc()
        return False

# Application startup event
@app.on_event("startup")
async def startup_event():
    """Initialize the application on startup"""
    print("====== Application Starting Up ======")
    print(f"FastAPI running on {HOST}:{PORT}")
    print(f"Database path: {DB_PATH}")
    
    # Initialize the database
    init_db_result = init_db()
    print(f"Database initialization result: {init_db_result}")
    
    # Print out environment information
    print(f"Environment variables:")
    for key in ['FLY_APP_NAME', 'FLY_REGION', 'PORT', 'HOST']:
        print(f"  {key}: {os.environ.get(key, 'Not set')}")
        
    print("======= Startup Complete =======")

# Implement the example API routes
@app.get("/api-config")
async def api_config():
    """Return API configuration for frontend clients"""
    app_name = os.getenv("FLY_APP_NAME", "dura-api")
    is_production = os.getenv("FLY_REGION", "") != ""
    
    return {
        "api_base_url": f"https://{app_name}.fly.dev" if is_production else "http://localhost:8080",
        "version": "1.0.0",
        "environment": "production" if is_production else "development",
        "docs_url": f"https://{app_name}.fly.dev/docs" if is_production else "http://localhost:8080/docs"
    }

@app.get("/")
async def root():
    """Root endpoint for health checks"""
    return {"status": "ok", "message": "Dura API is running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "environment": os.getenv("FLY_APP_NAME", "development"),
        "db_connected": check_db_connection(),
        "python_version": sys.version
    }

def check_db_connection():
    """Check if the database is accessible"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        conn.close()
        return True
    except Exception as e:
        print(f"Database connection error: {str(e)}")
        return False

@app.get("/search-status")
async def get_search_status():
    """Get the current status of the search process"""
    global search_status
    return search_status

@app.post("/api/search", response_model=Union[SearchResponse, Dict[str, Any]], responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def search(search_data: SearchQuery):
    try:
        global search_status
        global previously_considered_companies
        
        # Generate a unique search ID
        search_id = datetime.now().strftime("%Y%m%d%H%M%S")
        
        # Reset search status
        search_status = {
            "status": "starting",
            "message": "Initiating search process",
            "progress": 5,
            "results": None,
            "error": None
        }
        
        query = search_data.query
        
        # Validate the query
        if not query or not isinstance(query, str) or len(query.strip()) == 0:
            search_status.update({
                "status": "error",
                "message": "Please provide a valid search query",
                "progress": 100,
                "completed": True
            })
            raise HTTPException(status_code=400, detail="Please provide a valid search query")
        
        # Normalize the query
        query = query.strip()
        
        # Get Exa API key from environment
        exa_api_key = os.getenv('EXA_API_KEY')
        if not exa_api_key:
            search_status.update({
                "status": "error",
                "message": "API key not configured",
                "progress": 100,
                "completed": True
            })
            raise HTTPException(status_code=500, detail="EXA_API_KEY not found in environment variables")
        
        # Update status - starting search
        search_status.update({
            "status": "searching",
            "message": f"Searching for companies related to: {query}",
            "progress": 10
        })
        
        # Search for companies in the industry
        search_results = search_companies_in_industry(query, exa_api_key)
        
        # Update status - extracting companies
        search_status.update({
            "status": "extracting",
            "message": "Extracting company names from search results",
            "progress": 30
        })
        
        # Extract company names from search results
        company_names = extract_company_names(search_results, query)
        
        # Add debug logging
        print(f"DEBUG: Extracted {len(company_names)} raw company names: {company_names}")
        
        # Filter out companies that are already partners
        current_partner_names = [p['name'] for p in CURRENT_PARTNERS]
        
        # Log checking against current partners
        print(f"Checking {len(company_names)} potential companies against {len(current_partner_names)} current partners")
        print(f"DEBUG: Current partners: {current_partner_names}")
        
        # Check for exact matches with current partners
        exact_matches = [name for name in company_names if name in current_partner_names]
        if exact_matches:
            print(f"Warning: Found {len(exact_matches)} companies that are already partners: {', '.join(exact_matches)}")
            
        filtered_companies = [name for name in company_names if name not in current_partner_names]
        print(f"DEBUG: After partner filtering: {len(filtered_companies)} companies remain: {filtered_companies}")
        
        search_status.update({
            "message": f"Found {len(filtered_companies)} potential companies after filtering out existing partners",
            "progress": 32
        })
        
        # Filter out previously considered companies
        not_previously_considered = [name for name in filtered_companies if name not in previously_considered_companies]
        print(f"DEBUG: After previously considered filtering: {len(not_previously_considered)} new companies: {not_previously_considered}")
        
        search_status.update({
            "message": f"Filtered out {len(filtered_companies) - len(not_previously_considered)} previously considered companies",
            "progress": 35
        })
        
        # Add newly considered companies to our tracking set
        for name in not_previously_considered:
            add_company_to_considered(name)
            
        print(f"Previously considered companies (total: {len(previously_considered_companies)}): {previously_considered_companies}")
        
        # Limit to 20 companies for analysis (changed from 10)
        # MODIFIED: Use filtered_companies instead of not_previously_considered if no new companies found
        companies_to_analyze = not_previously_considered[:20] if not_previously_considered else filtered_companies[:20]
        
        search_status.update({
            "message": f"Selected {len(companies_to_analyze)} companies for analysis",
            "progress": 40
        })
        
        # If no companies found at all, return error
        if not companies_to_analyze:
            search_status.update({
                "status": "error",
                "message": "No companies found in this industry. Try a different industry.",
                "progress": 100,
                "completed": True
            })
            raise HTTPException(
                status_code=404,
                detail={
                    'error': 'No companies found in this industry. Try a different industry.',
                    'industry': query,
                    'search_results': search_results,
                    'previously_considered_count': len(previously_considered_companies)
                }
            )
        
        # ADDED: Flag to indicate if these are new companies or previously analyzed ones
        are_new_companies = len(not_previously_considered) > 0
        
        # Update search_status with a note if we're reusing old companies
        if not are_new_companies:
            search_status.update({
                "status": "reusing",
                "message": "No new companies found. Showing previously analyzed companies.",
                "progress": 45
            })
            
        # Update status - analyzing companies
        search_status.update({
            "status": "analyzing" if are_new_companies else "reusing",
            "message": "Analyzing companies and checking for competition with current partners",
            "progress": 50
        })
        
        # Generate analysis for the companies
        analysis = generate_company_analysis(companies_to_analyze, query)
        
        # MODIFIED: Update the completion status message based on whether these are new or previously analyzed companies
        search_status_message = "Search completed"
        if not are_new_companies:
            search_status_message += " (showing previously analyzed companies as no new companies were found)"
        
        # Calculate max total score
        max_total_score = sum(criteria['max_points'] for criteria in SCORING_CRITERIA.values())
        
        # Update status - enriching data
        search_status.update({
            "status": "enriching",
            "message": f"Enriching data for all {len(analysis['companies'])} companies",
            "progress": 80
        })
        
        # Process all companies in parallel
        all_company_names = [company['name'] for company in analysis['companies']]
        search_status.update({
            "message": f"Processing all companies in parallel: {', '.join(all_company_names)}",
            "progress": 85
        })
        
        # Process companies in parallel using ThreadPoolExecutor
        # Use more workers for better parallelization (adjust based on your system)
        max_workers = min(20, len(analysis['companies']))
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Create futures for each company
            future_to_company = {executor.submit(process_company, company): company for company in analysis['companies']}
            
            # Process results as they complete
            completed = 0
            total = len(future_to_company)
            for future in as_completed(future_to_company):
                completed += 1
                progress = 85 + (completed / total * 10)  # Scale from 85 to 95
                search_status.update({
                    "message": f"Processed {completed}/{total} companies",
                    "progress": progress
                })
        
        # Calculate summary metrics
        final_competing_count = sum(1 for company in analysis['companies'] if company.get('competes_with_partners', False))
        final_enriched_count = sum(1 for company in analysis['companies'] if company.get('enriched', False))
        
        # Save non-conflicting companies to potential partners database
        saved_count = 0
        for company in analysis['companies']:
            if not company.get('competes_with_partners', False) and not company.get('has_competition', False):
                if save_potential_partner(company, query):
                    saved_count += 1
        
        # Update status - completed
        search_status.update({
            "status": "completed" if are_new_companies else "completed_with_previous",
            "message": f"{search_status_message}: Found {len(analysis['companies'])} companies, saved {saved_count} non-conflicting companies to database",
            "progress": 100,
            "completed": True
        })
        
        return {
            'industry': query,
            'analysis': analysis,
            'search_results': search_results,
            'scoring_criteria': SCORING_CRITERIA,
            'max_total_score': max_total_score
        }
    
    except HTTPException as e:
        # For HTTP exceptions that we raise ourselves, propagate them directly
        raise e
    except Exception as e:
        # Update search status in error cases
        search_status.update({
            "status": "error",
            "message": f"Error in search: {str(e)}",
            "progress": 100,
            "completed": True,
            "error": str(e)
        })
        print(f"Error in search: {e}")
        traceback.print_exc()  # Add traceback for better debugging
        raise HTTPException(status_code=500, detail=str(e))

# Add static file serving if needed
# app.mount("/static", StaticFiles(directory="static"), name="static") 

# Add a new endpoint to clear previously considered companies for testing
@app.post("/api/reset-considered")
async def reset_considered():
    """Reset the list of previously considered companies (for testing purposes)"""
    global previously_considered_companies
    
    try:
        # Save current count for reporting
        old_count = len(previously_considered_companies)
        
        # Connect to the database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Delete all records from the previously_considered table
        cursor.execute("DELETE FROM previously_considered")
        conn.commit()
        conn.close()
        
        # Reset in-memory set
        previously_considered_companies = set()
        
        return {"status": "success", "message": f"Reset {old_count} previously considered companies"}
    except Exception as e:
        print(f"Error resetting considered companies: {str(e)}")
        return {"status": "error", "message": str(e)} 