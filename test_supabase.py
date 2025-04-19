#!/usr/bin/env python3
"""
Test script to verify Supabase database connection and operations
"""

import os
from dotenv import load_dotenv
import db
import traceback
import json

def test_supabase_connection():
    """Test Supabase database connection and basic operations"""
    print("Testing Supabase database connection...")
    
    # Load environment variables
    load_dotenv()
    
    try:
        # Initialize database
        print("\n1. Initializing database...")
        result = db.init_db()
        print(f"Database initialization result: {result}")
        
        # Test database connection
        print("\n2. Testing database connection...")
        connection_result = db.check_db_connection()
        print(f"Database connection result: {connection_result}")
        
        # Add a test search to history
        print("\n3. Adding a test search to history...")
        search_result = db.add_search_to_history(
            search_type="supabase_test",
            query="Testing Supabase connection",
            results_count=0
        )
        print(f"Add search result: {search_result}")
        
        # Get recent searches
        print("\n4. Getting recent searches...")
        searches = db.get_recent_searches(5)
        print(f"Retrieved {len(searches)} searches:")
        for search in searches:
            print(f"  - {search['timestamp']}: {search['type']} - {search['query']}")
        
        # Add a test company to previously considered
        print("\n5. Adding a test company to previously considered...")
        company_result = db.add_previously_considered("Test Company")
        print(f"Add company result: {company_result}")
        
        # Get previously considered companies
        print("\n6. Getting previously considered companies...")
        companies = db.get_previously_considered()
        print(f"Retrieved {len(companies)} companies:")
        for company in companies:
            print(f"  - {company}")
        
        # Add a test potential partner
        print("\n7. Adding a test potential partner...")
        partner_data = {
            "name": "Test Partner",
            "score": 8.5,
            "industry": "Technology",
            "description": "A test company for Supabase integration",
            "leadership": json.dumps(["CEO: Test Person"]),
            "products": json.dumps(["Test Product 1", "Test Product 2"]),
            "opportunities": json.dumps(["Opportunity 1", "Opportunity 2"]),
            "market_analysis": json.dumps({"market_size": "$1B", "growth_rate": "10%"}),
            "partnership_potential": json.dumps({"synergy": "High", "risk": "Low"}),
            "headquarters": "Test City, Test Country",
            "website": "https://testpartner.com",
            "company_size": "100-500",
            "logo_url": "https://testpartner.com/logo.png"
        }
        partner_result = db.add_potential_partner(partner_data)
        print(f"Add partner result: {partner_result}")
        
        # Get potential partners
        print("\n8. Getting potential partners...")
        partners = db.get_potential_partners()
        print(f"Retrieved {len(partners)} partners:")
        for partner in partners[:3]:  # Show only first 3 to avoid too much output
            print(f"  - {partner['name']} ({partner['industry']}): {partner['score']}")
            
        print("\nAll tests completed successfully!")
        return True
        
    except Exception as e:
        print(f"Error during Supabase testing: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_supabase_connection()
