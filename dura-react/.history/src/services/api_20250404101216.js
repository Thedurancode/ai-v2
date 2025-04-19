import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5018';
const PERPLEXITY_API_URL = import.meta.env.VITE_PERPLEXITY_API_URL || 'https://api.perplexity.ai';
const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY || '';
const OPENAI_API_URL = import.meta.env.VITE_OPENAI_API_URL || 'https://api.openai.com';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const perplexityApi = axios.create({
  baseURL: PERPLEXITY_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
  },
  timeout: 30000
});

const openaiApi = axios.create({
  baseURL: OPENAI_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`
  },
  timeout: 60000 // Increase timeout for research queries
});

export const searchCompanies = async (industry) => {
  try {
    const response = await api.post('/search', { query: industry });
    return response.data;
  } catch (error) {
    console.error('Error searching companies:', error);
    throw error;
  }
};

export const getCompanyHistory = async () => {
  try {
    // Get both search history and previously viewed companies
    const response = await api.get('/search-history');
    
    // Log the response for debugging purposes
    console.log('History API response:', response.data);
    
    // Return the data in a structured format
    return {
      history: response.data.search_history || [],
      previouslyViewed: response.data.previously_considered?.companies || []
    };
  } catch (error) {
    console.error('Error fetching company history:', error);
    throw error;
  }
};

export const fetchCompanyDetails = async (companyData) => {
  try {
    const response = await api.post('/company-details', companyData);
    return response.data;
  } catch (error) {
    console.error('Error fetching company details:', error);
    throw error;
  }
};

export const getPerplexityResearch = async (company) => {
  try {
    // Check if API key is available
    if (!PERPLEXITY_API_KEY) {
      console.error('Perplexity API key not configured');
      throw new Error('Perplexity API key not configured in environment variables');
    }
    
    const companyName = company?.name || '';
    
    // Check if we already have research data for this company
    try {
      const savedResearch = await getCompanyResearch(companyName);
      if (savedResearch && savedResearch.success && savedResearch.research && savedResearch.research.data) {
        console.log(`Found existing research for ${companyName} from ${savedResearch.research.source}`);
        console.log(`Research was saved on ${savedResearch.research.created_at} and updated on ${savedResearch.research.updated_at}`);
        // Return the full research object with metadata
        return savedResearch.research;
      }
    } catch (error) {
      console.log("No existing research found, will generate new research with Perplexity");
    }
    
    const industry = company?.linkedin_data?.industry || '';
    
    // Create a more condensed query to fit within model constraints
    const query = `Business intelligence report on ${companyName}${industry ? ` (${industry})` : ''}: 
1. Overview (founding, headquarters)
2. Leadership (CEO, executives)
3. Business Model & Revenue
4. Market Position
5. Competitors
6. Financial Performance
7. Partnerships & Strategy`;
    
    console.log("Calling Perplexity API for:", companyName);
    console.log("API URL:", PERPLEXITY_API_URL);
    console.log("API key exists:", !!PERPLEXITY_API_KEY);
    console.log("API key first 5 chars:", PERPLEXITY_API_KEY.substring(0, 5));
    
    // Try with a valid model first, if that fails, we'll use a fallback
    const requestPayload = {
      model: "sonar", 
      messages: [
        {
          role: "system", 
          content: "You are a business analyst providing factual company research. Format with clear headings."
        },
        { 
          role: "user", 
          content: query
        }
      ],
      max_tokens: 1000
    };
    
    console.log("Using model:", requestPayload.model);
    console.log("Request payload:", JSON.stringify(requestPayload, null, 2));
    
    try {
      console.log("Sending request to Perplexity API...");
      const response = await perplexityApi.post('/chat/completions', requestPayload);
      
      console.log("Perplexity API response status:", response.status);
      console.log("Response headers:", response.headers);
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const content = response.data.choices[0].message.content;
        console.log("Content received, length:", content.length);
        console.log("Content preview:", content.substring(0, 100) + "...");
        
        // Save the research data to the database
        try {
          await saveCompanyResearch(companyName, content, 'perplexity');
          console.log(`Successfully saved Perplexity research data for ${companyName}`);
        } catch (saveError) {
          console.error("Failed to save Perplexity research data:", saveError);
        }
        
        return content;
      } else {
        console.error("Unexpected response structure:", response.data);
        throw new Error("Unexpected API response structure");
      }
    } catch (modelError) {
      console.error("Failed with model, error:", modelError.message);
      console.error("Error response:", modelError.response?.data);
      
      // If we get invalid model error, try another model
      if (modelError.response && modelError.response.data?.error?.type === 'invalid_model') {
        console.log("Invalid model error, trying with fallback model");
        
        // Try with a different payload/model
        requestPayload.model = "sonar-reasoning"; // Try another model
        
        try {
          const secondResponse = await perplexityApi.post('/chat/completions', requestPayload);
          
          if (secondResponse.data && secondResponse.data.choices && secondResponse.data.choices.length > 0) {
            const content = secondResponse.data.choices[0].message.content;
            
            // Save the research data from the fallback model
            try {
              await saveCompanyResearch(companyName, content, 'perplexity-fallback');
              console.log(`Successfully saved Perplexity fallback research data for ${companyName}`);
            } catch (saveError) {
              console.error("Failed to save Perplexity fallback research data:", saveError);
            }
            
            return content;
          } else {
            throw new Error("Failed to get valid response from fallback model");
          }
        } catch (secondModelError) {
          console.error("Second model also failed:", secondModelError.message);
          throw new Error(`Perplexity fallback model failed: ${secondModelError.message}`);
        }
      } else {
        // Re-throw the original error for the catch block
        throw modelError;
      }
    }
  } catch (error) {
    // Log specific error types for debugging
    if (error.response) {
      console.error("Perplexity API error response:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // Check for specific API errors
      if (error.response.status === 401) {
        throw new Error("Perplexity API key is invalid or expired");
      } else if (error.response.status === 429) {
        throw new Error("Perplexity API rate limit exceeded. Please try again later.");
      } else {
        throw new Error(`Perplexity API error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`);
      }
    } else if (error.request) {
      console.error("Perplexity API no response:", error.request);
      throw new Error("No response from Perplexity API. Please check your internet connection.");
    } else {
      console.error("Perplexity API request setup error:", error.message);
      throw new Error(`Perplexity API error: ${error.message}`);
    }
  }
};

// Save company research data to the database
export const saveCompanyResearch = async (companyName, researchData, source) => {
  try {
    const response = await api.post('/company-research', {
      company_name: companyName,
      research_data: researchData,
      source: source
    });
    return response.data;
  } catch (error) {
    console.error('Error saving company research:', error);
    throw error;
  }
};

// Get company research data from the database
export const getCompanyResearch = async (companyName, forceRefresh = false) => {
  try {
    const url = forceRefresh
      ? `/company-research/${encodeURIComponent(companyName)}?refresh=true`
      : `/company-research/${encodeURIComponent(companyName)}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error getting company research:', error);
    throw error;
  }
};

export const getOpenAIResearch = async (company) => {
  console.log("=========== OPENAI DEBUG START ===========");
  try {
    console.log("Attempting OpenAI research with model: gpt-4o");
    
    const companyName = company?.name || '';
    const forceRefresh = company?.forceRefresh || false;
    
    // Check if we already have research data for this company
    if (!forceRefresh) {
      try {
        const savedResearch = await getCompanyResearch(companyName);
        if (savedResearch && savedResearch.success && savedResearch.research && savedResearch.research.data) {
          console.log(`Found existing research for ${companyName} from ${savedResearch.research.source}`);
          console.log(`Research was saved on ${savedResearch.research.created_at} and updated on ${savedResearch.research.updated_at}`);
          console.log("=========== DEEPSEEK DEBUG END ===========");
          // Return the full research object with metadata
          return savedResearch.research;
        }
      } catch (error) {
        console.log("No existing research found, will generate new research");
      }
    } else {
      console.log(`Force refresh requested for ${companyName}, skipping cache lookup`);
    }
    
    const industry = company?.linkedin_data?.industry || '';
    
    // Simplified query for better compatibility
    const query = `Provide a comprehensive business intelligence report on ${companyName}${industry ? ` in the ${industry} industry` : ''}.`;
    
    console.log("Query:", query);
    console.log("API key exists:", !!OPENAI_API_KEY);
    console.log("API key first 5 chars:", OPENAI_API_KEY.substring(0, 5));
    
    // Using the exact format that worked in the curl test
    const payload = {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: query
        }
      ],
      stream: false
    };
    
    console.log("Payload:", JSON.stringify(payload));
    
    // Direct axios call using the basic model that worked in curl
    try {
      console.log("Making DeepSeek API call...");
      
      const response = await openaiApi.post('/v1/chat/completions', {
        data: payload,
        timeout: 60000
      });
      
      console.log("Response received:", response.status);
      console.log("Response data structure:", Object.keys(response.data));
      
      if (response.data?.choices?.[0]?.message?.content) {
        const content = response.data.choices[0].message.content;
        console.log("Content received, length:", content.length);
        
        // Save the research data to the database
        try {
          await saveCompanyResearch(companyName, content, 'deepseek');
          console.log(`Successfully saved research data for ${companyName}`);
        } catch (saveError) {
          console.error("Failed to save research data:", saveError);
        }
        
        console.log("=========== OPENAI DEBUG END ===========");
        return content;
      } else {
        console.error("Invalid response structure:", JSON.stringify(response.data));
        throw new Error("Invalid response structure");
      }
    } catch (error) {
      console.error("DeepSeek API call failed:", error.message);
      
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data));
        console.error("Headers:", JSON.stringify(error.response.headers));
      }
      
      throw error; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error("OpenAI research failed:", error.message);
    console.log("Falling back to template");
    console.log("=========== OPENAI DEBUG END ===========");
    
      return getFallbackResearchData(company);
  }
};

// Helper function to generate fallback research data when API fails
function getFallbackResearchData(company) {
  const companyName = company?.name || 'the company';
  const industry = company?.linkedin_data?.industry || 'this industry';
  
  return `# Business Intelligence Report: ${companyName}

## Overview
${companyName} is a company operating in ${industry}. Due to API connectivity issues, detailed information is not available at this moment.

## Leadership
Information on leadership team is currently unavailable.

## Business Model & Revenue
${companyName} generates revenue through products and services in ${industry}.

## Market Position
As a player in ${industry}, ${companyName} competes with various other businesses.

## Competitors
Competitor information is not available at this moment.

## Financial Performance
Detailed financial information could not be retrieved.

## Partnerships & Strategy
Strategic partnership information is currently unavailable.

*This is a fallback report due to API connectivity issues. Please try again later for more detailed information.*`;
}

export const checkApiHealth = async () => {
  try {
    const response = await api.get('/api-healthcheck');
    return response.data;
  } catch (error) {
    console.error('Error checking API health:', error);
    return {
      api_server: false,
      perplexity_api: false,
      error: error.message
    };
  }
};

export const seedHistoryIfEmpty = async () => {
  try {
    // First get current history
    const historyResponse = await api.get('/search-history');
    
    // Check if previously viewed companies are empty
    const isPreviouslyViewedEmpty = 
      !historyResponse.data || 
      !historyResponse.data.previously_considered ||
      !historyResponse.data.previously_considered.companies ||
      historyResponse.data.previously_considered.companies.length === 0;
    
    // Check if search history is empty
    const isSearchHistoryEmpty = 
      !historyResponse.data || 
      !historyResponse.data.search_history ||
      historyResponse.data.search_history.length === 0;
    
    if (isPreviouslyViewedEmpty || isSearchHistoryEmpty) {
      console.log('History or previously viewed companies are empty, seeding with initial data...');
      // Use our more robust seeding function
      return await seedCompanyHistory();
    }
    
    return false;
  } catch (error) {
    console.error('Error in seedHistoryIfEmpty:', error);
    return false;
  }
};

// Add a new function to directly seed company history entries
export const seedCompanyHistory = async () => {
  try {
    console.log('Explicitly seeding company history with initial data...');
    
    // First check if we have anything in the history
    const historyResponse = await api.get('/search-history');
    
    // Check if previously viewed companies are empty
    const isPreviouslyViewedEmpty = 
      !historyResponse.data || 
      !historyResponse.data.previously_considered ||
      !historyResponse.data.previously_considered.companies ||
      historyResponse.data.previously_considered.companies.length === 0;
       
    if (!isPreviouslyViewedEmpty) {
      console.log('Previously viewed companies already exist, no need to seed.');
      return true;
    }
    
    // No previously viewed companies, let's seed by viewing companies
    
    // First a search to populate companies
    try {
      // First try a regular search
      await api.post('/search', { query: 'sports marketing partnerships' });
      console.log('Seeded history with manual search');
    } catch (error) {
      // Log the error but continue since we still want to add companies directly
      console.warn('Error seeding with search:', error);
    }
    
    // Set a short timeout to let the search process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate logos with logo.dev
    const generateLogo = (companyName) => {
      // Clean the company name to create a domain-like string
      // Remove special characters and spaces, convert to lowercase
      const domainName = companyName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      
      // Add .com to make it look like a domain
      const domain = domainName.endsWith('.com') ? domainName : `${domainName}.com`;
      
      // Use logo.dev API to generate a logo
      return `https://img.logo.dev/${domain}?token=pk_TCK5i8rzR92YmS65BY2fgQ&retina=true`;
    };
    
    // Then simulate viewing specific companies with scores and logos
    const companies = [
      { name: 'Nike', score: 9.2 },
      { name: 'Adidas', score: 8.7 },
      { name: 'ESPN', score: 8.9 },
      { name: 'NBA', score: 9.5 },
      { name: 'Under Armour', score: 7.8 },
      { name: 'UFC', score: 8.3 },
      { name: 'FCB Global', score: 7.5 },
      { name: 'Gatorade', score: 8.1 },
      { name: 'Red Bull', score: 9.0 },
      { name: 'Puma', score: 7.9 }
    ];
    
    for (const company of companies) {
      try {
        // Add logo to company data
        const logo = generateLogo(company.name);
        
        // Use 'name' parameter as that appears to be what the server expects
        await api.post('/company-details', { 
          name: company.name,
          has_competition: false,
          partnership_score: company.score,
          logo: logo
        });
        console.log(`Added ${company.name} to history with score ${company.score} and logo`);
      } catch (error) {
        console.warn(`Error adding ${company.name} to history:`, error);
      }
    }
    
    // Verify the history was created
    try {
      const verifyResponse = await api.get('/search-history');
      console.log('Previously viewed companies after seeding:', verifyResponse.data.previously_considered);
      
      // Check if we have data now
      const nowHasData = 
        verifyResponse.data && 
        verifyResponse.data.previously_considered &&
        verifyResponse.data.previously_considered.companies &&
        verifyResponse.data.previously_considered.companies.length > 0;
         
      return nowHasData;
    } catch (error) {
      console.warn('Error verifying history:', error);
      return false;
    }
  } catch (error) {
    console.error('Error in seedCompanyHistory:', error);
    return false;
  }
};

export default api;
