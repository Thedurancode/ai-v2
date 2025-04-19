from flask import Flask
from api.index import app_handler

# This is the main handler for Vercel serverless function at the root level
def handler(request):
    return app_handler(request) 