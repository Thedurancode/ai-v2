#!/bin/bash

# Set the base URL
BASE_URL="http://localhost:5021"

# Set the RapidAPI key in the environment if not already set
if [ -z "$RAPIDAPI_KEY" ]; then
  export RAPIDAPI_KEY="92d09ec42cmsh8f1c01a489ff86ap1c7112jsncc8326125282"
  echo "Set RAPIDAPI_KEY environment variable"
fi

# Function to test the LinkedIn Data API
test_linkedin_api() {
  local company=$1
  echo "Testing LinkedIn Data API for company: $company"
  
  # Make the request
  curl -s "$BASE_URL/api/test/linkedin-data/$company" | jq .
  
  echo "----------------------------------------"
}

# Test with various companies
echo "=== Testing LinkedIn Data API Integration ==="
test_linkedin_api "google"
test_linkedin_api "microsoft"
test_linkedin_api "apple"
test_linkedin_api "amazon"
test_linkedin_api "netflix"

echo "=== Testing Complete ==="
