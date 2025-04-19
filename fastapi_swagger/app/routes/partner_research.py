from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from typing import Dict, Any
import io
import os
from ..models import ResearchRequest, ResearchResponse, BaseResponse
from ..services.research_service import (
    get_company_research,
    save_company_research,
    generate_research_pdf
)
from ..database import get_supabase

router = APIRouter(
    prefix="/company-research",
    tags=["company research"],
    responses={404: {"description": "Not found"}},
)

@router.get("/{company_name}", response_model=ResearchResponse)
async def get_research(
    company_name: str,
    refresh: bool = False,
    supabase=Depends(get_supabase)
):
    """
    Get research data for a company
    """
    try:
        if not company_name:
            raise HTTPException(status_code=400, detail="Company name is required")
        
        # URL decode the company name
        company_name = company_name.replace('%20', ' ').strip()
        print(f"API: Retrieving research for: '{company_name}'")
        
        # Get research data
        research = get_company_research(company_name)
        
        # If refresh is requested and no research exists, or refresh is explicitly requested
        if not research or refresh:
            print(f"Research refresh requested for '{company_name}'")
            # Here you would typically trigger the research generation process
            # For now, we'll just return what we have (or don't have)
            
            # If we still don't have research after attempting to generate it
            if not research:
                return JSONResponse(
                    status_code=404,
                    content={
                        "success": False,
                        "status": "error",
                        "company_name": company_name,
                        "message": f"No research found for '{company_name}', refresh was {'requested' if refresh else 'not requested'}"
                    }
                )
        
        # Return the research data
        return ResearchResponse(
            success=True,
            company_name=company_name,
            research=research,
            refreshed=refresh,
            research_company_name=research.get('company_name') if research else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving research data: {str(e)}")

@router.post("/", response_model=BaseResponse)
async def save_research(
    research_request: ResearchRequest,
    supabase=Depends(get_supabase)
):
    """
    Save research data for a company
    """
    try:
        if not research_request.company_name:
            raise HTTPException(status_code=400, detail="Company name is required")
        
        if not research_request.research_data:
            raise HTTPException(status_code=400, detail="Research data is required")
        
        success = save_company_research(
            research_request.company_name,
            research_request.research_data,
            research_request.source
        )
        
        if success:
            return BaseResponse(
                status="success",
                message=f"Research saved for {research_request.company_name}"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to save research data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving research data: {str(e)}")

@router.get("/{company_name}/export-pdf")
async def export_research_pdf(
    company_name: str,
    supabase=Depends(get_supabase)
):
    """
    Export company research data as PDF
    """
    try:
        if not company_name:
            raise HTTPException(status_code=400, detail="Company name is required")
        
        # URL decode the company name
        company_name = company_name.replace('%20', ' ').strip()
        print(f"API: Exporting PDF research for: '{company_name}'")
        
        # Get research data
        research = get_company_research(company_name)
        
        # If no research data found
        if not research:
            raise HTTPException(
                status_code=404,
                detail=f"No research found for '{company_name}'"
            )
        
        # Generate PDF from research data
        pdf_data = generate_research_pdf(company_name, research)
        
        # Create a temporary file to store the PDF
        filename = f"{company_name.replace(' ', '_')}_Research.pdf"
        temp_file_path = f"/tmp/{filename}"
        
        # Write the PDF data to the temporary file
        with open(temp_file_path, "wb") as f:
            f.write(pdf_data)
        
        # Return the file as a response
        return FileResponse(
            path=temp_file_path,
            filename=filename,
            media_type="application/pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting research data as PDF: {str(e)}")
