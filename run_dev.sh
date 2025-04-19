#!/bin/bash
set -e

echo "Installing dependencies..."
pip install -r requirements.txt

# Building React app
echo "Building React app..."
cd dura-react
npm install
npm run build
cd ..

# Print information
echo "React app build complete! Starting Flask server..."
echo "The app will be available at the Replit web URL"

# Run Flask app with output to console
python3 -u app.py 