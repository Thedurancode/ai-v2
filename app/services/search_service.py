import os
import json
import requests
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from openai import OpenAI
from ..models.database import add_search_to_history

# Initialize OpenAI client
api_key = os.environ.get("OPENAI_API_KEY")
try:
    client = OpenAI(api_key=api_key) if api_key else None
except Exception as e:
    print(f"Error initializing OpenAI client: {e}")
    client = None

def generate_logo(company_name):
    """Generate a logo placeholder for a company"""
    # This could be replaced with a real logo generation API
    colors = ["#4285F4", "#34A853", "#FBBC05", "#EA4335", "#5F6368", "#1A73E8"]
    import random
    import base64
    
    # Use first letter of company name
    first_letter = company_name[0].upper() if company_name else "C"
    color = random.choice(colors)
    
    # Generate a simple SVG
    svg = f"""
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="{color}" />
        <text x="50" y="65" font-family="Arial" font-size="45" font-weight="bold" text-anchor="middle" fill="white">{first_letter}</text>
    </svg>
    """
    
    # Convert to base64 for embedding in JSON
    svg_base64 = base64.b64encode(svg.encode('utf-8')).decode('utf-8')
    return f"data:image/svg+xml;base64,{svg_base64}"

def search_companies_in_industry(industry, api_key):
    """Search for companies in a specific industry"""
    try:
        # Log the search
        add_search_to_history("industry", industry, 0)
        
        # Check if we have a client
        global client
        if not client and api_key:
            client = OpenAI(api_key=api_key)
        
        if not client:
            print("Error: OpenAI client not available")
            return []
            
        # For demonstration, we'll use the OpenAI API to generate relevant companies
        # In a real application, this would call a company database or API
        prompt = f"""
        Generate a list of 10 real, well-known companies in the {industry} industry.
        These should be actual companies, not fictional ones.
        For each company, provide:
        1. Company name
        2. A brief description (2-3 sentences)
        3. Headquarters location
        4. Year founded (approximate if needed)
        5. Key products or services (2-3 main offerings)
        
        Format the response as a JSON array with objects containing fields:
        "name", "description", "headquarters", "founded", "products"
        
        Only return valid JSON with no extra text or explanations.
        """
        
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that provides accurate business information."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        # Parse the response
        try:
            content = response.choices[0].message.content
            data = json.loads(content)
            
            # If companies key exists, use that, otherwise assume the response is the array directly
            companies = data.get("companies", None)
            if companies is None and isinstance(data, dict) and any(isinstance(data.get(k), list) for k in data):
                # Find the first list in the response
                for k, v in data.items():
                    if isinstance(v, list):
                        companies = v
                        break
            if companies is None:
                companies = data if isinstance(data, list) else []
            
            # Add logos
            for company in companies:
                company["logo"] = generate_logo(company.get("name", ""))
            
            # Update search history with count
            add_search_to_history("industry", industry, len(companies))
            
            return companies
        except json.JSONDecodeError:
            print(f"Error parsing JSON response: {response.choices[0].message.content}")
            return []
    except Exception as e:
        print(f"Error searching companies in industry: {str(e)}")
        traceback.print_exc()
        return []

def extract_company_names(search_results, industry):
    """Extract company names from search results for further processing"""
    if not search_results:
        return []
    
    companies = []
    
    # Handle different types of search results
    if isinstance(search_results, list):
        # Direct list of company objects
        for result in search_results:
            if isinstance(result, dict) and 'name' in result:
                company_name = result['name']
                company_info = {
                    'name': company_name,
                    'industry': industry
                }
                
                # Copy any additional fields from the search result
                for key in ['description', 'headquarters', 'founded', 'products', 'logo']:
                    if key in result:
                        company_info[key] = result[key]
                
                companies.append(company_info)
            elif isinstance(result, str):
                # If it's just a string, assume it's the company name
                companies.append({
                    'name': result,
                    'industry': industry
                })
    elif isinstance(search_results, dict):
        # If it's a dictionary with a 'companies' key
        if 'companies' in search_results and isinstance(search_results['companies'], list):
            companies = extract_company_names(search_results['companies'], industry)
        else:
            # Single company result
            if 'name' in search_results:
                company_name = search_results['name']
                company_info = {
                    'name': company_name,
                    'industry': industry
                }
                
                # Copy any additional fields
                for key in ['description', 'headquarters', 'founded', 'products', 'logo']:
                    if key in search_results:
                        company_info[key] = search_results[key]
                
                companies.append(company_info)
    
    return companies

def run_ai_search(industry, api_key):
    """Run an AI-powered search for potential partners in an industry"""
    try:
        # Step 1: Search for companies in the industry
        print(f"Searching for companies in {industry}...")
        companies = search_companies_in_industry(industry, api_key)
        
        if not companies:
            return {
                "status": "error",
                "message": "No companies found in this industry"
            }
        
        # Step 2: Extract company names for processing
        company_info_list = extract_company_names(companies, industry)
        
        return {
            "status": "success",
            "companies": company_info_list,
            "count": len(company_info_list)
        }
    except Exception as e:
        print(f"Error in AI search: {str(e)}")
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"Search error: {str(e)}"
        } 