from flask import Blueprint, jsonify, request
import traceback
from app.models.database import get_potential_partners

potential_partners_bp = Blueprint('potential_partners', __name__)

@potential_partners_bp.route('/api/potential-partners', methods=['GET'])
def get_partners():
    """Get potential partners from the database with optional filtering"""
    try:
        # Get query parameters
        search_query = request.args.get('search', None)
        date_from = request.args.get('date_from', None)
        date_to = request.args.get('date_to', None)
        sort_by = request.args.get('sort_by', 'score')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Get partners from database with filtering
        partners = get_potential_partners(
            search_query=search_query,
            date_from=date_from,
            date_to=date_to,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        # Format response
        print(f"Returning {len(partners)} potential partners")
        return jsonify({
            "status": "success",
            "partners": partners
        })
    except Exception as e:
        print(f"Error getting potential partners: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
