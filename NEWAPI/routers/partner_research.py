from fastapi import APIRouter, Path, Body
from fastapi.responses import JSONResponse
from NEWAPI import config
import traceback

router = APIRouter(prefix="/api/partner-research", tags=["Partner Research"])

@router.get("/{partner_id}")
async def get_partner_research(partner_id: str = Path(...)):
    """Get partner research data from the database."""
    try:
        supabase = config.supabase
        if not supabase:
            return JSONResponse(status_code=500, content={"success": False, "message": "Database connection not available", "research": None})
        data, count = supabase.table('partner_research').select('*').eq('partner_id', partner_id).execute()
        research = data[1][0] if data and len(data) > 1 and len(data[1]) > 0 else None
        if research:
            return {"success": True, "research": research}
        else:
            return JSONResponse(status_code=404, content={"success": False, "message": "No research data found for this partner", "research": None})
    except Exception as e:
        print(f"Error fetching partner research: {str(e)}")
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Error: {str(e)}", "research": None})

@router.post("/")
async def save_partner_research(data: dict = Body(...)):
    """Save partner research data to the database."""
    try:
        supabase = config.supabase
        if not supabase:
            return JSONResponse(status_code=500, content={"success": False, "message": "Database connection not available"})
        partner_id = data.get('partner_id')
        research_data = data.get('research_data')
        if not partner_id or not research_data:
            return JSONResponse(status_code=400, content={"success": False, "message": "Missing required fields: partner_id and research_data are required"})
        resp, count = supabase.table('partner_research').upsert({"partner_id": partner_id, "research_data": research_data}).execute()
        if resp:
            return {"success": True, "message": f"Research data for partner {partner_id} saved successfully"}
        else:
            return JSONResponse(status_code=500, content={"success": False, "message": "Failed to save research data"})
    except Exception as e:
        print(f"Error saving partner research: {str(e)}")
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Error: {str(e)}"})
