#!/bin/bash
set -e

echo "Starting minimal setup for MLSE AI Search..."

# Print Python version information
echo "Python version:"
python --version

# Install core dependencies only
echo "Installing core dependencies..."
pip install flask==2.3.3 python-dotenv==1.0.0 requests==2.31.0 flask-cors==3.0.10

# Create a static directory if it doesn't exist
if [ ! -d "dura-react/dist" ]; then
  echo "Creating static directory..."
  mkdir -p dura-react/dist
  
  # Create a minimal index.html file
  echo "Creating minimal index.html..."
  cat > dura-react/dist/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MLSE AI Search</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #0f172a;
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
    }
    .container {
      max-width: 600px;
      padding: 30px;
      background-color: #1e293b;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #C8102E;
      margin-bottom: 20px;
    }
    p {
      margin-bottom: 15px;
      line-height: 1.5;
    }
    .status {
      font-weight: bold;
      color: #10b981;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>MLSE AI Search</h1>
    <p>The backend API is running, but the React frontend could not be built.</p>
    <p>Please check the Replit console for more information.</p>
    <p class="status">API Status: Running</p>
  </div>
</body>
</html>
EOL
fi

# Start a minimal Flask application
echo "Starting minimal Flask backend..."
python -c "
import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS

app = Flask(__name__, static_folder='dura-react/dist')
CORS(app)

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    return jsonify({
        'status': 'success',
        'message': 'Minimal Flask server is running',
        'note': 'Full functionality is limited in minimal mode'
    })

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5020))
    print(f'Starting minimal Flask server on port {port}')
    app.run(host='0.0.0.0', port=port)
"
