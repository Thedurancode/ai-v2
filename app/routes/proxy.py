from flask import Blueprint, jsonify, request, redirect, current_app
import requests
import traceback

# Create proxy blueprint
proxy_bp = Blueprint('proxy', __name__)

@proxy_bp.route('/search-status', methods=['GET'])
def proxy_search_status():
    """Proxy for search status endpoint"""
    return redirect('/api/search-status')

@proxy_bp.route('/search', methods=['POST'])
def proxy_search():
    """Proxy for search endpoint"""
    return redirect('/api/search')

@proxy_bp.route('/reset-history', methods=['POST'])
def proxy_reset_history():
    """Proxy for reset history endpoint"""
    return redirect('/api/reset-history')

@proxy_bp.route('/search-history', methods=['GET'])
def proxy_search_history():
    """Proxy for search history endpoint"""
    return redirect('/api/search-history')

@proxy_bp.route('/history', methods=['GET'])
def proxy_history():
    """Proxy for full history endpoint"""
    return redirect('/api/history')

@proxy_bp.route('/test-perplexity', methods=['GET'])
def test_perplexity_endpoint():
    """Test endpoint to check Perplexity API integration"""
    try:
        api_key = request.args.get('key')
        if not api_key:
            return jsonify({"error": "API key required"}), 400
            
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'model': 'sonar-small-online', # or pplx-7b-online, pplx-70b-online, etc.
            'prompt': 'What is the capital of France?',
            'temperature': 0.7
        }
        
        response = requests.post(
            'https://api.perplexity.ai/chat/completions',
            headers=headers,
            json=data
        )
        
        if response.status_code == 200:
            return jsonify({
                "success": True,
                "response": response.json()
            })
        else:
            return jsonify({
                "success": False,
                "error": f"API error: {response.status_code}",
                "details": response.text
            })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })

@proxy_bp.route('/test', methods=['GET'])
def test_endpoint():
    """Simple test endpoint"""
    return jsonify({
        "status": "success",
        "message": "Test endpoint works!"
    }) 