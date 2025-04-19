from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from NEWAPI import config
import traceback

router = APIRouter(prefix="/api/potential-partners", tags=["Potential Partners"])

# TODO: Port endpoints from Flask blueprint

@router.get("/")
async def get_partners(
    search: str = Query(None),
    date_from: str = Query(None),
    date_to: str = Query(None),
    sort_by: str = Query('score'),
    sort_order: str = Query('desc')
):
    """Get potential partners from the database with optional filtering"""
    try:
        # Query Supabase directly (mirroring get_potential_partners logic)
        supabase = config.supabase
        if not supabase:
            return JSONResponse(status_code=500, content={
                "status": "error",
                "message": "Supabase client not available."
            })
        query = supabase.table('potential_partners').select('*')
        if search:
            query = query.ilike('name', f'%{search}%')
        if date_from:
            query = query.gte('created_at', date_from)
        if date_to:
            query = query.lte('created_at', date_to)
        if sort_by:
            query = query.order(sort_by, desc=(sort_order == 'desc'))
        data, count = query.execute()
        partners = []
        if data and len(data) > 1:
            partners = data[1]
        elif data and isinstance(data[0], list):
            partners = data[0]
        else:
            partners = data
        return {"status": "success", "partners": partners}
    except Exception as e:
        print(f"Error getting potential partners: {str(e)}")
        traceback.print_exc()
        return JSONResponse(status_code=500, content={
            "status": "error",
            "message": str(e)
        })

@router.post("/")
async def add_partner(partner: dict):
    """Add a new potential partner to the database."""
    try:
        supabase = config.supabase
        if not supabase:
            return JSONResponse(status_code=500, content={"status": "error", "message": "Supabase client not available."})
        data, count = supabase.table('potential_partners').insert(partner).execute()
        if data:
            return {"status": "success", "message": "Partner added successfully."}
        else:
            return JSONResponse(status_code=500, content={"status": "error", "message": "Failed to add partner."})
    except Exception as e:
        print(f"Error adding partner: {str(e)}")
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@router.post("/clear")
async def clear_partners():
    """Clear all potential partners from the database."""
    try:
        supabase = config.supabase
        if not supabase:
            return JSONResponse(status_code=500, content={"status": "error", "message": "Supabase client not available."})
        supabase.table('potential_partners').delete().execute()
        return {"status": "success", "message": "Potential partners cleared successfully."}
    except Exception as e:
        print(f"Error clearing potential partners: {str(e)}")
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

# TODO: Port additional endpoints (e.g., DELETE, etc.) from Flask blueprint
