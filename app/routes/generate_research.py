from flask import Blueprint, request, jsonify
from app.models.database import supabase_client
import traceback
import requests
import os
# import time  # Not used
from datetime import datetime
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

generate_research_bp = Blueprint('generate_research', __name__)

@generate_research_bp.route('/api/generate-partner-research', methods=['POST'])
def generate_partner_research():
    """Generate research for a partner using Perplexity API"""
    print("POST /api/generate-partner-research - Request received")
    try:
        data = request.json
        print(f"POST /api/generate-partner-research - Request data: {data}")

        if not data or not data.get('partner_id') or not data.get('partner_name'):
            print("POST /api/generate-partner-research - Missing required fields")
            return jsonify({
                'success': False,
                'message': 'Missing required fields: partner_id and partner_name are required'
            }), 400

        partner_id = data.get('partner_id')
        partner_name = data.get('partner_name')
        industry = data.get('industry', '')
        print(f"POST /api/generate-partner-research - Processing for partner: {partner_name} (ID: {partner_id})")

        # Check if Supabase client is available
        if not supabase_client:
            return jsonify({
                'success': False,
                'message': 'Database connection not available'
            }), 500

        # Verify that the partner exists in the potential_partners table
        try:
            partner_check = supabase_client.table('potential_partners').select('id').eq('id', partner_id).execute()
            if not partner_check.data or len(partner_check.data) == 0:
                print(f"ERROR: Partner with ID {partner_id} does not exist in potential_partners table")
                return jsonify({
                    'success': False,
                    'message': f'Partner with ID {partner_id} does not exist in the database'
                }), 404
            print(f"Partner with ID {partner_id} exists in the database")
        except Exception as e:
            print(f"Error checking if partner exists: {str(e)}")
            # Continue anyway, but log the error

        # Check if we already have research data for this partner
        try:
            result = supabase_client.table('partner_research').select('*').eq('partner_id', partner_id).execute()
            print(f"Supabase query result: {result}")
            if hasattr(result, 'data') and result.data:
                print(f"Found existing research for {partner_name}: {result.data[0]}")
                return jsonify({'success': True, 'research': result.data[0]}), 200
        except Exception as e:
            print(f"Error checking existing research: {str(e)}")
            # Continue to generate new research

        perplexity_api_url = os.environ.get('PERPLEXITY_API_URL', 'https://api.perplexity.ai')
        perplexity_api_key = os.environ.get('PERPLEXITY_API_KEY')
        if not perplexity_api_key:
            print('No Perplexity API key found in environment.')
            return jsonify({'success': False, 'message': 'No Perplexity API key configured.'}), 500

        session = requests.Session()
        retries = Retry(total=3, backoff_factor=0.5)
        session.mount('https://', HTTPAdapter(max_retries=retries))

        query = f"""Business intelligence report on {partner_name}{industry and f' ({industry})' or ''}:
1. Overview (founding, headquarters)
2. Leadership (CEO, executive team, key leaders)
3. Business Model & Revenue
4. Market Position
5. Competitors
6. Financial Performance
7. Partnerships & Strategy (include current marketing partnerships and any sports-related partnerships)
8. Opportunities for MLSE Partnership"""

        payload = {
            "model": "sonar-pro",
            "messages": [
                {"role": "system", "content": "You are a business analyst providing factual company research. Format your response with proper Markdown syntax for modern display:\n\n1. Use '## ' (with a space after) for main section headings\n2. Use '### ' for subsection headings\n3. Use **bold** for important facts, metrics, and key points\n4. Use bullet lists (- item) for listing items\n5. Use numbered lists (1. item) for sequential information\n6. Use > for notable quotes or highlights\n7. Include line breaks between sections\n8. Format financial figures consistently (e.g., $10.5M, 23%)\n9. Use tables for comparative data where appropriate\n10. Ensure each section is clearly separated\n\nFor the Leadership section, be thorough and include:\n- The **CEO's full name and background**\n- **Names and roles of key executives** (C-suite, founders, etc.)\n- Brief background on key leaders when available\n- Leadership changes or notable history\n\nFor the Partnerships & Strategy section, be thorough and include:\n- **Current marketing partnerships** the company has\n- **Sports-related partnerships** (especially with sports arenas, teams, or leagues)\n- Details on partnership terms and duration when available\n- History of past significant partnerships\n- Partnership strategy and approach\n\nDo NOT use any special characters that might break Markdown formatting. Keep your response well-structured, visually appealing, and easy to read. Each section should be comprehensive but concise."},
                {"role": "user", "content": query}
            ],
            "max_tokens": 4096,
            "temperature": 0.7
        }

        print(f"Sending request to Perplexity API with sonar model. Query: {query}\nPayload: {payload}")
        try:
            perplexity_response = session.post(
                f"{perplexity_api_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {perplexity_api_key}",
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=180  # Increased to 3 minutes
            )
            print(f"Perplexity API raw response: {perplexity_response.status_code} {perplexity_response.text}")
            perplexity_response.raise_for_status()
            response_json = perplexity_response.json()
            print(f"Perplexity API response: {response_json}")
            content = response_json['choices'][0]['message']['content']
            source = "perplexity"
            print(f"Successfully generated research using Perplexity API")
        except Exception as e:
            print(f"Error calling Perplexity API: {e}\n{traceback.format_exc()}")
            return jsonify({'success': False, 'message': f'Error calling Perplexity API: {e}'}), 500

        # Save the research data to the database
        current_timestamp = datetime.now().isoformat()

        # Save to partner_research table
        try:
            print(f"Saving research data for partner ID {partner_id} ({partner_name})")
            save_result = supabase_client.table('partner_research').upsert({
                "partner_id": partner_id,
                "partner_name": partner_name,
                "data": content,
                "source": source,
                "created_at": current_timestamp,
                "updated_at": current_timestamp
            }).execute()
            print(f"Successfully saved research data: {save_result}")
        except Exception as e:
            print(f"Error saving research data to partner_research table: {str(e)}")
            traceback.print_exc()
            return jsonify({
                'success': False,
                'message': f'Error saving research data: {str(e)}'
            }), 500

        # Update the partner record to indicate it has been researched
        try:
            print(f"Updating potential_partners record for partner ID {partner_id}")
            update_result = supabase_client.table('potential_partners').update({
                "has_research": True,
                "research_source": source,
                "research_date": current_timestamp,
                "updated_at": current_timestamp
            }).eq('id', partner_id).execute()
            print(f"Successfully updated partner record: {update_result}")
        except Exception as e:
            print(f"Error updating potential_partners record: {str(e)}")
            traceback.print_exc()
            # Continue anyway since we've already saved the research data

        return jsonify({
            'success': True,
            'message': 'Research generated successfully',
            'data': content,
            'source': source,
            'updated_at': current_timestamp
        })

    except Exception as e:
        print(f"Error generating partner research: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@generate_research_bp.route('/api/company-research/<partner>', methods=['GET'])
def get_company_research(partner):
    """Fetch research for a specific company by partner name or ID."""
    try:
        print(f"Fetching company research for partner: {partner}")
        print(f"Supabase client: {supabase_client}")
        # Print environment variables related to Supabase
        import os
        print(f"SUPABASE_URL: {os.environ.get('SUPABASE_URL')}")
        print(f"SUPABASE_KEY: {os.environ.get('SUPABASE_KEY')}")
        result = supabase_client.table('company_research').select('*').eq('partner_name', partner).execute()
        print(f"Supabase query result: {result}")
        if hasattr(result, 'data') and result.data:
            print(f"Found research for {partner}: {result.data[0]}")
            return jsonify({'success': True, 'research': result.data[0]}), 200
        else:
            print(f"No research found for {partner}")
            return jsonify({'success': False, 'message': 'No research found for this company.'}), 404
    except Exception as e:
        print(f"Error fetching company research for {partner}: {e}\n{traceback.format_exc()}")
        return jsonify({'success': False, 'message': f'Internal server error: {e}'}), 500
