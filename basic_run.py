from flask import Flask, render_template, request, jsonify
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html', app_name="MLSE Partner Research")

@app.route('/search', methods=['POST'])
def search():
    data = request.json
    query = data.get('query', '')
    
    if not query:
        return jsonify({'error': 'No query provided'}), 400
    
    # Mock response for demo purposes
    return jsonify({
        'industry': query,
        'analysis': {
            'industry_overview': f"This is a mock overview of the {query} industry.",
            'companies': [
                {
                    'name': "Example Company 1",
                    'description': "This is an example company in the requested industry.",
                    'competes_with_partners': False,
                    'total_score': 7.5,
                    'logo': "https://img.logo.dev/example1.com?token=pk_TCK5i8rzR92YmS65BY2fgQ&retina=true"
                },
                {
                    'name': "Example Company 2",
                    'description': "This is another example company in the requested industry.",
                    'competes_with_partners': False,
                    'total_score': 6.8,
                    'logo': "https://img.logo.dev/example2.com?token=pk_TCK5i8rzR92YmS65BY2fgQ&retina=true"
                }
            ],
            'suitable_partners': ["Example Company 1", "Example Company 2"]
        }
    })

@app.route('/ai-search', methods=['GET'])
def ai_search():
    # Mock response for demo purposes
    return jsonify({
        'prompt': "Virtual reality entertainment platforms"
    })

if __name__ == '__main__':
    app.run(debug=True, port=5018) 