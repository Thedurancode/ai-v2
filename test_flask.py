from flask import Flask, jsonify
import os
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def home():
    return "Flask test server is running!"

@app.route('/api/test')
def test():
    return jsonify({
        'status': 'success',
        'message': 'Test Flask server is running',
        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print(f"Starting test Flask server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True) 