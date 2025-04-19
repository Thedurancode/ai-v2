#!/bin/bash
set -e

echo "==== DURA FLASK API DEPLOYMENT TO FLY.IO ===="
echo ""

# Install flyctl if not already installed
if ! command -v flyctl &> /dev/null; then
    echo "Installing flyctl..."
    curl -L https://fly.io/install.sh | sh
fi

# Ensure flyctl is in PATH
export FLYCTL_INSTALL="${HOME}/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"

# Check if user is logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "Please log in to fly.io:"
    flyctl auth login
fi

# Define app name
APP_NAME="dura-api-flask"

# Check if app already exists
if ! flyctl status -a $APP_NAME &> /dev/null; then
    # Create new app without deployment
    echo "Creating new app $APP_NAME on fly.io..."
    flyctl apps create $APP_NAME 
else
    echo "App $APP_NAME already exists."
fi

# Create an optimized Dockerfile for deployment
cat > Dockerfile.fly <<EOL
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Environment variables
ENV FLASK_APP=app.py
ENV PORT=8080
ENV HOST=0.0.0.0
ENV FLASK_ENV=production
ENV FLASK_DEBUG=0

# Expose the port
EXPOSE 8080

# Run using gunicorn with proper settings for production
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--timeout", "120", "--workers", "2", "app:app"]
EOL

echo "Created Dockerfile.fly for deployment"

# Create an optimized fly.toml
cat > fly.toml <<EOL
app = '${APP_NAME}'
primary_region = 'sjc'
kill_signal = 'SIGINT'
kill_timeout = '5s'

[build]
  dockerfile = "Dockerfile.fly"

[env]
  PORT = '8080'
  PYTHONUNBUFFERED = '1'
  FLASK_ENV = 'production'
  FLASK_DEBUG = '0'

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ['app']
  protocol = "tcp"

[[vm]]
  cpu_kind = 'shared'
  cpus = 1
  memory_mb = 1024
EOL

echo "Created fly.toml for deployment"

# Set secrets from .env file
echo "Setting up secrets from .env file..."
if [ -f .env ]; then
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip comments and empty lines
        if [[ $line =~ ^[[:space:]]*#.*$ || -z $line ]]; then
            continue
        fi
        
        # Extract key and value
        key=$(echo "$line" | cut -d= -f1)
        value=$(echo "$line" | cut -d= -f2-)
        
        # Skip VITE_ variables as they're for the frontend
        if [[ $key == VITE_* ]]; then
            echo "Skipping frontend variable: $key"
            continue
        fi
        
        # Set secret
        echo "Setting secret: $key"
        flyctl secrets set "$key=$value" -a $APP_NAME
    done < .env
else
    echo "No .env file found. Skipping secrets setup."
    echo "WARNING: Your app may not work correctly without environment variables!"
fi

# Deploy the app
echo "Deploying Flask app to fly.io..."
flyctl deploy -a $APP_NAME

echo ""
echo "Deployment complete!"
echo "Your Flask API is now available at: https://$APP_NAME.fly.dev"
echo ""
echo "To check logs:"
echo "  flyctl logs -a $APP_NAME"
echo ""
echo "To check health:"
echo "  curl https://$APP_NAME.fly.dev/health" 