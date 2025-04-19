from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Dict, Any, List, Optional
from ..models import PartnersResponse, PartnerResponse, BaseResponse
from ..services.partner_service import get_potential_partners, clear_potential_partners
from ..database import get_supabase

router = APIRouter(
    prefix="/potential-partners",
    tags=["potential partners"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=PartnersResponse)
async def get_partners(
    search: Optional[str] = Query(None, description="Search term to filter partners"),
    industry: Optional[str] = Query(None, description="Industry to filter partners"),
    sort: Optional[str] = Query("score", description="Field to sort by (score, name, date, industry)"),
    order: Optional[str] = Query("desc", description="Sort order (asc, desc)"),
    supabase=Depends(get_supabase)
):
    """
    Get all potential partners with optional filtering and sorting
    """
    try:
        all_partners = get_potential_partners()
        
        # Apply filtering and sorting
        filtered_partners = all_partners
        
        # Apply industry filter if provided
        if industry:
            filtered_partners = [p for p in filtered_partners if p.get('industry', '').lower() == industry.lower()]
        
        # Apply search filter if provided
        if search:
            search_query = search.lower()
            search_results = []
            for partner in filtered_partners:
                # Search in name, description, and industry
                name = partner.get('name', '').lower()
                description = partner.get('description', '').lower()
                partner_industry = partner.get('industry', '').lower()
                
                # Also search in leadership, products, and opportunities
                leadership_text = ' '.join([str(leader) for leader in partner.get('leadership', [])]).lower()
                products_text = ' '.join([str(product) for product in partner.get('products', [])]).lower()
                opportunities_text = ' '.join([str(opp) for opp in partner.get('opportunities', [])]).lower()
                
                # Check if search query exists in any of these fields
                if (search_query in name or
                    search_query in description or
                    search_query in partner_industry or
                    search_query in leadership_text or
                    search_query in products_text or
                    search_query in opportunities_text):
                    search_results.append(partner)
            
            filtered_partners = search_results
        
        # Apply sorting
        if sort == 'score':
            filtered_partners.sort(key=lambda x: float(x.get('score', 0)), reverse=(order.lower() == 'desc'))
        elif sort == 'name':
            filtered_partners.sort(key=lambda x: x.get('name', '').lower(), reverse=(order.lower() == 'desc'))
        elif sort == 'date':
            filtered_partners.sort(key=lambda x: x.get('created_at', ''), reverse=(order.lower() == 'desc'))
        elif sort == 'industry':
            filtered_partners.sort(key=lambda x: x.get('industry', '').lower(), reverse=(order.lower() == 'desc'))
        
        # Get counts for response metadata
        total_count = len(all_partners)
        filtered_count = len(filtered_partners)
        
        # Get unique industries for filters
        industries = sorted(list(set([p.get('industry', '') for p in all_partners if p.get('industry')])))
        
        # Format response with metadata
        return PartnersResponse(
            partners=[PartnerResponse(**p) for p in filtered_partners],
            metadata={
                'total_count': total_count,
                'filtered_count': filtered_count,
                'industries': industries,
                'search_query': search,
                'industry_filter': industry,
                'sort_by': sort,
                'sort_order': order
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving partners: {str(e)}")

@router.get("/top", response_model=PartnersResponse)
async def get_top_partners(
    limit: int = Query(5, description="Number of top partners to return", ge=1, le=50),
    supabase=Depends(get_supabase)
):
    """
    Get top-scoring potential partners
    """
    try:
        # Get all partners and sort by score
        all_partners = get_potential_partners()
        
        # Get top partners by score
        top_partners = all_partners[:limit]
        
        # Format the response with additional metadata
        return PartnersResponse(
            partners=[PartnerResponse(**p) for p in top_partners],
            metadata={
                'total_partners': len(all_partners),
                'limit': limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving top partners: {str(e)}")

@router.get("/by-industry", response_model=List[Dict[str, Any]])
async def get_partners_by_industry(supabase=Depends(get_supabase)):
    """
    Get counts of partners by industry
    """
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Supabase client not available")
        
        # Get all industries from potential_partners table
        response = supabase.table('potential_partners').select('industry').execute()
        
        # Count occurrences of each industry
        industry_counts = {}
        for row in response.data:
            industry = row.get('industry')
            if not industry:
                industry = 'Unknown'
            
            if industry in industry_counts:
                industry_counts[industry] += 1
            else:
                industry_counts[industry] = 1
        
        # Convert to list of dictionaries
        result = [{'industry': industry, 'count': count} for industry, count in industry_counts.items()]
        
        # Sort by count in descending order
        result.sort(key=lambda x: x['count'], reverse=True)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting partners by industry: {str(e)}")

@router.delete("/", response_model=BaseResponse)
async def clear_partners(supabase=Depends(get_supabase)):
    """
    Clear all potential partners from the database
    """
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Supabase client not available")
        
        success = clear_potential_partners()
        
        if success:
            return BaseResponse(
                status="success",
                message="All potential partners have been removed from the database"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to clear potential partners")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing potential partners: {str(e)}")
