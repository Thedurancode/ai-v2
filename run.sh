#!/bin/bash
set -e

echo "Starting MLSE AI Search application setup..."

# Print Python version information
echo "Python version:"
python --version

# Check for Python environment issues
echo "Checking Python environment..."
python -c "import sys; print(f'Python executable: {sys.executable}'); print(f'Python path: {sys.path}')"

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create a static directory if it doesn't exist
if [ ! -d "dura-react/dist" ]; then
  echo "Creating static directory..."
  mkdir -p dura-react/dist
fi

# Navigate to React app directory
cd dura-react

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Build the React app
echo "Building React frontend..."
npm run build

# Return to root directory
cd ..

# Check if the build directory exists
if [ -d "dura-react/dist" ]; then
  echo "React build successful!"
else
  echo "Error: React build failed. The dist directory was not created."
  exit 1
fi

# Start the Flask application
echo "Starting Flask backend on port 5020..."
python app.py
