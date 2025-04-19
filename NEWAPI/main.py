import os
from fastapi import FastAPI, Request, APIRouter
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from datetime import datetime
from NEWAPI.routers import (
    potential_partners,
    partner_research,
    seed_data,
    top_partners,
    generate_research
)
from NEWAPI import config

# Load environment variables
load_dotenv()

app = FastAPI(title="Partnership Intelligence API")

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up static folder for React build
dist_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dura-react', 'dist')
if not os.path.exists(dist_folder):
    os.makedirs(dist_folder, exist_ok=True)

app.mount("/static", StaticFiles(directory=dist_folder, html=True), name="static")

# Mount API routers
app.include_router(potential_partners.router)
app.include_router(partner_research.router)
app.include_router(seed_data.router)
app.include_router(top_partners.router)
app.include_router(generate_research.router)

@app.get("/api/test")
async def test_endpoint():
    """Test endpoint to verify FastAPI is running"""
    return {
        'status': 'success',
        'message': 'FastAPI server is running',
        'static_folder': dist_folder,
        'static_folder_exists': os.path.exists(dist_folder),
        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

@app.get("/api/scoring-criteria")
async def get_scoring_criteria():
    # Placeholder for scoring criteria logic
    return {
        'status': 'success',
        'scoring_criteria': {},
        'max_total_score': 10,
        'scoring_prompt': 'Scoring criteria details here.'
    }

@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    index_path = os.path.join(dist_folder, 'index.html')
    if os.path.exists(index_path):
        return HTMLResponse(content=open(index_path).read())
    return HTMLResponse(content="Error: index.html not found", status_code=404)
