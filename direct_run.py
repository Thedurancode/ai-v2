from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/')
def home():
    return "Flask server is running on Replit!"

@app.route('/hello')
def hello():
    return "Hello from Flask!"

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print(f"Starting Flask on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True) 