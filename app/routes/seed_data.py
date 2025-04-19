from flask import Blueprint, jsonify
from app.models.database import supabase_client
import traceback
import json
import random
from datetime import datetime, timedelta

seed_data_bp = Blueprint('seed_data', __name__)

@seed_data_bp.route('/api/seed-history', methods=['POST'])
def seed_history():
    """Seed search history data if empty"""
    try:
        # Check if Supabase client is available
        if not supabase_client:
            return jsonify({
                'success': False,
                'message': 'Database connection not available'
            }), 500
        
        # Check if we already have search history data
        response, count = supabase_client.table('search_history').select('*').execute()
        
        if response and len(response) > 0 and len(response[1]) > 0:
            return jsonify({
                'success': True,
                'message': 'Search history already exists',
                'count': len(response[1])
            })
        
        # Sample search history data
        sample_searches = [
            {"query": "tech companies in Toronto", "timestamp": (datetime.now() - timedelta(days=5)).isoformat()},
            {"query": "financial services", "timestamp": (datetime.now() - timedelta(days=4)).isoformat()},
            {"query": "retail brands", "timestamp": (datetime.now() - timedelta(days=3)).isoformat()},
            {"query": "sports apparel", "timestamp": (datetime.now() - timedelta(days=2)).isoformat()},
            {"query": "media companies", "timestamp": (datetime.now() - timedelta(days=1)).isoformat()},
        ]
        
        # Insert sample data
        for search in sample_searches:
            supabase_client.table('search_history').insert(search).execute()
        
        return jsonify({
            'success': True,
            'message': 'Successfully seeded search history data',
            'count': len(sample_searches)
        })
            
    except Exception as e:
        print(f"Error seeding search history: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@seed_data_bp.route('/api/seed-company-history', methods=['POST'])
def seed_company_history():
    """Seed company history data"""
    try:
        # Check if Supabase client is available
        if not supabase_client:
            return jsonify({
                'success': False,
                'message': 'Database connection not available'
            }), 500
        
        # Sample company data
        sample_companies = [
            {
                "name": "Rogers Communications",
                "industry": "Telecommunications",
                "status": "Contacted",
                "score": 85,
                "last_updated": (datetime.now() - timedelta(days=30)).isoformat(),
                "notes": "Initial meeting scheduled for next month"
            },
            {
                "name": "TD Bank",
                "industry": "Financial Services",
                "status": "Negotiating",
                "score": 92,
                "last_updated": (datetime.now() - timedelta(days=15)).isoformat(),
                "notes": "Discussing partnership terms"
            },
            {
                "name": "Lululemon",
                "industry": "Retail",
                "status": "Interested",
                "score": 78,
                "last_updated": (datetime.now() - timedelta(days=7)).isoformat(),
                "notes": "Follow-up call scheduled"
            },
            {
                "name": "Shopify",
                "industry": "Technology",
                "status": "Contacted",
                "score": 88,
                "last_updated": (datetime.now() - timedelta(days=21)).isoformat(),
                "notes": "Waiting for response from their team"
            },
            {
                "name": "Air Canada",
                "industry": "Travel",
                "status": "Not Interested",
                "score": 65,
                "last_updated": (datetime.now() - timedelta(days=45)).isoformat(),
                "notes": "Not pursuing at this time"
            }
        ]
        
        # Insert sample data
        for company in sample_companies:
            # Check if company already exists
            response, count = supabase_client.table('potential_partners').select('*').eq('name', company['name']).execute()
            
            if response and len(response) > 0 and len(response[1]) > 0:
                # Update existing company
                supabase_client.table('potential_partners').update(company).eq('name', company['name']).execute()
            else:
                # Insert new company
                supabase_client.table('potential_partners').insert(company).execute()
        
        return jsonify({
            'success': True,
            'message': 'Successfully seeded company history data',
            'count': len(sample_companies)
        })
            
    except Exception as e:
        print(f"Error seeding company history: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500
