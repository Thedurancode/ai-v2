#!/bin/bash

# Set the base URL
BASE_URL="http://localhost:5021"

# Set the company name from command line argument or default to "google"
COMPANY=${1:-"google"}

# Make the request
echo "Testing LinkedIn Data API for company: $COMPANY"
curl -s "$BASE_URL/api/test/linkedin-data/$COMPANY" | jq .

echo "Done!"
