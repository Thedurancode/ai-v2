from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from ..models import SearchHistoryResponse, BaseResponse
from ..services.search_service import (
    get_search_history_from_db,
    get_previously_considered_from_db,
    clear_history_from_db
)
from ..database import get_supabase

router = APIRouter(
    prefix="/history",
    tags=["history"],
    responses={404: {"description": "Not found"}},
)

@router.get("/search", response_model=SearchHistoryResponse)
async def get_search_history(supabase=Depends(get_supabase)):
    """
    Get search history and previously considered companies
    """
    try:
        # Get search history from database
        history = get_search_history_from_db()
        
        # Get previously considered companies
        companies = get_previously_considered_from_db()
        
        return SearchHistoryResponse(
            previously_considered={
                'count': len(companies),
                'companies': companies
            },
            search_history=history
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving search history: {str(e)}")

@router.get("/", response_model=Dict[str, Any])
async def get_full_history(supabase=Depends(get_supabase)):
    """
    Get detailed search history with formatted data
    """
    try:
        # Get history from database
        history = get_search_history_from_db()
        
        formatted_history = []
        
        for item in history:
            formatted_item = {
                "date": item.get("timestamp", "Unknown Date"),
                "type": item.get("type", "Unknown Search Type"),
                "query": item.get("query", "Unknown Query"),
                "results_count": item.get("results_count", 0)
            }
            formatted_history.append(formatted_item)
        
        return {
            'count': len(formatted_history),
            'history': formatted_history
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving full history: {str(e)}")

@router.delete("/reset", response_model=BaseResponse)
async def reset_history(supabase=Depends(get_supabase)):
    """
    Reset the previously considered companies list and potential partners
    """
    try:
        # Clear database
        success = clear_history_from_db()
        
        if success:
            return BaseResponse(
                status="success",
                message="Company history and potential partners have been reset."
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to reset history")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resetting history: {str(e)}")
