from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime

# Base response model
class BaseResponse(BaseModel):
    """Base response model with status field"""
    status: str = "success"
    message: Optional[str] = None

# Error response model
class ErrorResponse(BaseResponse):
    """Error response model"""
    status: str = "error"
    error: str

# Search models
class SearchRequest(BaseModel):
    """Search request model"""
    query: str = Field(..., description="The search query for finding companies")

class SearchStatusResponse(BaseModel):
    """Search status response model"""
    current_step: str = Field("idle", description="Current step of the search process")
    message: str = Field("Ready to search", description="Status message")
    progress: int = Field(0, description="Progress percentage (0-100)")
    completed: bool = Field(False, description="Whether the search is completed")
    results: Optional[Any] = Field(None, description="Search results if completed")
    error: Optional[str] = Field(None, description="Error message if any")

# Partner models
class PartnerBase(BaseModel):
    """Base model for partner data"""
    name: str
    description: Optional[str] = None
    industry: Optional[str] = None
    score: Optional[float] = 0.0
    
class PartnerCreate(PartnerBase):
    """Model for creating a new partner"""
    leadership: Optional[List[str]] = []
    products: Optional[List[str]] = []
    opportunities: Optional[List[str]] = []
    market_analysis: Optional[Dict[str, Any]] = {}
    partnership_potential: Optional[Dict[str, Any]] = {}
    hq_location: Optional[str] = None
    website: Optional[str] = None
    size_range: Optional[str] = None
    logo: Optional[str] = None

class PartnerResponse(PartnerBase):
    """Model for partner response"""
    id: Optional[int] = None
    leadership: Optional[List[str]] = []
    products: Optional[List[str]] = []
    opportunities: Optional[List[str]] = []
    market_analysis: Optional[Dict[str, Any]] = {}
    partnership_potential: Optional[Dict[str, Any]] = {}
    headquarters: Optional[str] = None
    website: Optional[str] = None
    company_size: Optional[str] = None
    logo_url: Optional[str] = None
    created_at: Optional[str] = None
    last_updated: Optional[str] = None

class PartnersResponse(BaseResponse):
    """Response model for multiple partners"""
    partners: List[PartnerResponse] = []
    metadata: Optional[Dict[str, Any]] = None

# Company details models
class CompanyDetailsRequest(BaseModel):
    """Request model for company details"""
    name: str = Field(..., description="Name of the company to get details for")

class CompanyDetailsResponse(BaseResponse):
    """Response model for company details"""
    company: Dict[str, Any]

# Research models
class ResearchRequest(BaseModel):
    """Request model for company research"""
    company_name: str = Field(..., description="Name of the company to research")
    research_data: Any = Field(..., description="Research data for the company")
    source: str = Field("unknown", description="Source of the research data")

class ResearchResponse(BaseResponse):
    """Response model for company research"""
    company_name: str
    research: Optional[Dict[str, Any]] = None
    refreshed: Optional[bool] = False
    research_company_name: Optional[str] = None

# History models
class SearchHistoryItem(BaseModel):
    """Model for a search history item"""
    timestamp: str
    type: str
    query: str
    results_count: int

class SearchHistoryResponse(BaseResponse):
    """Response model for search history"""
    previously_considered: Dict[str, Any]
    search_history: List[SearchHistoryItem]

# Stats models
class StatsResponse(BaseResponse):
    """Response model for statistics"""
    considered_companies: int
    potential_partners: int
    average_partner_score: float
    top_partners: List[Dict[str, Any]]
    searches_performed: int
    top_industries: List[Dict[str, Any]]
