import os
import json
from flask import Blueprint, jsonify, request
from datetime import datetime
import traceback
from ..models.database import (
    get_potential_partners,
    get_search_history_from_db,
    clear_history_from_db,
    save_company_research,
    get_company_research
)
from ..services.search_service import run_ai_search
from ..services.company_service import (
    process_company,
    process_company_chunk,
    split_into_chunks,
    generate_company_analysis
)
from ..utils.helpers import (
    load_previously_considered,
    load_search_history,
    format_partners,
    format_scoring_criteria,
    get_in_memory_considered_companies,
    get_in_memory_search_history
)
from concurrent.futures import ThreadPoolExecutor

# Create API blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Global variables for tracking search status
current_search = {
    "status": "idle",
    "industry": "",
    "progress": 0,
    "total": 0,
    "results": []
}

@api_bp.route('/')
def api_index():
    return jsonify({
        "status": "online",
        "message": "API is running"
    })

@api_bp.route('/search-status', methods=['GET'])
def get_search_status():
    """Get the current search status"""
    global current_search
    return jsonify(current_search)

@api_bp.route('/search', methods=['POST'])
def search():
    """Endpoint to search for companies in an industry"""
    global current_search
    try:
        # Get request data
        data = request.json
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400

        industry = data.get('industry')
        if not industry:
            return jsonify({
                "status": "error",
                "message": "Industry is required"
            }), 400

        # Get API key from environment or request
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            api_key = data.get('api_key')
            if not api_key:
                return jsonify({
                    "status": "error",
                    "message": "OpenAI API key is required"
                }), 400

        # Update search status
        current_search = {
            "status": "searching",
            "industry": industry,
            "progress": 0,
            "total": 100,
            "results": []
        }

        # Start search in a separate thread
        def search_thread():
            global current_search
            try:
                # First find companies in the industry
                current_search["status"] = "searching_companies"
                current_search["progress"] = 10

                # Run the AI search
                search_results = run_ai_search(industry, api_key)

                if search_results.get("status") == "error":
                    current_search["status"] = "error"
                    current_search["message"] = search_results.get("message", "Unknown error")
                    return

                companies = search_results.get("companies", [])
                if not companies:
                    current_search["status"] = "completed"
                    current_search["progress"] = 100
                    current_search["results"] = []
                    return

                # Update search status
                current_search["progress"] = 20
                current_search["status"] = "processing_companies"
                current_search["total"] = len(companies)

                # Process companies in chunks
                chunks = split_into_chunks(companies)
                total_chunks = len(chunks)

                # Get current partners for comparison
                partners = get_potential_partners()
                formatted_partners = format_partners(partners)

                # Get scoring criteria
                formatted_scoring = format_scoring_criteria()

                # Process chunks in parallel
                all_results = []
                progress_increment = 70 / total_chunks  # Distribute remaining 70% across chunks

                with ThreadPoolExecutor(max_workers=3) as executor:
                    future_to_chunk = {
                        executor.submit(process_company_chunk, chunk, industry, formatted_partners, formatted_scoring): i
                        for i, chunk in enumerate(chunks)
                    }

                    for future in future_to_chunk:
                        try:
                            chunk_result = future.result()
                            chunk_index = future_to_chunk[future]

                            # Extract company data from results
                            if "companies" in chunk_result:
                                all_results.extend(chunk_result["companies"])

                            # Update progress
                            current_search["progress"] = 20 + int((chunk_index + 1) * progress_increment)
                        except Exception as e:
                            print(f"Error processing chunk: {str(e)}")
                            traceback.print_exc()

                # Update final results
                current_search["status"] = "completed"
                current_search["progress"] = 100
                current_search["results"] = all_results
            except Exception as e:
                print(f"Error in search thread: {str(e)}")
                traceback.print_exc()
                current_search["status"] = "error"
                current_search["message"] = str(e)

        # Start the search thread
        import threading
        search_thread = threading.Thread(target=search_thread)
        search_thread.daemon = True
        search_thread.start()

        # Return initial status
        return jsonify({
            "status": "searching",
            "message": f"Search started for industry: {industry}"
        })
    except Exception as e:
        print(f"Error in search endpoint: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@api_bp.route('/ai-search', methods=['GET'])
def ai_search():
    """Get results of AI search for potential partners"""
    industry = request.args.get('industry')
    if not industry:
        return jsonify({
            "status": "error",
            "message": "Industry parameter is required"
        }), 400

    # Get API key from environment
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return jsonify({
            "status": "error",
            "message": "OpenAI API key not configured"
        }), 500

    # Run the search
    search_result = run_ai_search(industry, api_key)
    return jsonify(search_result)

@api_bp.route('/reset-history', methods=['POST'])
def reset_history():
    """Reset all search history and previously considered companies"""
    global previously_considered_companies, search_history
    try:
        # Clear database
        success = clear_history_from_db()

        if success:
            # Reset in-memory data
            previously_considered_companies = set()
            search_history = []

            return jsonify({
                "status": "success",
                "message": "History cleared successfully"
            })
        else:
            return jsonify({
                "status": "error",
                "message": "Failed to clear history from database"
            }), 500
    except Exception as e:
        print(f"Error resetting history: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@api_bp.route('/search-history', methods=['GET'])
def get_search_history():
    """Get search history"""
    try:
        # Get search history from database
        history = get_search_history_from_db()

        # Format for API response
        formatted_history = []
        for entry in history:
            formatted_history.append({
                "timestamp": entry.get('timestamp'),
                "type": entry.get('search_type'),
                "query": entry.get('query'),
                "count": entry.get('results_count')
            })

        return jsonify({
            "status": "success",
            "history": formatted_history
        })
    except Exception as e:
        print(f"Error getting search history: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@api_bp.route('/history', methods=['GET'])
def get_full_history():
    """Get full history including search history and previously considered companies"""
    try:
        # Load data if needed
        load_previously_considered()
        load_search_history()

        # Get in-memory data
        considered = get_in_memory_considered_companies()
        history = get_in_memory_search_history()

        return jsonify({
            "status": "success",
            "search_history": history,
            "previously_considered": list(considered)
        })
    except Exception as e:
        print(f"Error getting full history: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@api_bp.route('/potential-partners', methods=['GET'])
def get_partners():
    """Get potential partners from the database with optional filtering"""
    try:
        # Get query parameters
        search_query = request.args.get('search', None)
        date_from = request.args.get('date_from', None)
        date_to = request.args.get('date_to', None)
        sort_by = request.args.get('sort_by', 'score')
        sort_order = request.args.get('sort_order', 'desc')

        # Get partners from database with filtering
        partners = get_potential_partners(
            search_query=search_query,
            date_from=date_from,
            date_to=date_to,
            sort_by=sort_by,
            sort_order=sort_order
        )

        # Format response
        print(f"Returning {len(partners)} potential partners")

        # Format the response to match what the frontend expects
        response = {
            "status": "success",
            "partners": partners
        }

        print(f"Response data: {response}")
        return jsonify(response)
    except Exception as e:
        print(f"Error getting potential partners: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@api_bp.route('/clear-potential-partners', methods=['POST'])
def clear_partners():
    """Clear all potential partners from the database"""
    try:
        # Handle clearing partners in database module
        success = clear_history_from_db()  # This function also clears partners

        if success:
            return jsonify({
                "status": "success",
                "message": "Potential partners cleared successfully"
            })
        else:
            return jsonify({
                "status": "error",
                "message": "Failed to clear potential partners from database"
            }), 500
    except Exception as e:
        print(f"Error clearing potential partners: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@api_bp.route('/stats', methods=['GET'])
def get_stats():
    """Get statistics about searches and potential partners"""
    try:
        # Get partners from database
        partners = get_potential_partners()

        # Get search history
        history = get_search_history_from_db()

        # Calculate stats
        total_searches = len(history)
        total_partners = len(partners)

        # Calculate average partnership score
        total_score = 0
        partners_with_scores = 0
        for partner in partners:
            score = partner.get('partnership_score')
            if score is not None:
                try:
                    score_float = float(score)
                    total_score += score_float
                    partners_with_scores += 1
                except (ValueError, TypeError):
                    pass

        avg_score = round(total_score / partners_with_scores, 2) if partners_with_scores > 0 else 0

        # Get top industries
        industries = {}
        for partner in partners:
            industry = partner.get('industry')
            if industry:
                industries[industry] = industries.get(industry, 0) + 1

        top_industries = [{"industry": k, "count": v} for k, v in industries.items()]
        top_industries.sort(key=lambda x: x["count"], reverse=True)
        top_industries = top_industries[:5]  # Top 5

        return jsonify({
            "status": "success",
            "stats": {
                "total_searches": total_searches,
                "total_partners": total_partners,
                "avg_partnership_score": avg_score,
                "top_industries": top_industries
            }
        })
    except Exception as e:
        print(f"Error getting stats: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@api_bp.route('/top-partners', methods=['GET'])
def get_top_partners():
    """Get top potential partners based on partnership score"""
    try:
        # Get partners from database
        partners = get_potential_partners()

        # Sort by partnership score
        def get_score(partner):
            try:
                return float(partner.get('partnership_score', 0))
            except (ValueError, TypeError):
                return 0

        sorted_partners = sorted(partners, key=get_score, reverse=True)

        # Get limit parameter
        limit = request.args.get('limit', default=5, type=int)
        top_partners = sorted_partners[:limit]

        return jsonify({
            "status": "success",
            "partners": top_partners
        })
    except Exception as e:
        print(f"Error getting top partners: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@api_bp.route('/company-details', methods=['POST'])
def get_company_details():
    """Get detailed information about a company"""
    try:
        data = request.json
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400

        company_name = data.get('company')
        if not company_name:
            return jsonify({
                "status": "error",
                "message": "Company name is required"
            }), 400

        # Process the company
        company_details = process_company(company_name)

        return jsonify({
            "status": "success",
            "company": company_details
        })
    except Exception as e:
        print(f"Error getting company details: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@api_bp.route('/company-research', methods=['POST'])
def save_research_endpoint():
    """Save company research data to the database"""
    try:
        data = request.json
        if not data:
            return jsonify({
                "status": "error",
                "message": "No data provided"
            }), 400

        company_name = data.get('company')
        research_data = data.get('research')
        source = data.get('source', 'manual')

        if not company_name or not research_data:
            return jsonify({
                "status": "error",
                "message": "Company name and research data are required"
            }), 400

        # Save to database
        success = save_company_research(company_name, research_data, source)

        if success:
            return jsonify({
                "status": "success",
                "message": f"Research data saved for {company_name}"
            })
        else:
            return jsonify({
                "status": "error",
                "message": "Failed to save research data"
            }), 500
    except Exception as e:
        print(f"Error saving company research: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@api_bp.route('/company-research/<company_name>', methods=['GET'])
def get_research_endpoint(company_name):
    """Get company research data from the database"""
    try:
        if not company_name:
            return jsonify({
                "status": "error",
                "message": "Company name is required"
            }), 400

        # Get from database
        research = get_company_research(company_name)

        if research:
            return jsonify({
                "status": "success",
                "research": research
            })
        else:
            return jsonify({
                "status": "error",
                "message": "No research found for this company"
            }), 404
    except Exception as e:
        print(f"Error getting company research: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@api_bp.route('/api-healthcheck', methods=['GET'])
def api_healthcheck():
    """Check if the API is running"""
    return jsonify({
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "message": "API is operational"
    })