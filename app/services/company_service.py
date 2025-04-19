import os
import requests
import json
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
import random
from openai import OpenAI
from ..models.database import add_company_to_considered, save_potential_partner

# Initialize OpenAI client
api_key = os.environ.get("OPENAI_API_KEY")
try:
    client = OpenAI(api_key=api_key) if api_key else None
except Exception as e:
    print(f"Error initializing OpenAI client: {e}")
    client = None

def fetch_coresignal_data(company_name):
    """Fetch company data from Coresignal API or mock data"""
    try:
        api_key = os.environ.get("CORESIGNAL_API_KEY")
        if not api_key:
            print("Warning: No Coresignal API key found. Using mock data.")
            return generate_mock_coresignal_data(company_name)

        # Actual API endpoint would be used here
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # This is a placeholder - replace with actual CoreSignal API endpoint
        response = requests.get(
            f"https://api.coresignal.com/v1/companies/search?query={company_name}",
            headers=headers
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error from Coresignal API: {response.status_code} - {response.text}")
            return generate_mock_coresignal_data(company_name)  # Fallback to mock
    except Exception as e:
        print(f"Error fetching Coresignal data: {str(e)}")
        traceback.print_exc()
        return generate_mock_coresignal_data(company_name)  # Fallback to mock

def generate_mock_coresignal_data(company_name):
    """Generate mock company data for testing"""
    industries = ["Technology", "Finance", "Healthcare", "Retail", "Manufacturing", "Energy"]
    leadership_titles = ["CEO", "CTO", "CFO", "COO", "CMO", "CIO"]
    leadership_names = ["John Smith", "Maria Rodriguez", "David Johnson", "Sarah Lee", "Michael Chen", "Emma Wilson"]
    keywords = ["innovative", "sustainable", "customer-focused", "growth", "disruptive", "market leader"]
    
    # Generate random data
    founded_year = random.randint(1980, 2020)
    employees_count = random.randint(50, 10000)
    revenue = f"${random.randint(1, 500)}M"
    industry = random.choice(industries)
    
    # Generate executives
    executives = []
    for i in range(random.randint(3, 5)):
        executives.append({
            "name": random.choice(leadership_names),
            "title": random.choice(leadership_titles)
        })
    
    # Generate products
    products = []
    for i in range(random.randint(2, 5)):
        products.append({
            "name": f"{company_name} {chr(65 + i)}",
            "description": f"A {random.choice(keywords)} product for {industry} sector."
        })
    
    return {
        "company_details": {
            "name": company_name,
            "website": f"https://www.{company_name.lower().replace(' ', '')}.com",
            "founded": founded_year,
            "headquarters": f"{random.choice(['New York', 'San Francisco', 'London', 'Berlin', 'Tokyo'])}, {random.choice(['USA', 'UK', 'Germany', 'Japan'])}",
            "employees": employees_count,
            "revenue": revenue,
            "industry": industry,
            "description": f"{company_name} is a {random.choice(keywords)} company in the {industry} sector."
        },
        "leadership": {
            "executives": executives
        },
        "products_and_services": products,
        "market_position": {
            "competitors": [f"Competitor {i+1}" for i in range(random.randint(2, 5))],
            "market_share": f"{random.randint(5, 30)}%",
            "growth_rate": f"{random.randint(-5, 25)}%"
        }
    }

def fetch_linkedin_data(company_name):
    """Fetch company data from LinkedIn API or mock data"""
    try:
        api_key = os.environ.get("LINKEDIN_API_KEY")
        if not api_key:
            print("Warning: No LinkedIn API key found. Using mock data.")
            return generate_mock_linkedin_data(company_name)
            
        # In a real implementation, this would use the LinkedIn API
        # For now, we'll use mock data
        return generate_mock_linkedin_data(company_name)
    except Exception as e:
        print(f"Error fetching LinkedIn data: {str(e)}")
        traceback.print_exc()
        return generate_mock_linkedin_data(company_name)

def generate_mock_linkedin_data(company_name):
    """Generate mock LinkedIn data for testing"""
    # Generate a company profile similar to LinkedIn
    follower_count = random.randint(1000, 100000)
    employee_count = random.randint(50, 5000)
    
    # Format headquarters with city and country
    def formatHeadquarters(hq):
        cities = ["New York", "San Francisco", "London", "Tokyo", "Berlin", "Paris", "Sydney"]
        countries = ["United States", "United Kingdom", "Japan", "Germany", "France", "Australia"]
        return f"{random.choice(cities)}, {random.choice(countries)}"
    
    # Generate specialties
    specialties = []
    all_specialties = ["Software Development", "Cloud Computing", "AI Research", "Digital Marketing", 
                       "Customer Experience", "Mobile Applications", "E-commerce", "Data Analytics", 
                       "Cybersecurity", "Consulting"]
    num_specialties = random.randint(3, 6)
    for _ in range(num_specialties):
        specialty = random.choice(all_specialties)
        if specialty not in specialties:
            specialties.append(specialty)
    
    # Create a description with company name
    descriptions = [
        f"{company_name} is transforming the industry with innovative solutions.",
        f"At {company_name}, we believe in creating technology that makes a difference.",
        f"{company_name} is dedicated to excellence in everything we do.",
        f"As a leader in the field, {company_name} is committed to sustainable growth."
    ]
    
    # Industry options
    industries = ["Technology", "Software Development", "Financial Services", "Healthcare", 
                 "Retail", "Manufacturing", "Energy", "Education", "Media"]
    
    # Generate recent posts
    posts = []
    post_texts = [
        "We're excited to announce our latest product launch!",
        "Join us at the upcoming industry conference.",
        "We're hiring! Check out our careers page for open positions.",
        "Our team is celebrating another successful quarter.",
        "Read our latest case study on how we helped a client transform their business."
    ]
    
    for _ in range(random.randint(3, 5)):
        post = {
            "text": random.choice(post_texts),
            "likes": random.randint(10, 500),
            "comments": random.randint(0, 50),
            "posted_date": f"{random.randint(1, 30)} days ago"
        }
        posts.append(post)
    
    # Create the LinkedIn data object
    linkedin_data = {
        "name": company_name,
        "url": f"https://www.linkedin.com/company/{company_name.lower().replace(' ', '-')}",
        "follower_count": follower_count,
        "employee_count": employee_count,
        "headquarters": formatHeadquarters(None),
        "industry": random.choice(industries),
        "description": random.choice(descriptions),
        "founded": random.randint(1980, 2020),
        "specialties": specialties,
        "website": f"https://www.{company_name.lower().replace(' ', '')}.com",
        "recent_posts": posts
    }
    
    return linkedin_data

def process_company(company):
    """Process a single company to get detailed information"""
    try:
        if isinstance(company, str):
            company_name = company
            company = {"name": company_name}
        else:
            company_name = company.get('name', 'Unknown Company')
        
        print(f"Processing company: {company_name}")
        
        # Add to considered companies - wrapped in try-except to handle RLS policy issues
        try:
            add_company_to_considered(company_name)
        except Exception as e:
            print(f"Non-critical error adding company to considered list: {str(e)}")
            # Continue processing even if this fails
        
        # Fetch Coresignal data
        coresignal_data = fetch_coresignal_data(company_name)
        
        # Fetch LinkedIn data
        linkedin_data = fetch_linkedin_data(company_name)
        
        # Combine data
        processed_company = {
            "name": company_name,
            "coresignal_data": coresignal_data,
            "linkedin_data": linkedin_data
        }
        
        return processed_company
    except Exception as e:
        print(f"Error processing company {company}: {str(e)}")
        traceback.print_exc()
        return {"name": company.get('name', 'Unknown'), "error": str(e)}

def split_into_chunks(companies, chunk_size=4):
    """Split a list of companies into chunks for parallel processing"""
    return [companies[i:i + chunk_size] for i in range(0, len(companies), chunk_size)]

def process_company_chunk(companies_chunk, industry, formatted_partners, formatted_scoring):
    """Process a chunk of companies and generate analysis"""
    try:
        # Process each company to get detailed data
        processed_companies = []
        for company in companies_chunk:
            if isinstance(company, str):
                company_name = company
                company = {"name": company_name}
            else:
                company_name = company.get('name')
            
            # Process the company
            processed_company = process_company(company)
            processed_companies.append(processed_company)
        
        # Generate analysis for the processed companies
        analysis = generate_company_analysis(processed_companies, industry, formatted_partners, formatted_scoring)
        
        # Save companies to database
        if analysis and "companies" in analysis:
            for company_data in analysis["companies"]:
                # Save to database if it doesn't compete with partners
                if not company_data.get("competes_with_partners", False):
                    save_potential_partner(company_data, industry)
        
        return analysis
    except Exception as e:
        print(f"Error processing company chunk: {str(e)}")
        traceback.print_exc()
        return {"error": str(e)}

def generate_company_analysis(companies, industry, formatted_partners, formatted_scoring):
    """Generate AI analysis of companies for partnership potential"""
    try:
        if not companies:
            return {"companies": []}
        
        # Check if we have a client
        global client
        if not client:
            print("Error: OpenAI client not available for company analysis")
            return {"error": "OpenAI client not available", "companies": []}
        
        # Prepare company data for the prompt
        companies_data = []
        for company in companies:
            company_name = company.get('name', 'Unknown')
            
            # Extract info from CoreSignal data
            company_details = {}
            products = []
            executives = []
            
            if 'coresignal_data' in company:
                coresignal = company['coresignal_data']
                if 'company_details' in coresignal:
                    company_details = coresignal['company_details']
                
                if 'products_and_services' in coresignal:
                    products = coresignal['products_and_services']
                
                if 'leadership' in coresignal and 'executives' in coresignal['leadership']:
                    executives = coresignal['leadership']['executives']
            
            # Extract info from LinkedIn data
            linkedin_info = {}
            if 'linkedin_data' in company:
                linkedin_info = company['linkedin_data']
            
            # Format company data
            company_info = {
                "name": company_name,
                "details": company_details,
                "products": products,
                "executives": executives,
                "linkedin": linkedin_info
            }
            
            companies_data.append(company_info)
        
        # Convert to JSON string for the prompt
        companies_json = json.dumps(companies_data, indent=2)
        
        # Create the prompt for company analysis
        prompt = f"""
        You are an expert business analyst specializing in partnership evaluation. Analyze the following companies 
        in the {industry} industry to determine their potential as strategic partners. 
        
        Evaluate each company based on:
        1. Brand alignment with our company
        2. Audience fit
        3. Content opportunities for joint initiatives
        4. Digital integration potential
        5. Innovation potential for future collaboration
        
        Be thorough and conservative - if there's any significant overlap or competition, mark as competing.
        
        IMPORTANT: If a company competes with ANY current partner, its total_score MUST be set to 0.
        
        Provide a detailed analysis of each company, including:
        - Company overview
        - Products/services
        - Market position
        - Whether they compete with any current partners (specify which partners and why)
        - Score breakdown across all categories (set all scores to 0 if company competes with any partner)
        - Total score (must be 0 if company competes with any partner)
        
        Our current partners are:
        {formatted_partners}
        
        The scoring criteria are:
        {formatted_scoring}
        
        Companies to analyze:
        {companies_json}
        
        Return your analysis as a JSON object with the following structure:
        {{
            "companies": [
                {{
                    "name": "Company Name",
                    "description": "Company overview",
                    "products_services": "Products and services",
                    "market_position": "Market position",
                    "competes_with_partners": true/false,
                    "competing_partners": ["Partner1", "Partner2"],  // Only if competes_with_partners is true
                    "competition_reasons": "Explanation of why they compete",  // Only if competes_with_partners is true
                    "scores": {{
                        "brand_alignment": {{ "score": X, "max": Y, "explanation": "..." }},
                        "audience_fit": {{ "score": X, "max": Y, "explanation": "..." }},
                        "content_opportunities": {{ "score": X, "max": Y, "explanation": "..." }},
                        "digital_integration": {{ "score": X, "max": Y, "explanation": "..." }},
                        "innovation_potential": {{ "score": X, "max": Y, "explanation": "..." }}
                    }},
                    "total_score": XX  // MUST be 0 if competes_with_partners is true
                }}
            ]
        }}
        """
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are an expert business analyst for partnership evaluation."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5
        )
        
        # Get and parse the response
        content = response.choices[0].message.content
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            print(f"Error parsing JSON response: {content}")
            # Try to extract JSON from the response
            import re
            json_match = re.search(r'({.*})', content.replace('\n', ''), re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group(1))
                except:
                    return {"error": "Could not parse JSON response", "raw": content}
            return {"error": "Could not parse JSON response", "raw": content}

        # Scale total scores to max 10 (original range 0-50)
        if "companies" in result:
            for company in result["companies"]:
                if "total_score" in company and not company.get("competes_with_partners", False):
                    company["total_score"] = min(round(company["total_score"] / 5), 10)
        
        return result
    except Exception as e:
        print(f"Error generating company analysis: {str(e)}")
        traceback.print_exc()
        return {"error": str(e)}
