#!/bin/bash

# Exit on error
set -e

echo "Starting deployment to Fly.io..."

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "flyctl is not installed. Installing..."
    curl -L https://fly.io/install.sh | sh
    
    # Add to path for this session
    export FLYCTL_INSTALL="/home/$(whoami)/.fly"
    export PATH="$FLYCTL_INSTALL/bin:$PATH"
fi

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "Please log in to Fly.io:"
    flyctl auth login
fi

# Read API keys from .env file if it exists
if [ -f .env ]; then
    echo "Found .env file, reading API keys..."
    source .env
fi

# Prompt for API keys if not set
if [ -z "$EXA_API_KEY" ]; then
    read -p "Enter your EXA_API_KEY: " EXA_API_KEY
fi

if [ -z "$OPENAI_API_KEY" ]; then
    read -p "Enter your OPENAI_API_KEY: " OPENAI_API_KEY
fi

# Check if fly.toml exists
if [ ! -f fly.toml ]; then
    echo "fly.toml not found. Creating a default one..."
    APP_NAME="dura-api-$(date +%Y%m%d%H%M%S)"
    
    # Create a basic fly.toml file
    cat > fly.toml << EOL
app = "$APP_NAME"
primary_region = "sjc"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[mounts]
  source = "dura_data"
  destination = "/data"

[[vm]]
  memory = "1gb"
  cpu_kind = "shared"
  cpus = 1
EOL
    echo "Created fly.toml with app name: $APP_NAME"
else
    # Extract app name from fly.toml
    APP_NAME=$(grep -e "^app\s*=" fly.toml | sed 's/app\s*=\s*"\(.*\)"/\1/')
    echo "Found app name in fly.toml: $APP_NAME"
fi

# Check if app exists on Fly.io
echo "Checking if app '$APP_NAME' exists..."
if ! flyctl status -a "$APP_NAME" &> /dev/null; then
    echo "App '$APP_NAME' does not exist. Creating new app..."
    
    # Create a new app
    if ! flyctl apps create "$APP_NAME" &> /dev/null; then
        echo "Error creating app. The app name might be taken."
        echo "Let's create a new app with a unique name..."
        
        # Generate a unique app name with timestamp
        TIMESTAMP=$(date +%Y%m%d%H%M%S)
        APP_NAME="dura-api-$TIMESTAMP"
        
        # Create the app with the unique name
        flyctl apps create "$APP_NAME"
        
        # Update the fly.toml file with the new app name
        sed -i.bak "s/^app = .*/app = \"$APP_NAME\"/" fly.toml
        rm -f fly.toml.bak
        
        echo "Created app with name: $APP_NAME"
    else
        echo "Successfully created app: $APP_NAME"
    fi
else
    echo "App '$APP_NAME' already exists."
fi

# Create a volume for the data if it doesn't exist
VOLUME_NAME="dura_data"
if ! flyctl volumes list -a "$APP_NAME" | grep -q "$VOLUME_NAME"; then
    echo "Creating volume for SQLite database..."
    flyctl volumes create "$VOLUME_NAME" --size 1 --region sjc -a "$APP_NAME"
else
    echo "Volume '$VOLUME_NAME' already exists."
fi

# Set secrets
echo "Setting up secrets..."
flyctl secrets set EXA_API_KEY="$EXA_API_KEY" OPENAI_API_KEY="$OPENAI_API_KEY" -a "$APP_NAME"

# Deploy
echo "Deploying app to Fly.io..."
flyctl deploy --strategy immediate --force-rebuild -a "$APP_NAME"

# Show deployed app info
echo "Deployment completed successfully!"
echo "Your app is now available at: https://$APP_NAME.fly.dev"
echo "API documentation is available at: https://$APP_NAME.fly.dev/docs"

# Open in browser
echo "Opening app in browser..."
flyctl open -a "$APP_NAME" 