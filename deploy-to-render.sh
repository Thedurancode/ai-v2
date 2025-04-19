#!/bin/bash
set -e

echo "==== DURA FLASK API DEPLOYMENT TO RENDER ===="
echo ""

# Check if render CLI is installed
if ! command -v render &> /dev/null; then
    echo "Installing Render CLI..."
    curl -o- https://render.com/install-cli.sh | bash
fi

# Create a Procfile if it doesn't exist
if [ ! -f "Procfile" ]; then
    echo "Creating Procfile..."
    echo "web: gunicorn app:app --bind 0.0.0.0:\$PORT --timeout 120" > Procfile
    echo "Created Procfile"
fi

# Create a .env.render file with placeholders for environment variables
echo "Creating .env.render template file..."
cat > .env.render <<EOL
FLASK_APP=app.py
FLASK_ENV=production
FLASK_DEBUG=0
PORT=10000
PYTHONUNBUFFERED=1
DB_PATH=dura_history.db
# Add your actual API keys during Render setup
EXA_API_KEY=
OPENAI_API_KEY=
PERPLEXITY_API_KEY=
RAPIDAPI_KEY=
CORESIGNAL_API_KEY=
DEEPSEEK_API_KEY=
EOL

echo "Created .env.render template"
echo ""
echo "==== MANUAL DEPLOYMENT INSTRUCTIONS ===="
echo ""
echo "1. Go to https://dashboard.render.com/new/web-service"
echo "2. Connect your GitHub repository (or upload your code)"
echo "3. Configure your web service with the following settings:"
echo "   - Name: dura-api"
echo "   - Environment: Python"
echo "   - Region: Oregon (or your preferred region)"
echo "   - Branch: main"
echo "   - Build Command: pip install -r requirements.txt"
echo "   - Start Command: gunicorn app:app --bind 0.0.0.0:\$PORT --timeout 120"
echo ""
echo "4. Add the following environment variables:"
echo "   (You can copy these from your .env file)"
cat .env | grep -v "^#" | grep -v "^VITE_" | grep "=" | while read -r line; do
    echo "   - $line"
done
echo ""
echo "5. Click 'Create Web Service' to deploy"
echo ""
echo "Once deployed, your API will be available at:"
echo "https://dura-api.onrender.com" 