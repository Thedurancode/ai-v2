import os
from openai import OpenAI
from dotenv import load_dotenv
import sys

# Load environment variables
load_dotenv()

# Unset any proxy environment variables that might be causing issues
for var in ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'NO_PROXY', 'no_proxy']:
    if var in os.environ:
        del os.environ[var]

# Try to initialize OpenAI client with minimal settings
try:
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("Error: OPENAI_API_KEY environment variable not set")
        sys.exit(1)
        
    # Initialize with minimal settings
    client = OpenAI(api_key=api_key)
    print("OpenAI client initialized successfully")
except Exception as e:
    print(f"Error initializing OpenAI client: {e}")
    sys.exit(1)

# Try a simple API call
try:
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello, how are you?"}
        ],
        max_tokens=50
    )
    print("API call successful")
    print(f"Response: {response.choices[0].message.content}")
except Exception as e:
    print(f"Error making API call: {e}") 