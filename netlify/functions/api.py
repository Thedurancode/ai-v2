import os
import sys
import json
from flask import Flask, Request
from werkzeug.datastructures import Headers, MultiDict
from werkzeug.wrappers import Response

# Add the parent directory to sys.path so we can import app.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import the Flask app from app.py
from app import app as flask_app

def handler(event, context):
    """Netlify Function handler that adapts API Gateway requests to Flask."""
    
    # Extract request details from the Netlify event
    path = event.get('path', '/')
    http_method = event.get('httpMethod', 'GET')
    headers = event.get('headers', {})
    query_params = event.get('queryStringParameters', {}) or {}
    body = event.get('body', '')
    
    # Handle base64 encoded body if provided
    is_base64_encoded = event.get('isBase64Encoded', False)
    if is_base64_encoded and body:
        import base64
        body = base64.b64decode(body)
    
    # Create environment dictionary for Flask
    environ = {
        'PATH_INFO': path,
        'REQUEST_METHOD': http_method,
        'QUERY_STRING': '&'.join([f"{k}={v}" for k, v in query_params.items()]) if query_params else '',
        'SERVER_NAME': 'netlify',
        'SERVER_PORT': '443',
        'SERVER_PROTOCOL': 'HTTP/1.1',
        'wsgi.version': (1, 0),
        'wsgi.url_scheme': 'https',
        'wsgi.input': body.encode('utf-8') if isinstance(body, str) else body,
        'wsgi.errors': sys.stderr,
        'wsgi.multithread': False,
        'wsgi.multiprocess': False,
        'wsgi.run_once': False,
        'CONTENT_TYPE': headers.get('content-type', ''),
        'CONTENT_LENGTH': str(len(body) if body else 0),
    }
    
    # Add HTTP headers to environment
    for key, value in headers.items():
        key = key.upper().replace('-', '_')
        if key not in ('CONTENT_TYPE', 'CONTENT_LENGTH'):
            environ[f'HTTP_{key}'] = value
    
    # Create a response object to capture the Flask response
    response_data = {}
    
    def start_response(status, response_headers, exc_info=None):
        status_code = int(status.split(' ')[0])
        response_data['statusCode'] = status_code
        response_data['headers'] = dict(response_headers)
    
    # Process the request through the Flask app
    response_body = b''.join(flask_app(environ, start_response))
    
    # Handle binary responses if needed
    is_binary = False
    content_type = response_data.get('headers', {}).get('Content-Type', '')
    if content_type and ('image/' in content_type or 'application/pdf' in content_type or 'audio/' in content_type or 'video/' in content_type):
        import base64
        response_body = base64.b64encode(response_body).decode('utf-8')
        is_binary = True
    else:
        response_body = response_body.decode('utf-8')
    
    # Construct and return the API Gateway response
    return {
        'statusCode': response_data.get('statusCode', 200),
        'headers': response_data.get('headers', {}),
        'body': response_body,
        'isBase64Encoded': is_binary
    } 