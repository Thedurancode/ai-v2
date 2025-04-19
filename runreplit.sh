#!/bin/bash

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Install Node.js dependencies and build React app
echo "Building React app..."
cd dura-react
npm install
npm run build
cd ..

# Run Flask app
echo "Starting Flask server..."
python app.py 