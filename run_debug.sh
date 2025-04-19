#!/bin/bash
set -e

echo "=== DEBUG MODE ==="
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la

echo "=== Python version ==="
python3 --version

echo "=== Node version ==="
node --version

echo "=== Installing Python dependencies ==="
pip install -r requirements.txt

echo "=== Starting simple Flask server ==="
python3 -u test_flask.py 