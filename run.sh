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

# Install packages one by one to handle any issues
echo "Installing Flask and core dependencies..."
pip install flask==2.3.3 python-dotenv==1.0.0 requests==2.31.0 flask-cors==3.0.10 gunicorn==21.2.0

echo "Installing OpenAI and Exa..."
pip install openai==1.12.0 exa-py==1.0.1

echo "Installing Supabase dependencies..."
pip install supabase>=0.7.1 gotrue>=0.5.0 postgrest>=0.10.6 realtime>=0.1.0 storage3>=0.5.2

echo "Installing ReportLab..."
pip install reportlab==4.3.1

echo "Installing LinkedIn API..."
pip install linkedin-api==2.0.2

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
