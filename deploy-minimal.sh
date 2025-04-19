#!/bin/bash
set -e

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
APP_NAME="dura-api-minimal"

# Check if app already exists
if ! flyctl status -a $APP_NAME &> /dev/null; then
    # Create new app without deployment
    echo "Creating new app $APP_NAME on fly.io..."
    flyctl apps create $APP_NAME --org personal
else
    echo "App $APP_NAME already exists."
fi

# Deploy the app using our minimal Dockerfile and fly.toml
echo "Deploying minimal Flask app to fly.io..."
flyctl deploy -a $APP_NAME --config fly.minimal.toml

echo "Deployment complete!"
echo "Your minimal Flask API is now available at: https://$APP_NAME.fly.dev" 