from flask import Blueprint, jsonify, request
from app.models.database import supabase_client
import traceback
import json

top_partners_bp = Blueprint('top_partners', __name__)

@top_partners_bp.route('/api/top-partners', methods=['GET'])
def get_top_partners():
    """Get top partners based on score"""
    try:
        # Get limit parameter, default to 10
        limit = request.args.get('limit', 10, type=int)
        
        # Check if Supabase client is available
        if not supabase_client:
            return jsonify({
                'success': False,
                'message': 'Database connection not available'
            }), 500
        
        # Query the database for top partners
        response, count = supabase_client.table('potential_partners') \
            .select('*') \
            .order('score', desc=True) \
            .limit(limit) \
            .execute()
        
        if response and len(response) > 0 and len(response[1]) > 0:
            partners = response[1]
            return jsonify({
                'success': True,
                'message': 'Top partners retrieved successfully',
                'partners': partners
            })
        else:
            return jsonify({
                'success': False,
                'message': 'No partners found',
                'partners': []
            }), 404
            
    except Exception as e:
        print(f"Error getting top partners: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}',
            'partners': []
        }), 500
