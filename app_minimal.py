import os
import json
from flask import Flask, jsonify
from dotenv import load_dotenv
from datetime import datetime
from flask_cors import CORS
import sys

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return jsonify({
        "message": "Dura API is running",
        "status": "online",
        "version": "1.0.0"
    })

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "environment": os.environ.get('FLASK_ENV', 'production'),
        "python_version": sys.version,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/test')
def test():
    return jsonify({
        "message": "API test successful",
        "env_vars_set": {
            "EXA_API_KEY": bool(os.environ.get('EXA_API_KEY')),
            "OPENAI_API_KEY": bool(os.environ.get('OPENAI_API_KEY')),
            "PERPLEXITY_API_KEY": bool(os.environ.get('PERPLEXITY_API_KEY')),
            "FLASK_APP": os.environ.get('FLASK_APP'),
            "PORT": os.environ.get('PORT')
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True) 