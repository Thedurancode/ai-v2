import os
import json
import base64
import re
import traceback
from datetime import datetime
from ..models.database import (
    get_search_history_from_db,
    get_previously_considered_from_db,
    get_potential_partners
)

# Global variables for in-memory caching
previously_considered_companies = set()
search_history = []

def transform_research_for_pdf(research_data):
    """Transform raw research data into PDF-compatible format with sections
    
    Args:
        research_data (dict): Raw research data from various sources
        
    Returns:
        list: List of sections with heading/content structure for PDF generation
    """
    sections = []
    
    # Overview Section
    overview = research_data.get('overview', {})
    if overview or isinstance(overview, dict):
        sections.append({
            'heading': 'Overview',
            'content': overview.get('description', '') or 
                       research_data.get('description', '') or
                       research_data.get('company_details', {}).get('description', '')
        })
    
    # Leadership Section
    leadership = research_data.get('leadership', {})
    if leadership.get('executives'):
        content = "### Key Leadership\n"
        for exec in leadership['executives'][:5]:  # Limit to top 5
            content += f"- **{exec.get('name', 'N/A')}**: {exec.get('title', 'N/A')}\n"
        sections.append({
            'heading': 'Leadership',
            'content': content
        })
    
    # Business Model Section
    business_model = research_data.get('business_model', {})
    if business_model:
        content = ""
        if business_model.get('revenue'):
            content += f"- **Revenue**: {business_model['revenue']}\n"
        if business_model.get('model'):
            content += f"- **Model**: {business_model['model']}\n"
        if content:
            sections.append({
                'heading': 'Business Model & Revenue',
                'content': content
            })
    
    # Market Position Section
    market_position = research_data.get('market_position', {})
    if market_position:
        content = ""
        if market_position.get('market_share'):
            content += f"- **Market Share**: {market_position['market_share']}\n"
        if market_position.get('growth_rate'):
            content += f"- **Growth Rate**: {market_position['growth_rate']}\n"
        if market_position.get('competitors'):
            content += "### Key Competitors\n"
            for comp in market_position['competitors'][:5]:  # Limit to top 5
                content += f"- {comp}\n"
        if content:
            sections.append({
                'heading': 'Market Position',
                'content': content
            })
    
    # Products Section
    products = research_data.get('products_and_services', [])
    if products:
        content = "### Key Products/Services\n"
        for product in products[:5]:  # Limit to top 5
            content += f"- **{product.get('name', 'N/A')}**: {product.get('description', '')}\n"
        sections.append({
            'heading': 'Products & Services',
            'content': content
        })
    
    # Partnership Opportunities Section
    opportunities = research_data.get('partnership_opportunities', [])
    if opportunities:
        content = "### Potential Partnership Opportunities\n"
        for opp in opportunities[:3]:  # Limit to top 3
            content += f"- {opp}\n"
        sections.append({
            'heading': 'Opportunities for MLSE Partnership',
            'content': content
        })
    
    # Remove any empty sections
    sections = [s for s in sections if s.get('content') and s['content'].strip()]
    
    return sections

def load_previously_considered():
    """Load previously considered companies from database into memory"""
    global previously_considered_companies
    try:
        # Get data from database
        records = get_previously_considered_from_db()
        
        # Update in-memory set
        previously_considered_companies = set()
        if records:
            for record in records:
                company_name = record.get('company_name')
                if company_name:
                    previously_considered_companies.add(company_name)
        
        print(f"Loaded {len(previously_considered_companies)} previously considered companies from database")
        return previously_considered_companies
    except Exception as e:
        print(f"Error loading previously considered companies: {str(e)}")
        traceback.print_exc()
        return set()

def load_search_history():
    """Load search history from database into memory"""
    global search_history
    try:
        # Get data from database
        records = get_search_history_from_db()
        
        # Update in-memory list
        search_history = []
        if records:
            for record in records:
                search_history.append({
                    "timestamp": record.get('timestamp'),
                    "type": record.get('search_type'),
                    "query": record.get('query'),
                    "results_count": record.get('results_count')
                })
        
        print(f"Loaded {len(search_history)} search history records from database")
        return search_history
    except Exception as e:
        print(f"Error loading search history: {str(e)}")
        traceback.print_exc()
        return []

def format_partners(partners_list):
    """Format the list of current partners for AI prompt"""
    if not partners_list:
        return "We currently have no active partners."
    
    # Format partners as a bulleted list
    formatted = "We have the following current partners:\n"
    for partner in partners_list:
        name = partner.get('name', 'Unknown')
        description = partner.get('description', 'No description available')
        formatted += f"- {name}: {description}\n"
    
    return formatted

def format_scoring_criteria():
    """Format the scoring criteria for AI prompt"""
    return """
    Brand Alignment (0-20 points):
    - How well the company's brand values align with ours
    - Reputation and market perception
    - Visual and messaging consistency

    Audience Fit (0-20 points):
    - Overlap with our target demographic
    - Potential to reach new relevant audiences
    - Similar customer profiles

    Content Opportunities (0-20 points):
    - Potential for joint content creation
    - Storytelling capabilities
    - Content distribution reach

    Digital Integration (0-20 points):
    - Technological compatibility
    - Digital platform presence
    - Integration ease

    Innovation Potential (0-20 points):
    - Track record of innovation
    - Future-focused vision
    - Adaptability and flexibility
    """

def get_in_memory_considered_companies():
    """Get the in-memory set of previously considered companies"""
    global previously_considered_companies
    if not previously_considered_companies:
        load_previously_considered()
    return previously_considered_companies

def get_in_memory_search_history():
    """Get the in-memory list of search history"""
    global search_history
    if not search_history:
        load_search_history()
    return search_history

def is_company_considered(company_name):
    """Check if a company has been previously considered"""
    return company_name in get_in_memory_considered_companies()

def format_timestamp(timestamp):
    """Format a timestamp for display"""
    if not timestamp:
        return "Unknown"
    
    try:
        # Handle string timestamps
        if isinstance(timestamp, str):
            # Try to parse ISO format
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        else:
            # Assume it's already a datetime
            dt = timestamp
        
        # Format for display
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except Exception as e:
        print(f"Error formatting timestamp: {str(e)}")
        return str(timestamp)
