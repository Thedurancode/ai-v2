from fastapi import APIRouter, Path, Body
from fastapi.responses import JSONResponse
from NEWAPI import config
import traceback

router = APIRouter(prefix="/api/generate-research", tags=["Generate Research"])

# TODO: Port endpoints from Flask blueprint

@router.get("/")
async def list_generate_research():
    return {"message": "List generate research (placeholder)"}

@router.post("/generate-partner-research")
async def generate_partner_research(data: dict = Body(...)):
    """Generate research for a partner using Perplexity API (placeholder)."""
    # NOTE: Implement actual Perplexity API integration as in Flask if needed
    try:
        partner_id = data.get('partner_id')
        partner_name = data.get('partner_name')
        if not partner_id or not partner_name:
            return JSONResponse(status_code=400, content={"success": False, "message": "Missing required fields: partner_id and partner_name are required"})
        # ... (actual logic would go here) ...
        return {"success": True, "message": "Research generated successfully (placeholder)", "data": {}}
    except Exception as e:
        print(f"Error generating partner research: {str(e)}")
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Error: {str(e)}"})

@router.get("/company-research/{partner}")
async def get_company_research(partner: str = Path(...)):
    """Fetch research for a specific company by partner name or ID."""
    try:
        supabase = config.supabase
        if not supabase:
            return JSONResponse(status_code=500, content={"success": False, "message": "Database connection not available", "research": None})
        data, count = supabase.table('company_research').select('*').eq('partner', partner).execute()
        research = data[1][0] if data and len(data) > 1 and len(data[1]) > 0 else None
        if research:
            return {"success": True, "research": research}
        else:
            return JSONResponse(status_code=404, content={"success": False, "message": "No research found for this company.", "research": None})
    except Exception as e:
        print(f"Error fetching company research: {str(e)}")
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Internal server error: {e}", "research": None})
