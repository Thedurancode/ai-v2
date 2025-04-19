#!/usr/bin/env bash
# build.sh - Build script for Render deployment

set -o errexit
set -o pipefail
set -o nounset

echo "Starting build process..."

# Install Python dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Initialize the database
echo "Setting up database..."
python render_db_setup.py

echo "Build completed successfully!" 