import os
import uvicorn
from fastapi import FastAPI, Request, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
import traceback
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="MLSE AI SEARCH API",
    description="API for MLSE AI SEARCH partnership search and analysis",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers after app is created
from routers import search, partners, research, history, stats

# Register routers
app.include_router(search.router)
app.include_router(partners.router)
app.include_router(research.router)
app.include_router(history.router)
app.include_router(stats.router)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint for health checks"""
    return {
        "status": "ok",
        "message": "MLSE AI SEARCH API is running",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "environment": os.environ.get("ENVIRONMENT", "development"),
        "python_version": os.environ.get("PYTHON_VERSION", "3.9+")
    }

# API configuration endpoint
@app.get("/api-config")
async def api_config():
    """Return API configuration for frontend clients"""
    return {
        "api_base_url": os.environ.get("API_BASE_URL", "http://localhost:5020"),
        "version": "1.0.0",
        "environment": os.environ.get("ENVIRONMENT", "development"),
        "docs_url": f"{os.environ.get('API_BASE_URL', 'http://localhost:5020')}/docs"
    }

# Run the application
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5020))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print(f"Starting FastAPI server on {host}:{port}")
    uvicorn.run("fastapi_app:app", host=host, port=port, reload=True)
