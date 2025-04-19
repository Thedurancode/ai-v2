from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import os
import traceback
from datetime import datetime
import json

from models import SearchRequest, SearchStatusResponse, BaseResponse, ErrorResponse
import database as db

# Import search-related functions from your existing code
# These would need to be adapted from your Flask app
from search_utils import (
    search_companies_in_industry,
    extract_company_names,
    generate_company_analysis,
    process_company
)

router = APIRouter(
    prefix="/api",
    tags=["search"],
)

# Global search status
search_status = {
    "status": "idle",
    "message": "Ready to search",
    "progress": 0,
    "results": None,
    "error": None
}

@router.get("/search-status", response_model=SearchStatusResponse)
async def get_search_status():
    """Get the current status of the search process"""
    global search_status

    # Format the search_status to match what the React app expects
    formatted_status = {
        "current_step": search_status.get("status", "idle"),
        "message": search_status.get("message", "Ready to search"),
        "progress": search_status.get("progress", 0),
        "completed": search_status.get("status") == "completed" or search_status.get("completed", False),
        "results": search_status.get("results"),
        "error": search_status.get("error")
    }
    return formatted_status

@router.post("/search", response_model=Dict[str, Any])
async def search(search_data: SearchRequest, background_tasks: BackgroundTasks):
    """Search for companies in an industry"""
    try:
        global search_status

        # Reset search status
        search_status = {
            "status": "starting",
            "message": "Initiating search process",
            "progress": 5,
            "results": None,
            "error": None
        }

        query = search_data.query.strip()

        # Validate the query
        if not query:
            search_status.update({
                "status": "error",
                "message": "Please provide a valid search query",
                "progress": 100,
                "completed": True
            })
            raise HTTPException(status_code=400, detail="Please provide a valid search query")

        # Run the search in a background task
        background_tasks.add_task(
            run_search_task,
            query=query
        )

        return {
            "message": f"Search started for: {query}",
            "query": query
        }
    except Exception as e:
        # Update status - error
        search_status.update({
            "status": "error",
            "message": f"Error in search: {str(e)}",
            "progress": 100,
            "completed": True
        })
        print(f"Error in search: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ai-search")
async def ai_search(background_tasks: BackgroundTasks):
    """Start an AI-powered search for potential partners"""
    global search_status

    try:
        print("\n=== Starting AI Search ===")

        # Reset search status
        search_status = {
            "status": "searching",
            "message": "Initiating AI-powered search...",
            "progress": 5,
            "results": None,
            "error": None
        }

        # Ensure environment variable is set
        api_key = os.environ.get('EXA_API_KEY')
        if not api_key:
            error_message = "API key not found. Please set the EXA_API_KEY environment variable."
            search_status.update({
                "status": "error",
                "message": error_message,
                "progress": 0,
                "error": error_message
            })
            print(f"Error: {error_message}")
            raise HTTPException(status_code=500, detail=error_message)

        # Randomly select an industry for demo purposes
        import random
        industries = [
            "sports technology", "sports marketing", "sports media",
            "fan engagement", "sponsorship technology", "sports analytics",
            "esports", "sports betting", "sports equipment", "digital marketing"
        ]

        selected_industry = random.choice(industries)
        print(f"Selected industry for AI search: {selected_industry}")

        # Update status
        search_status.update({
            "status": "searching",
            "message": f"Searching for companies in {selected_industry}...",
            "progress": 10
        })

        # Start the search in a background task
        background_tasks.add_task(
            run_ai_search_task,
            industry=selected_industry,
            api_key=api_key
        )

        return {
            "message": f"AI search started for {selected_industry}",
            "industry": selected_industry
        }
    except Exception as e:
        error_message = f"Error in AI search: {str(e)}"
        print(f"ERROR: {error_message}")
        traceback.print_exc()

        # Update search status with error
        search_status.update({
            "status": "error",
            "message": error_message,
            "progress": 0,
            "error": error_message
        })

        raise HTTPException(status_code=500, detail=error_message)

# Background task functions
async def run_search_task(query: str):
    """Run the search task in the background"""
    global search_status

    try:
        # Get Exa API key from environment
        exa_api_key = os.environ.get('EXA_API_KEY')
        if not exa_api_key:
            search_status.update({
                "status": "error",
                "message": "API key not configured",
                "progress": 100,
                "completed": True
            })
            return

        # Update status - starting search
        search_status.update({
            "status": "searching",
            "message": f"Searching for companies related to: {query}",
            "progress": 10
        })

        # Search for companies in the industry
        search_results = search_companies_in_industry(query, exa_api_key)

        # Update status - extracting companies
        search_status.update({
            "status": "extracting",
            "message": "Extracting company names from search results",
            "progress": 30
        })

        # Extract company names from search results
        company_names = extract_company_names(search_results, query)

        # Filter out companies that are already partners
        from current_partners import CURRENT_PARTNERS
        current_partner_names = [p['name'] for p in CURRENT_PARTNERS]

        # Log checking against current partners
        print(f"Checking {len(company_names)} potential companies against {len(current_partner_names)} current partners")

        # Check for exact matches with current partners
        exact_matches = [name for name in company_names if name in current_partner_names]
        if exact_matches:
            print(f"Warning: Found {len(exact_matches)} companies that are already partners: {', '.join(exact_matches)}")

        filtered_companies = [name for name in company_names if name not in current_partner_names]

        search_status.update({
            "message": f"Found {len(filtered_companies)} potential companies after filtering out existing partners",
            "progress": 32
        })

        # Get previously considered companies
        previously_considered_companies = set(db.get_previously_considered())

        # Filter out previously considered companies
        not_previously_considered = [name for name in filtered_companies if name not in previously_considered_companies]

        search_status.update({
            "message": f"Filtered out {len(filtered_companies) - len(not_previously_considered)} previously considered companies",
            "progress": 35
        })

        # Add newly considered companies to our tracking set
        for name in not_previously_considered:
            db.add_company_to_considered(name)

        print(f"Previously considered companies (total: {len(previously_considered_companies)}): {previously_considered_companies}")

        # Limit to 40 companies for analysis (changed from 20)
        companies_to_analyze = not_previously_considered[:40]

        search_status.update({
            "message": f"Selected {len(companies_to_analyze)} new companies for analysis",
            "progress": 40
        })

        # If no companies found, return error
        if not companies_to_analyze:
            search_status.update({
                "status": "error",
                "message": "No new companies found in this industry. Try a different industry.",
                "progress": 100,
                "completed": True
            })
            return

        # Update status - analyzing companies
        search_status.update({
            "status": "analyzing",
            "message": "Analyzing companies and checking for competition with current partners",
            "progress": 50
        })

        # Generate analysis for the companies
        analysis = generate_company_analysis(companies_to_analyze, query)

        # Calculate max total score
        from scoring_criteria import SCORING_CRITERIA
        max_total_score = sum(criteria['max_points'] for criteria in SCORING_CRITERIA.values())

        # Update status - enriching data
        search_status.update({
            "status": "enriching",
            "message": f"Enriching data for all {len(analysis['companies'])} companies",
            "progress": 80
        })

        # Process all companies in parallel
        all_company_names = [company['name'] for company in analysis['companies']]
        search_status.update({
            "message": f"Processing all companies in parallel: {', '.join(all_company_names)}",
            "progress": 85
        })

        # Process companies in parallel using ThreadPoolExecutor
        from concurrent.futures import ThreadPoolExecutor, as_completed
        max_workers = min(20, len(analysis['companies']))
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Create futures for each company
            future_to_company = {executor.submit(process_company, company): company for company in analysis['companies']}

            # Process results as they complete
            completed = 0
            total = len(future_to_company)
            for future in as_completed(future_to_company):
                completed += 1
                progress = 85 + (completed / total * 10)  # Scale from 85 to 95
                search_status.update({
                    "message": f"Processed {completed}/{total} companies",
                    "progress": progress
                })

        # Calculate summary metrics
        final_competing_count = sum(1 for company in analysis['companies'] if company.get('competes_with_partners', False))
        final_enriched_count = sum(1 for company in analysis['companies'] if company.get('enriched', False))

        # Save non-conflicting companies to potential partners database
        saved_count = 0
        skipped_count = 0
        print(f"\n[SEARCH] Saving companies to Supabase database...")
        print(f"[SEARCH] Total companies to process: {len(analysis['companies'])}")

        for i, company in enumerate(analysis['companies']):
            company_name = company.get('name', 'Unknown')
            print(f"\n[SEARCH] Processing company {i+1}/{len(analysis['companies'])}: {company_name}")

            if company.get('competes_with_partners', False):
                print(f"[SEARCH] Skipping {company_name} - competes with partners")
                continue

            if company.get('has_competition', False):
                print(f"[SEARCH] Skipping {company_name} - has competition")
                continue

            print(f"[SEARCH] Attempting to save {company_name} to database")
            if db.save_potential_partner(company, query):
                saved_count += 1
                print(f"[SEARCH] Successfully saved/skipped {company_name}")
            else:
                print(f"[SEARCH] Failed to save {company_name}")

        print(f"\n[SEARCH] Save operation complete: {saved_count} companies saved/skipped")

        # Add to search history
        db.add_search_to_history("Industry Search", query, len(analysis['companies']))

        # Update status - completed
        search_status.update({
            "status": "completed",
            "message": f"Search completed: Found {len(analysis['companies'])} companies, saved {saved_count} non-conflicting companies to database (skipped existing companies)",
            "progress": 100,
            "completed": True,
            "results": {
                'industry': query,
                'analysis': analysis,
                'search_results': search_results,
                'scoring_criteria': SCORING_CRITERIA,
                'max_total_score': max_total_score
            }
        })
    except Exception as e:
        # Update status - error
        search_status.update({
            "status": "error",
            "message": f"Error in search: {str(e)}",
            "progress": 100,
            "completed": True
        })
        print(f"Error in search: {e}")
        traceback.print_exc()

async def run_ai_search_task(industry: str, api_key: str):
    """Run the AI search task in the background"""
    global search_status

    try:
        print(f"Background task: Searching for companies in {industry}")

        # Perform the search
        search_status.update({
            "status": "searching",
            "message": f"Finding companies in {industry}...",
            "progress": 20
        })

        # Search for companies in the industry
        search_results = search_companies_in_industry(industry, api_key)
        if not search_results or not isinstance(search_results, list):
            error_message = f"Failed to get search results for {industry}"
            print(f"Error: {error_message}")
            search_status.update({
                "status": "error",
                "message": error_message,
                "progress": 0,
                "error": error_message
            })
            return

        print(f"Found {len(search_results)} search results")

        # Update status
        search_status.update({
            "status": "processing",
            "message": "Extracting company names...",
            "progress": 50
        })

        # Extract company names
        companies = extract_company_names(search_results, industry)
        if not companies or not isinstance(companies, list) or len(companies) == 0:
            error_message = f"Failed to extract company names from search results for {industry}"
            print(f"Error: {error_message}")
            search_status.update({
                "status": "error",
                "message": error_message,
                "progress": 0,
                "error": error_message
            })
            return

        print(f"Extracted {len(companies)} company names")

        # Limit to 40 companies for analysis
        companies = companies[:40]

        # Update status
        search_status.update({
            "status": "analyzing",
            "message": f"Analyzing {len(companies)} companies...",
            "progress": 70
        })

        # Generate company analysis
        analysis = generate_company_analysis(companies, industry)
        if not analysis or not isinstance(analysis, dict):
            error_message = f"Failed to generate analysis for companies in {industry}"
            print(f"Error: {error_message}")
            search_status.update({
                "status": "error",
                "message": error_message,
                "progress": 0,
                "error": error_message
            })
            return

        print(f"Generated analysis for {len(analysis.get('companies', []))} companies")

        # Process each company in parallel
        processed_companies = []
        if analysis.get('companies') and isinstance(analysis['companies'], list):
            from concurrent.futures import ThreadPoolExecutor, as_completed
            with ThreadPoolExecutor(max_workers=min(10, len(analysis['companies']))) as executor:
                # Process all companies in parallel
                future_to_company = {executor.submit(process_company, company): company for company in analysis['companies']}

                # Collect results as they complete
                for future in as_completed(future_to_company):
                    try:
                        processed_company = future.result()
                        if processed_company:
                            processed_companies.append(processed_company)
                            # Add to previously considered companies
                            if processed_company.get('name'):
                                db.add_company_to_considered(processed_company['name'])
                    except Exception as e:
                        print(f"Error processing company: {str(e)}")

        # Update analysis with processed companies
        analysis['companies'] = processed_companies

        # Save non-conflicting companies to potential partners database
        saved_count = 0
        skipped_count = 0
        print(f"\n[AI_SEARCH] Saving companies to Supabase database...")
        print(f"[AI_SEARCH] Total companies to process: {len(processed_companies)}")

        for i, company in enumerate(processed_companies):
            company_name = company.get('name', 'Unknown')
            print(f"\n[AI_SEARCH] Processing company {i+1}/{len(processed_companies)}: {company_name}")

            if company.get('competes_with_partners', False):
                print(f"[AI_SEARCH] Skipping {company_name} - competes with partners")
                continue

            if company.get('has_competition', False):
                print(f"[AI_SEARCH] Skipping {company_name} - has competition")
                continue

            print(f"[AI_SEARCH] Attempting to save {company_name} to database")
            if db.save_potential_partner(company, industry):
                saved_count += 1
                print(f"[AI_SEARCH] Successfully saved/skipped {company_name}")
            else:
                print(f"[AI_SEARCH] Failed to save {company_name}")

        print(f"\n[AI_SEARCH] Save operation complete: {saved_count} companies saved/skipped")

        # Record the search in history
        db.add_search_to_history("AI Search", industry, len(processed_companies))

        # Update status to complete
        search_status.update({
            "status": "completed",
            "message": f"Search complete: Saved {saved_count} non-conflicting companies to database (skipped existing companies)",
            "progress": 100,
            "results": analysis,
            "error": None
        })

        print("AI search completed successfully")
    except Exception as e:
        error_message = f"Error in AI search background process: {str(e)}"
        print(f"ERROR: {error_message}")
        traceback.print_exc()

        # Update search status with error
        search_status.update({
            "status": "error",
            "message": error_message,
            "progress": 0,
            "error": error_message
        })
