#!/bin/bash
set -e

echo "Starting Flask development server..."
pip install -r requirements.txt
python3 -u app.py 