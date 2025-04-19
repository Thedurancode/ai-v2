from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from NEWAPI import config
import traceback

router = APIRouter(prefix="/api/top-partners", tags=["Top Partners"])

# TODO: Port endpoints from Flask blueprint

@router.get("/")
async def get_top_partners(limit: int = Query(10)):
    """Get top partners based on score."""
    try:
        supabase = config.supabase
        if not supabase:
            return JSONResponse(status_code=500, content={"success": False, "message": "Database connection not available", "partners": []})
        data, count = supabase.table('potential_partners').select('*').order('partnership_score', desc=True).limit(limit).execute()
        partners = data[1] if data and len(data) > 1 else []
        if partners:
            return {"success": True, "message": "Top partners retrieved successfully", "partners": partners}
        else:
            return JSONResponse(status_code=404, content={"success": False, "message": "No partners found", "partners": []})
    except Exception as e:
        print(f"Error getting top partners: {str(e)}")
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"success": False, "message": f"Error: {str(e)}", "partners": []})
