import os
import json
import requests
from typing import List, Dict, Any
import re
from openai import OpenAI
from datetime import datetime
import traceback

# Constants
CURRENT_PARTNERS = [
    {"name": "Example Partner 1", "industry": "Technology"},
    {"name": "Example Partner 2", "industry": "Healthcare"}
    # Add more current partners here
]

SCORING_CRITERIA = {
    "business_alignment": {
        "description": "How well the company aligns with our business goals",
        "max_points": 25
    },
    "market_position": {
        "description": "The company's position and influence in their market",
        "max_points": 20
    },
    "innovation": {
        "description": "The company's innovative capabilities and approach",
        "max_points": 15
    },
    "partnership_feasibility": {
        "description": "How feasible a partnership would be to establish and maintain",
        "max_points": 20
    },
    "growth_potential": {
        "description": "The potential for mutual growth through partnership",
        "max_points": 20
    }
}

def search_companies_in_industry(industry: str, api_key: str) -> List[Dict[str, Any]]:
    """
    Search for companies in a specific industry using the Exa API
    """
    try:
        # Prepare the query for company search
        query = f"top companies in {industry} industry"
        
        # Make the request to Exa API
        url = "https://api.exa.ai/search"
        headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json"
        }
        data = {
            "query": query,
            "num_results": 30,  # Increased from 20 to get more potential companies
            "use_autoprompt": True
        }
        
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        
        # Parse the response
        results = response.json().get("results", [])
        print(f"Found {len(results)} results from Exa for industry: {industry}")
        
        return results
    except Exception as e:
        print(f"Error searching companies in industry: {str(e)}")
        traceback.print_exc()
        return []

def extract_company_names(search_results: List[Dict[str, Any]], industry: str) -> List[str]:
    """
    Extract company names from search results and remove duplicates
    """
    try:
        # Use OpenAI to extract company names from search results
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Format search results for LLM
        formatted_results = []
        for i, result in enumerate(search_results):
            formatted_results.append(f"[{i+1}] Title: {result.get('title', 'No Title')}")
            formatted_results.append(f"URL: {result.get('url', 'No URL')}")
            formatted_results.append(f"Text snippet: {result.get('text', 'No text')[:500]}...")
            formatted_results.append("---")
        
        # Prepare prompt for OpenAI
        prompt = f"""
        You are an expert at extracting company names from search results.
        
        I'm looking for companies in the {industry} industry. Below are search results about companies in this field.
        
        Please analyze these results and extract a list of company names. Focus on actual companies, not individuals or other entities.
        
        Search Results:
        {"".join(formatted_results)}
        
        Please respond ONLY with a JSON array of company names. For example:
        ["Company A", "Company B", "Company C"]
        
        Do not include any explanations, just the JSON array.
        """
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1000
        )
        
        # Parse the response to extract company names
        response_text = response.choices[0].message.content.strip()
        
        # Attempt to extract JSON array from the response
        json_match = re.search(r'\[(.*)\]', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            company_names = json.loads(json_str)
        else:
            # Fallback if JSON parsing fails
            lines = response_text.split('\n')
            company_names = []
            for line in lines:
                line = line.strip()
                if line and not line.startswith('[') and not line.startswith(']'):
                    # Remove potential quote characters and numbers
                    clean_line = re.sub(r'^["\'\d\.\s]+', '', line)
                    clean_line = re.sub(r'["\',]+$', '', clean_line)
                    if clean_line:
                        company_names.append(clean_line)
        
        # Remove duplicates and standardize
        unique_companies = []
        seen = set()
        for name in company_names:
            # Standardize the name by removing extra spaces and converting to title case
            standard_name = ' '.join(name.split()).strip()
            if standard_name.lower() not in seen and len(standard_name) > 1:
                seen.add(standard_name.lower())
                unique_companies.append(standard_name)
        
        print(f"Extracted {len(unique_companies)} unique company names")
        return unique_companies
    
    except Exception as e:
        print(f"Error extracting company names: {str(e)}")
        traceback.print_exc()
        return []

def generate_company_analysis(company_names: List[str], industry: str) -> Dict[str, Any]:
    """
    Generate analysis for a list of companies using OpenAI
    """
    try:
        # Use OpenAI to analyze companies
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Convert current partner list to a formatted string
        current_partners_str = "\n".join([f"- {p['name']} ({p['industry']})" for p in CURRENT_PARTNERS])
        
        # Prepare prompt for OpenAI
        prompt = f"""
        You are a strategic partnership advisor analyzing potential partner companies.
        
        I'm looking for partnership opportunities in the {industry} industry. Please analyze the following companies:
        {", ".join(company_names)}
        
        Our current partners are:
        {current_partners_str}
        
        For each company, please:
        1. Provide a brief description
        2. Determine if they might compete with any of our current partners
        3. Score them on our partnership criteria:
           - Business Alignment (max 25 points)
           - Market Position (max 20 points)
           - Innovation (max 15 points)
           - Partnership Feasibility (max 20 points)
           - Growth Potential (max 20 points)
           
        Respond with JSON only in this exact format:
        {{
          "companies": [
            {{
              "name": "Company Name",
              "description": "Brief company description",
              "competes_with_partners": true/false,
              "competing_partners": ["Partner Name"] or [],
              "scores": {{
                "business_alignment": 20,
                "market_position": 15,
                "innovation": 10,
                "partnership_feasibility": 15,
                "growth_potential": 18
              }},
              "total_score": 78,
              "score": 78,
              "recommendation": "Brief partnership recommendation"
            }}
          ]
        }}
        """
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=4000,
            response_format={"type": "json_object"}
        )
        
        # Parse the response
        analysis = json.loads(response.choices[0].message.content)
        print(f"Generated analysis for {len(analysis.get('companies', []))} companies")
        
        return analysis
    
    except Exception as e:
        print(f"Error generating company analysis: {str(e)}")
        traceback.print_exc()
        return {"companies": []}

def process_company(company: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a single company to enrich its data
    """
    try:
        name = company.get('name', '')
        
        # Get OpenAI client
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Generate additional insights
        prompt = f"""
        You are a business intelligence expert. I need detailed information about {name}.
        
        Please provide the following information in a structured format:
        - More detailed company description
        - Leadership team information
        - Key products/services
        - Partnership opportunities
        - Market analysis
        - Partnership potential assessment
        - Headquarters location
        - Website
        - Company size
        
        Format your response as JSON only with these exact keys:
        {{
          "detailed_description": "text",
          "leadership": "text",
          "products": "text",
          "opportunities": "text",
          "market_analysis": "text",
          "partnership_potential": "text",
          "headquarters": "text",
          "website": "text",
          "company_size": "text"
        }}
        """
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo-1106",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )
        
        # Parse the response
        enrichment = json.loads(response.choices[0].message.content)
        
        # Update the company data
        company['detailed_description'] = enrichment.get('detailed_description', '')
        company['leadership'] = enrichment.get('leadership', '')
        company['products'] = enrichment.get('products', '')
        company['opportunities'] = enrichment.get('opportunities', '')
        company['market_analysis'] = enrichment.get('market_analysis', '')
        company['partnership_potential'] = enrichment.get('partnership_potential', '')
        company['headquarters'] = enrichment.get('headquarters', '')
        company['website'] = enrichment.get('website', '')
        company['company_size'] = enrichment.get('company_size', '')
        company['enriched'] = True
        
        print(f"Enriched data for company: {name}")
        
        # If we haven't already set a description, use the detailed description
        if not company.get('description') and company.get('detailed_description'):
            company['description'] = company['detailed_description']
        
        return company
    except Exception as e:
        print(f"Error processing company {company.get('name', 'Unknown')}: {str(e)}")
        company['enriched'] = False
        company['enrichment_error'] = str(e)
        return company 