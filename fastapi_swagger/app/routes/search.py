from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Dict, Any, List
import random
from ..models import SearchRequest, SearchStatusResponse, BaseResponse
from ..services.search_service import (
    get_search_status, 
    update_search_status, 
    search_companies_in_industry,
    extract_company_names,
    generate_company_analysis,
    process_company,
    add_company_to_considered,
    save_potential_partner,
    add_search_to_history
)
from ..database import get_supabase

router = APIRouter(
    prefix="/search",
    tags=["search"],
    responses={404: {"description": "Not found"}},
)

@router.get("/status", response_model=SearchStatusResponse)
async def get_status():
    """
    Get the current search status
    """
    status = get_search_status()
    return SearchStatusResponse(
        current_step=status.get("status", "idle"),
        message=status.get("message", "Ready to search"),
        progress=status.get("progress", 0),
        completed=status.get("status") == "completed" or status.get("completed", False),
        results=status.get("results"),
        error=status.get("error")
    )

@router.post("/", response_model=Dict[str, Any])
async def search(
    search_request: SearchRequest,
    background_tasks: BackgroundTasks,
    supabase=Depends(get_supabase)
):
    """
    Search for companies in an industry
    """
    query = search_request.query.strip()
    
    # Validate the query
    if not query:
        raise HTTPException(status_code=400, detail="Please provide a valid search query")
    
    # Update status - starting search
    update_search_status(
        status="starting",
        message="Initiating search process",
        progress=5
    )
    
    # Run the search in a background task
    background_tasks.add_task(
        run_search_task,
        query=query
    )
    
    return {"message": f"Search started for: {query}", "query": query}

@router.get("/ai", response_model=Dict[str, Any])
async def ai_search(background_tasks: BackgroundTasks):
    """
    Start an AI-powered search with a randomly selected industry
    """
    # Randomly select an industry
    industries = [
        "sports technology", "sports marketing", "sports media",
        "fan engagement", "sponsorship technology", "sports analytics",
        "esports", "sports betting", "sports equipment", "digital marketing"
    ]
    
    selected_industry = random.choice(industries)
    
    # Update status
    update_search_status(
        status="searching",
        message=f"Initiating AI-powered search for {selected_industry}...",
        progress=5
    )
    
    # Run the search in a background task
    background_tasks.add_task(
        run_search_task,
        query=selected_industry
    )
    
    return {"message": f"AI search started for {selected_industry}", "industry": selected_industry}

async def run_search_task(query: str):
    """
    Run the search task in the background
    """
    import os
    import traceback
    from ..database import get_supabase
    
    try:
        supabase = get_supabase()
        
        # Get Exa API key from environment
        exa_api_key = os.getenv('EXA_API_KEY')
        if not exa_api_key:
            update_search_status(
                status="error",
                message="API key not configured",
                progress=100,
                completed=True
            )
            return
        
        # Update status - starting search
        update_search_status(
            status="searching",
            message=f"Searching for companies related to: {query}",
            progress=10
        )
        
        # Search for companies in the industry
        search_results = search_companies_in_industry(query, exa_api_key)
        
        # Update status - extracting companies
        update_search_status(
            status="extracting",
            message="Extracting company names from search results",
            progress=30
        )
        
        # Extract company names from search results
        company_names = extract_company_names(search_results, query)
        
        # Filter out companies that are already partners
        from ..services.partner_service import get_current_partners
        current_partner_names = [p['name'] for p in get_current_partners()]
        
        # Check for exact matches with current partners
        exact_matches = [name for name in company_names if name in current_partner_names]
        if exact_matches:
            print(f"Warning: Found {len(exact_matches)} companies that are already partners: {', '.join(exact_matches)}")
        
        filtered_companies = [name for name in company_names if name not in current_partner_names]
        
        update_search_status(
            message=f"Found {len(filtered_companies)} potential companies after filtering out existing partners",
            progress=32
        )
        
        # Filter out previously considered companies
        from ..services.search_service import get_previously_considered_companies
        previously_considered = get_previously_considered_companies()
        not_previously_considered = [name for name in filtered_companies if name not in previously_considered]
        
        update_search_status(
            message=f"Filtered out {len(filtered_companies) - len(not_previously_considered)} previously considered companies",
            progress=35
        )
        
        # Add newly considered companies to our tracking set
        for name in not_previously_considered:
            add_company_to_considered(name)
        
        # Limit to 40 companies for analysis
        companies_to_analyze = not_previously_considered[:40]
        
        update_search_status(
            message=f"Selected {len(companies_to_analyze)} new companies for analysis",
            progress=40
        )
        
        # If no companies found, return error
        if not companies_to_analyze:
            update_search_status(
                status="error",
                message="No new companies found in this industry. Try a different industry.",
                progress=100,
                completed=True
            )
            return
        
        # Update status - analyzing companies
        update_search_status(
            status="analyzing",
            message="Analyzing companies and checking for competition with current partners",
            progress=50
        )
        
        # Generate analysis for the companies
        analysis = generate_company_analysis(companies_to_analyze, query)
        
        # Update status - enriching data
        update_search_status(
            status="enriching",
            message=f"Enriching data for all {len(analysis['companies'])} companies",
            progress=80
        )
        
        # Process all companies in parallel
        all_company_names = [company['name'] for company in analysis['companies']]
        update_search_status(
            message=f"Processing all companies in parallel",
            progress=85
        )
        
        # Process companies
        from concurrent.futures import ThreadPoolExecutor, as_completed
        
        # Use more workers for better parallelization
        max_workers = min(20, len(analysis['companies']))
        processed_companies = []
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Create futures for each company
            future_to_company = {executor.submit(process_company, company): company for company in analysis['companies']}
            
            # Process results as they complete
            completed = 0
            total = len(future_to_company)
            for future in as_completed(future_to_company):
                completed += 1
                progress = 85 + (completed / total * 10)  # Scale from 85 to 95
                update_search_status(
                    message=f"Processed {completed}/{total} companies",
                    progress=progress
                )
                
                try:
                    processed_company = future.result()
                    if processed_company:
                        processed_companies.append(processed_company)
                except Exception as e:
                    print(f"Error processing company: {str(e)}")
        
        # Update the companies in the analysis
        analysis['companies'] = processed_companies
        
        # Save non-conflicting companies to potential partners database
        saved_count = 0
        for company in processed_companies:
            if not company.get('competes_with_partners', False) and not company.get('has_competition', False):
                if save_potential_partner(company, query):
                    saved_count += 1
        
        # Record the search in history
        add_search_to_history("Search", query, len(processed_companies))
        
        # Update status - completed
        update_search_status(
            status="completed",
            message=f"Search completed: Found {len(processed_companies)} companies, saved {saved_count} non-conflicting companies to database",
            progress=100,
            completed=True,
            results=analysis
        )
        
    except Exception as e:
        print(f"Error in search task: {str(e)}")
        traceback.print_exc()
        
        # Update status - error
        update_search_status(
            status="error",
            message=f"Error in search: {str(e)}",
            progress=100,
            completed=True
        )
