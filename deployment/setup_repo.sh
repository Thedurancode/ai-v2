#!/bin/bash

# Script to set up the new repository structure for React frontend and Python backend

echo "Setting up your new repository..."
echo

# Define source and destination paths
SOURCE_DIR=$(pwd)
DEST_DIR=""

# Get destination directory from user
read -p "Enter the path to your new repository: " DEST_DIR

if [ -z "$DEST_DIR" ]; then
  echo "Error: No destination directory provided."
  exit 1
fi

# Create directories if they don't exist
mkdir -p "$DEST_DIR/backend"
mkdir -p "$DEST_DIR/frontend"
mkdir -p "$DEST_DIR/frontend/src"
mkdir -p "$DEST_DIR/frontend/public"

# Copy deployment files
echo "Copying deployment files..."
cp "$SOURCE_DIR/deployment/README.md" "$DEST_DIR/"
cp "$SOURCE_DIR/deployment/docker-compose.yml" "$DEST_DIR/"
cp "$SOURCE_DIR/deployment/DEPLOYMENT_GUIDE.md" "$DEST_DIR/"

# Copy backend files
echo "Setting up backend..."
cp "$SOURCE_DIR/app.py" "$DEST_DIR/backend/"
cp "$SOURCE_DIR/deployment/backend/requirements.txt" "$DEST_DIR/backend/"
cp "$SOURCE_DIR/deployment/backend/Dockerfile" "$DEST_DIR/backend/"
cp "$SOURCE_DIR/deployment/backend/.env.example" "$DEST_DIR/backend/"

# Copy environment file if exists, otherwise use the example
if [ -f "$SOURCE_DIR/.env" ]; then
  echo "Copying .env file to backend (make sure to review for sensitive information)"
  cp "$SOURCE_DIR/.env" "$DEST_DIR/backend/"
else
  echo "No .env file found, using .env.example as template"
  cp "$SOURCE_DIR/deployment/backend/.env.example" "$DEST_DIR/backend/.env"
fi

# Copy frontend files
echo "Setting up frontend..."
cp -r "$SOURCE_DIR/dura-react/src/"* "$DEST_DIR/frontend/src/"
cp "$SOURCE_DIR/dura-react/index.html" "$DEST_DIR/frontend/"
cp "$SOURCE_DIR/dura-react/package.json" "$DEST_DIR/frontend/"
cp "$SOURCE_DIR/dura-react/package-lock.json" "$DEST_DIR/frontend/"
cp "$SOURCE_DIR/dura-react/vite.config.js" "$DEST_DIR/frontend/"
cp "$SOURCE_DIR/deployment/frontend/Dockerfile" "$DEST_DIR/frontend/"
cp "$SOURCE_DIR/deployment/frontend/nginx.conf" "$DEST_DIR/frontend/"
cp "$SOURCE_DIR/deployment/frontend/.env.example" "$DEST_DIR/frontend/"

# Copy frontend environment file if exists
if [ -f "$SOURCE_DIR/dura-react/.env" ]; then
  echo "Copying frontend .env file (make sure to review for sensitive information)"
  cp "$SOURCE_DIR/dura-react/.env" "$DEST_DIR/frontend/"
else
  echo "No frontend .env file found, using .env.example as template"
  cp "$SOURCE_DIR/deployment/frontend/.env.example" "$DEST_DIR/frontend/.env"
fi

echo
echo "Setup completed! Your new repository structure is ready at: $DEST_DIR"
echo "Next steps:"
echo "1. Review all configuration files, especially .env files"
echo "2. Initialize Git repository (if not already done)"
echo "3. Commit and push your code"
echo "4. Follow the deployment instructions in DEPLOYMENT_GUIDE.md"
echo
echo "Happy coding!" 