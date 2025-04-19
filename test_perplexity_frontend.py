import os
import requests
import dotenv

# Load environment variables from frontend .env file
dotenv.load_dotenv('dura-react/.env')

# Get Perplexity API key from environment
perplexity_api_key = os.environ.get('VITE_PERPLEXITY_API_KEY')
perplexity_api_url = os.environ.get('VITE_PERPLEXITY_API_URL', 'https://api.perplexity.ai')

if not perplexity_api_key:
    print("Error: VITE_PERPLEXITY_API_KEY not found in environment variables")
    exit(1)

print(f"Using Perplexity API key: {perplexity_api_key[:10]}...")
print(f"Using Perplexity API URL: {perplexity_api_url}")

# Test query
query = "What is the capital of France?"

# Create payload
payload = {
    "model": "sonar-pro",
    "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": query}
    ],
    "max_tokens": 1000,
    "temperature": 0.7
}

# Make request
try:
    print("Sending request to Perplexity API...")
    response = requests.post(
        f"{perplexity_api_url}/chat/completions",
        headers={
            "Authorization": f"Bearer {perplexity_api_key}",
            "Content-Type": "application/json"
        },
        json=payload,
        timeout=60
    )
    
    print(f"Response status code: {response.status_code}")
    
    if response.status_code == 200:
        response_json = response.json()
        content = response_json['choices'][0]['message']['content']
        print("\nAPI Response:")
        print(content)
        print("\nAPI test successful!")
    else:
        print(f"API Error: {response.text}")
except Exception as e:
    print(f"Error: {str(e)}")
