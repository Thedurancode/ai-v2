from flask import Flask, Request
import sys
import os
from urllib.parse import parse_qs

# Add parent directory to path so we can import from app.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the Flask app from app.py
from app import app

def create_vercel_response(response):
    """Convert Flask response to Vercel response format"""
    return {
        "statusCode": response.status_code,
        "headers": {
            "Content-Type": response.content_type,
            **response.headers
        },
        "body": response.get_data(as_text=True)
    }

async def handler(request):
    """Handle incoming requests"""
    try:
        # Extract request information
        http_method = request.get("method", "GET")
        path = request.get("path", "/")
        headers = request.get("headers", {})
        body = request.get("body", "")
        query = request.get("query", {})

        # Create a test request context
        with app.test_request_context(
            path=path,
            method=http_method,
            headers=headers,
            data=body,
            query_string=query
        ):
            # Process the request through Flask
            response = app.full_dispatch_request()
            return create_vercel_response(response)

    except Exception as e:
        return {
            "statusCode": 500,
            "body": str(e),
            "headers": {"Content-Type": "text/plain"}
        }

# Vercel serverless function handler
def app_handler(request):
    """Vercel serverless function handler"""
    return handler(request) 