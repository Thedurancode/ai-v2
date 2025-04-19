from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from ..models import CurrentPartnersResponse
from ..services.partner_service import get_current_partners

router = APIRouter(
    prefix="/current-partners",
    tags=["current partners"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=CurrentPartnersResponse)
async def get_partners(
    category: Optional[str] = Query(None, description="Category to filter partners")
):
    """
    Get the list of current partners with optional category filtering
    """
    try:
        current_partners = get_current_partners()
        
        # Apply filtering if category is provided
        if category:
            filtered_partners = [p for p in current_partners if p.get('category', '').lower() == category.lower()]
        else:
            filtered_partners = current_partners
        
        # Get unique categories for filtering
        categories = sorted(list(set([p.get('category', '') for p in current_partners if p.get('category')])))
        
        # Format response with metadata
        return CurrentPartnersResponse(
            current_partners=filtered_partners,
            metadata={
                'total_count': len(current_partners),
                'filtered_count': len(filtered_partners),
                'categories': categories
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving current partners: {str(e)}")
