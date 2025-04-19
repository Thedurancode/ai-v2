from flask import Blueprint, request, jsonify
from app.models.database import supabase_client
from app.utils.helpers import transform_research_for_pdf
import traceback
import json
from datetime import datetime

partner_research_bp = Blueprint('partner_research', __name__)

@partner_research_bp.route('/api/partner-research', methods=['POST'])
def save_partner_research():
    """Save partner research data to the database"""
    try:
        data = request.json

        if not data or not data.get('partner_id') or not data.get('research_data'):
            return jsonify({
                'success': False,
                'message': 'Missing required fields: partner_id and research_data are required'
            }), 400

        partner_id = data.get('partner_id')
        partner_name = data.get('partner_name', '')
        raw_research_data = data.get('research_data')
        source = data.get('source', 'unknown')
        
        # Transform research data for PDF generation
        research_data = transform_research_for_pdf(raw_research_data)

        # Check if Supabase client is available
        if not supabase_client:
            return jsonify({
                'success': False,
                'message': 'Database connection not available'
            }), 500

        # Use upsert to replace any existing data in the research table
        response, count = supabase_client.table('partner_research').upsert({
            "partner_id": partner_id,
            "partner_name": partner_name,
            "data": research_data,
            "source": source
        }).execute()

        # Also update the partner record to indicate it has been researched
        try:
            # First check if the partner exists
            partner_response, partner_count = supabase_client.table('potential_partners').select('*').eq('id', partner_id).execute()

            if partner_response and len(partner_response) > 0 and len(partner_response[1]) > 0:
                # Update the existing partner record
                current_timestamp = datetime.now().isoformat()
                supabase_client.table('potential_partners').update({
                    "has_research": True,
                    "research_source": source,
                    "research_date": current_timestamp,
                    "last_updated": current_timestamp
                }).eq('id', partner_id).execute()
                print(f"Updated partner record for {partner_name} with research flag")
        except Exception as partner_error:
            print(f"Error updating partner record: {str(partner_error)}")
            # Continue even if this part fails

        if response and len(response) > 0:
            return jsonify({
                'success': True,
                'message': f'Research data for partner {partner_name} saved successfully'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to save research data'
            }), 500

    except Exception as e:
        print(f"Error saving partner research: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@partner_research_bp.route('/api/partner-research/<partner_id>', methods=['GET'])
def get_partner_research(partner_id):
    """Get partner research data from the database"""
    print(f"GET /api/partner-research/{partner_id} - Request received")
    try:
        # Check if Supabase client is available
        if not supabase_client:
            print(f"GET /api/partner-research/{partner_id} - Supabase client not available")
            return jsonify({
                'success': False,
                'message': 'Database connection not available'
            }), 500

        # Check if we should force a refresh
        force_refresh = request.args.get('refresh', 'false').lower() == 'true'
        print(f"GET /api/partner-research/{partner_id} - Force refresh: {force_refresh}")

        # Query the database for research data
        print(f"GET /api/partner-research/{partner_id} - Querying database")
        response, count = supabase_client.table('partner_research').select('*').eq('partner_id', partner_id).execute()

        if response and len(response) > 0 and len(response[1]) > 0:
            research = response[1][0]  # Get the first matching record
            print(f"GET /api/partner-research/{partner_id} - Research found")
            return jsonify({
                'success': True,
                'message': 'Research data retrieved successfully',
                'research': research
            })
        else:
            print(f"GET /api/partner-research/{partner_id} - No research found")
            return jsonify({
                'success': False,
                'message': 'No research data found for this partner',
                'research': None
            }), 404

    except Exception as e:
        print(f"GET /api/partner-research/{partner_id} - Error: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}',
            'research': None
        }), 500
