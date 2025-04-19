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

# Launch the app
echo "Launching app on fly.io..."
flyctl launch --no-deploy

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
        
        # Set secret
        echo "Setting secret: $key"
        flyctl secrets set "$key=$value"
    done < .env
else
    echo "No .env file found. Skipping secrets setup."
fi

# Deploy the app
echo "Deploying app to fly.io..."
flyctl deploy

echo "Deployment complete!" 