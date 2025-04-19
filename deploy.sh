#!/bin/bash

# MLSE Partner Research Deployment Script

echo "Starting deployment process..."

# 1. Build the React frontend
echo "Building React frontend..."
cd dura-react
npm run build
cd ..

# 2. Set up environment for production
echo "Setting up production environment..."
cp .env.production .env

# 3. Install production dependencies if needed
echo "Installing production dependencies..."
pip install gunicorn

# 4. Start the application with Gunicorn
echo "Starting application with Gunicorn..."
gunicorn --bind 0.0.0.0:8080 --workers 4 wsgi:app

echo "Deployment complete! Application is running on port 8080."
