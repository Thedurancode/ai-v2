import axios from 'axios';
import { prepareRequestWithScoringPrompt } from '../utils/scoringUtils';

const MLSE_JSON_TEMPLATE = `{
  "brand": {
    "name": "Adidas",
    "description": "Global sportswear company focused on performance and lifestyle products.",
    "headquarters": "Herzogenaurach, Germany",
    "founded": "1949",
    "employee_count": "62,500+",
    "annual_revenue": "$22.6 billion (2022)",
    "mission_statement": "Through sport, we have the power to change lives.",
    "leadership": [
      {
        "name": "Bjørn Gulden",
        "title": "CEO",
        "linkedin": "https://linkedin.com/in/bjørn-gulden"
      },
      {
        "name": "Harm Ohlmeyer",
        "title": "CFO",
        "linkedin": "https://linkedin.com/in/harm-ohlmeyer"
      }
    ]
  },
  "partnership_potential": {
    "alignment_with_mlse": "High alignment with MLSE's sports and entertainment focus. Adidas has a strong presence in hockey, basketball, and soccer, all key MLSE sports.",
    "brand_synergy": "Strong brand synergy as both organizations focus on excellence in sports and have premium brand positioning.",
    "audience_overlap": "Significant audience overlap with sports fans and active lifestyle consumers.",
    "innovation_opportunities": "Potential for co-branded merchandise, exclusive product lines for MLSE teams, and technology integration in venues.",
    "market_expansion": "Partnership could help both brands strengthen their Canadian market presence."
  },
  "key_products_services": [
    "Athletic footwear",
    "Sports apparel",
    "Sports equipment",
    "Team uniforms and gear",
    "Lifestyle clothing and accessories"
  ],
  "market_analysis": {
    "market_position": "Second largest sportswear manufacturer globally, strong competitor to Nike.",
    "target_audience": "Athletes, sports enthusiasts, and fashion-conscious consumers aged 15-45.",
    "competitive_landscape": "Competes directly with Nike, Puma, Under Armour, and New Balance.",
    "market_trends": "Growing demand for sustainable products, athleisure wear, and digital integration.",
    "canadian_presence": "Strong retail presence across Canada with flagship stores in major cities."
  },
  "partnership_opportunities": [
    "Official apparel and equipment provider for MLSE teams",
    "Co-branded merchandise collections",
    "Exclusive retail spaces within MLSE venues",
    "Collaborative marketing campaigns",
    "Community and youth sports initiatives",
    "Sustainability partnerships"
  ],
  "financial_considerations": {
    "investment_potential": "High potential for significant investment in a multi-year partnership.",
    "revenue_sharing_models": "Various models possible including licensing, direct sales, and promotional revenue.",
    "marketing_budget": "Substantial global marketing budget with capacity for major partnership activation.",
    "long_term_value": "Strong potential for long-term value creation through brand association and exclusive product lines."
  },
  "risk_assessment": {
    "competitive_conflicts": "Low risk as Adidas doesn't significantly compete with current MLSE partners.",
    "brand_reputation": "Strong global reputation with occasional labor practice controversies.",
    "financial_stability": "Stable financial position with consistent growth despite market challenges.",
    "partnership_history": "Strong track record of successful sports team and league partnerships globally."
  },
  "contact_information": {
    "primary_contact": {
      "name": "Michael Thompson",
      "title": "Director of Sports Partnerships, North America",
      "email": "m.thompson@adidas.com",
      "phone": "+1-555-123-4567"
    },
    "secondary_contact": {
      "name": "Sarah Johnson",
      "title": "Canadian Partnerships Manager",
      "email": "s.johnson@adidas.com",
      "phone": "+1-555-987-6543"
    }
  }
}`;

// Create API instances
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5021';

// Create axios instance for backend API
const api = axios.create({
  baseURL: API_URL,
  timeout: 120000, // Increased to 2 minutes
});

// We'll use the backend API to handle Perplexity requests instead of direct API calls
// This is more secure as it keeps the API key on the server side
const perplexityApi = {
  post: async (endpoint, data) => {
    console.log('Using backend proxy for Perplexity API call');
    const response = await api.post('/api/perplexity-proxy', {
      endpoint,
      data
    });
    return response;
  }
};

// Get company research data from the database
export const getCompanyResearch = async (companyName, forceRefresh = false) => {
  try {
    const url = forceRefresh
      ? `/api/company-research/${encodeURIComponent(companyName)}?refresh=true`
      : `/api/company-research/${encodeURIComponent(companyName)}`;

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error getting company research:', error);
    throw error;
  }
};

// Get Perplexity research for a company
export const getPerplexityResearch = async (company) => {
  try {
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

    const industry = company?.coresignal_data?.company_details?.industry || '';

    // Create a more condensed query to fit within model constraints
    const query = `Business intelligence report on ${companyName}${industry ? ` (${industry})` : ''}:
1. Overview (founding, headquarters)
2. Leadership (CEO, executive team, key leaders)
3. Business Model & Revenue
4. Market Position
5. Competitors
6. Financial Performance
7. Partnerships & Strategy (include current marketing partnerships and any sports-related partnerships)`;

    console.log("Calling Perplexity API for:", companyName);

    // Try with a valid model first, if that fails, we'll use a fallback
    const requestPayload = {
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content: "You are a business analyst providing factual company research. Format your response with proper Markdown syntax for modern display:\n\n1. Use '## ' (with a space after) for main section headings\n2. Use '### ' for subsection headings\n3. Use **bold** for important facts, metrics, and key points\n4. Use bullet lists (- item) for listing items\n5. Use numbered lists (1. item) for sequential information\n6. Use > for notable quotes or highlights\n7. Include line breaks between sections\n8. Format financial figures consistently (e.g., $10.5M, 23%)\n9. Use tables for comparative data where appropriate\n10. Ensure each section is clearly separated\n\nFor the Leadership section, be thorough and include:\n- The **CEO's full name and background**\n- **Names and roles of key executives** (C-suite, founders, etc.)\n- Brief background on key leaders when available\n- Leadership changes or notable history\n\nFor the Partnerships & Strategy section, be thorough and include:\n- **Current marketing partnerships** the company has\n- **Sports-related partnerships** (especially with sports arenas, teams, or leagues)\n- Details on partnership terms and duration when available\n- History of past significant partnerships\n- Partnership strategy and approach\n\nDo NOT use any special characters that might break Markdown formatting. Keep your response well-structured, visually appealing, and easy to read. Each section should be comprehensive but concise."
        },
        {
          role: "user",
          content: query
        }
      ],
      max_tokens: 4000
    };

    console.log("Using model:", requestPayload.model);
    console.log("Request payload:", JSON.stringify(requestPayload, null, 2));

    try {
      console.log("Sending request to Perplexity API via backend proxy...");
      const response = await perplexityApi.post('/chat/completions', requestPayload);

      console.log("Perplexity API response status:", response.status);

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
        requestPayload.model = "sonar"; // Try another model
        requestPayload.max_tokens = 4000; // Ensure we have enough tokens for comprehensive research

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
    console.error("Error in getPerplexityResearch:", error);

    // Create a more detailed error message
    let errorMessage = 'Failed to get research from Perplexity API';

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      errorMessage = `Perplexity API error: ${error.response.status} - ${error.response.data?.error?.message || error.response.statusText}`;
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = `Network error: No response received from Perplexity API - ${error.message}`;
      console.error('Error request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMessage = `Perplexity API request setup error: ${error.message}`;
    }

    // Create a custom error with the detailed message
    const customError = new Error(errorMessage);
    customError.originalError = error;
    throw customError;
  }
};

// Save company research data to the database
export const saveCompanyResearch = async (companyName, researchData, source) => {
  try {
    const response = await api.post('/api/company-research', {
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

// Get scoring criteria from the server
export const getScoringCriteria = async () => {
  try {
    const response = await api.get('/api/scoring-criteria');
    return response.data;
  } catch (error) {
    console.error('Error fetching scoring criteria:', error);
    throw error;
  }
};

// Update scoring criteria on the server
export const updateScoringCriteria = async (criteriaData) => {
  try {
    const response = await api.post('/api/scoring-criteria', criteriaData);
    return response.data;
  } catch (error) {
    console.error('Error updating scoring criteria:', error);
    throw error;
  }
};

// Get potential partners from the database
export const getPotentialPartners = async (params = {}) => {
  try {
    const response = await api.get('/api/potential-partners', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching potential partners:', error);
    throw error;
  }
};

// Get a single potential partner by ID
export const getPotentialPartnerById = async (id) => {
  try {
    const response = await api.get(`/api/potential-partners/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching potential partner with ID ${id}:`, error);
    throw error;
  }
};

// Update a potential partner
export const updatePotentialPartner = async (id, partnerData) => {
  try {
    const response = await api.put(`/api/potential-partners/${id}`, partnerData);
    return response.data;
  } catch (error) {
    console.error(`Error updating potential partner with ID ${id}:`, error);
    throw error;
  }
};

// Delete a potential partner
export const deletePotentialPartner = async (id) => {
  try {
    const response = await api.delete(`/api/potential-partners/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting potential partner with ID ${id}:`, error);
    throw error;
  }
};

// Get search history
export const getSearchHistory = async () => {
  try {
    const response = await api.get('/api/search-history');
    return response.data;
  } catch (error) {
    console.error('Error fetching search history:', error);
    throw error;
  }
};

// Get previously considered companies
export const getPreviouslyConsidered = async () => {
  try {
    const response = await api.get('/api/previously-considered');
    return response.data;
  } catch (error) {
    console.error('Error fetching previously considered companies:', error);
    throw error;
  }
};

// Get current partners
export const getCurrentPartners = async () => {
  try {
    const response = await api.get('/api/current-partners');
    return response.data;
  } catch (error) {
    console.error('Error fetching current partners:', error);
    throw error;
  }
};

// Search for companies
export const searchCompanies = async (query, options = {}) => {
  try {
    const params = {
      query,
      ...options
    };
    const response = await api.get('/api/search', { params });
    return response.data;
  } catch (error) {
    console.error('Error searching companies:', error);
    throw error;
  }
};

// Search for companies by industry
export const searchByIndustry = async (industry, options = {}) => {
  try {
    const params = {
      industry,
      ...options
    };
    const response = await api.get('/api/search/industry', { params });
    return response.data;
  } catch (error) {
    console.error('Error searching companies by industry:', error);
    throw error;
  }
};

// Get company details
export const getCompanyDetails = async (companyId) => {
  try {
    const response = await api.get(`/api/company/${companyId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching company details for ID ${companyId}:`, error);
    throw error;
  }
};

// Get company score
export const getCompanyScore = async (companyData) => {
  try {
    const response = await api.post('/api/score', companyData);
    return response.data;
  } catch (error) {
    console.error('Error getting company score:', error);
    throw error;
  }
};

// Generate PDF report
export const generatePdfReport = async (companyName) => {
  try {
    const response = await api.get(`/api/generate-pdf/${encodeURIComponent(companyName)}`, {
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
};

// Check API health
export const checkApiHealth = async () => {
  try {
    console.log('Checking API health...');
    const response = await api.get('/api/api-healthcheck');
    console.log('API health check response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error checking API health:', error);
    // Return a more detailed error object
    return {
      api_server: false,
      perplexity_api: false,
      perplexity_error: error.message || 'Connection error',
      error: error.message
    };
  }
};

// Test Perplexity API
export const testPerplexityApi = async () => {
  try {
    const response = await api.get('/api/test-perplexity');
    return response.data;
  } catch (error) {
    console.error('Error testing Perplexity API:', error);
    throw error;
  }
};

// Seed history data if empty
export const seedHistoryIfEmpty = async () => {
  try {
    const response = await api.post('/api/seed-history');
    return response.data;
  } catch (error) {
    console.error('Error seeding history data:', error);
    return { success: false, error: error.message };
  }
};

// Seed company history data
export const seedCompanyHistory = async () => {
  try {
    const response = await api.post('/api/seed-company-history');
    return response.data;
  } catch (error) {
    console.error('Error seeding company history data:', error);
    return { success: false, error: error.message };
  }
};

// Fetch top partners
export const fetchTopPartners = async (limit = 10) => {
  try {
    const response = await api.get('/api/top-partners', { params: { limit } });
    return response.data;
  } catch (error) {
    console.error('Error fetching top partners:', error);
    throw error;
  }
};

// Get OpenAI research for a company
export const getOpenAIResearch = async (company) => {
  try {
    const companyName = company?.name || '';

    // Check if we already have research data for this company
    try {
      const savedResearch = await getCompanyResearch(companyName);
      if (savedResearch && savedResearch.success && savedResearch.research && savedResearch.research.source === 'openai') {
        console.log(`Found existing OpenAI research for ${companyName}`);
        console.log(`Research was saved on ${savedResearch.research.created_at} and updated on ${savedResearch.research.updated_at}`);
        return savedResearch.research;
      }
    } catch (error) {
      console.log("No existing OpenAI research found, will generate new research");
    }

    // Create query based on company data
    const industry = company?.coresignal_data?.company_details?.industry || '';
    const query = `Business intelligence report on ${companyName}${industry ? ` (${industry})` : ''}`;

    console.log("Calling OpenAI API for:", companyName);

    // Call the API to get research data
    const response = await api.post('/api/openai-research', {
      company_name: companyName,
      query: query
    });

    // If successful, save the research data
    if (response.data && response.data.content) {
      try {
        await saveCompanyResearch(companyName, response.data.content, 'openai');
        console.log(`Successfully saved OpenAI research data for ${companyName}`);
      } catch (saveError) {
        console.error("Failed to save OpenAI research data:", saveError);
      }

      return response.data.content;
    } else {
      throw new Error("Failed to get OpenAI research data");
    }
  } catch (error) {
    console.error("Error in getOpenAIResearch:", error);
    throw error;
  }
};

// Export research as PDF
export const exportResearchAsPDF = async (companyName) => {
  try {
    console.log(`Exporting research as PDF for: ${companyName}`);

    // Use the correct endpoint with GET method
    const response = await api.get(`/api/company-research/${encodeURIComponent(companyName)}/export-pdf`, {
      responseType: 'blob'
    });

    console.log('PDF export response received');

    // Create a blob URL from the response data
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    // Create a link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${companyName}_research.pdf`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    console.log('PDF download triggered');
    return response.data;
  } catch (error) {
    console.error('Error exporting research as PDF:', error);
    throw error;
  }
};

export default {
  getCompanyResearch,
  getPerplexityResearch,
  getOpenAIResearch,
  saveCompanyResearch,
  getScoringCriteria,
  updateScoringCriteria,
  getPotentialPartners,
  getPotentialPartnerById,
  updatePotentialPartner,
  deletePotentialPartner,
  getSearchHistory,
  getPreviouslyConsidered,
  getCurrentPartners,
  searchCompanies,
  searchByIndustry,
  getCompanyDetails,
  getCompanyScore,
  generatePdfReport,
  checkApiHealth,
  testPerplexityApi,
  seedHistoryIfEmpty,
  seedCompanyHistory,
  fetchTopPartners,
  exportResearchAsPDF
};
