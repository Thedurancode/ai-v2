#!/bin/bash

# Set the base URL
BASE_URL="http://localhost:5021"

# Set the company name from command line argument or default to "google"
COMPANY=${1:-"google"}

# Set a new RapidAPI key - replace this with your new key
NEW_API_KEY="YOUR_NEW_API_KEY_HERE"

# Make the request with the new key
echo "Testing LinkedIn Data API for company: $COMPANY with new API key"
curl -s "$BASE_URL/api/test/linkedin-data/$COMPANY" \
  -H "X-RapidAPI-Key: $NEW_API_KEY" | jq .

echo "Done!"
