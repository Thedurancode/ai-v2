import axios from 'axios';
import standardizeResearchFormat from '../utils/researchFormatter';

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

// Save partner research data to the database
export const savePartnerResearch = async (partnerId, partnerName, researchData, source) => {
  try {
    const response = await api.post('/api/partner-research', {
      partner_id: partnerId,
      partner_name: partnerName,
      research_data: researchData,
      source: source
    });
    return response.data;
  } catch (error) {
    console.error('Error saving partner research:', error);
    throw error;
  }
};

// Get partner research data from the database
export const getPartnerResearch = async (partnerId, forceRefresh = false) => {
  try {
    // Now try the actual endpoint
    const url = forceRefresh
      ? `/api/partner-research/${encodeURIComponent(partnerId)}?refresh=true`
      : `/api/partner-research/${encodeURIComponent(partnerId)}`;

    console.log(`Calling API endpoint: ${url}`);
    const response = await api.get(url);
    console.log('Partner research API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting partner research:', error);
    throw error;
  }
};

// Get Perplexity research for a potential partner
export const getPerplexityPartnerResearch = async (partner) => {
  try {
    const partnerId = partner?.id || '';
    const partnerName = partner?.name || '';
    const industry = partner?.industry || '';

    console.log('Getting research for partner:', partnerName, 'with ID:', partnerId);

    // Check if we already have research data for this partner
    try {
      const savedResearch = await getPartnerResearch(partnerId);
      if (savedResearch && savedResearch.success && savedResearch.research && savedResearch.research.data) {
        console.log(`Found existing research for ${partnerName} from ${savedResearch.research.source}`);
        console.log(`Research was saved on ${savedResearch.research.created_at} and updated on ${savedResearch.research.updated_at}`);
        // Return the full research object with metadata
        return savedResearch.research;
      }
    } catch (error) {
      console.log("No existing research found, will generate new research");
    }

    // Use our backend API to generate research
    console.log("Calling backend API to generate research for partner:", partnerName);

    // Always specify provider as 'perplexity' for AI research
    const response = await api.post('/api/generate-partner-research', {
      partner_id: partnerId,
      partner_name: partnerName,
      industry: industry || '',
      provider: 'perplexity', // Force Perplexity for AI research
      researchType: 'ai'      // Optional: clarify the research type
    });

    console.log("Backend API response status:", response.status);

    if (response.data && response.data.success && response.data.data) {
      console.log("Research data received, length:", response.data.data.length);
      console.log("Research data preview:", response.data.data.substring(0, 100) + "...");

      // Create a research object with metadata
      const researchData = {
        data: response.data.data,
        source: response.data.source || 'perplexity',
        updated_at: response.data.updated_at || new Date().toISOString()
      };

      return researchData;
    } else {
      console.error("Unexpected response structure:", response.data);
      throw new Error(response.data?.message || "Failed to generate research");
    }
  } catch (error) {
    console.error("Error in getPerplexityPartnerResearch:", error);
    throw error;
  }
};

// Format Perplexity response into standardized sections
export const formatPerplexityResponse = (response) => {
  try {
    console.log("Formatting Perplexity response:", typeof response, response ? response.substring(0, 100) + '...' : 'null');

    if (!response) {
      console.log("Empty Perplexity response");
      return standardizeResearchFormat(null).sections;
    }

    // Handle different data types
    if (typeof response === 'object') {
      // If it's already an object, it might have sections or data property
      if (response.sections && Array.isArray(response.sections)) {
        console.log("Response already has sections array");
        return response.sections;
      } else if (response.data) {
        console.log("Using response.data property");
        return formatPerplexityResponse(response.data);
      } else {
        // Try to stringify and then parse it
        console.log("Converting object to string for processing");
        return formatPerplexityResponse(JSON.stringify(response));
      }
    } else if (typeof response !== 'string' || response.trim() === '') {
      console.log("Invalid Perplexity response type:", typeof response);
      return standardizeResearchFormat(null).sections;
    }

    // Try to parse as JSON first in case it's a stringified JSON object
    try {
      const parsed = JSON.parse(response);
      console.log("Successfully parsed response as JSON");

      // If parsed successfully, it might have sections
      if (parsed.sections && Array.isArray(parsed.sections)) {
        console.log("Parsed JSON has sections array");
        return parsed.sections;
      }

      // Otherwise, standardize the parsed object
      console.log("Standardizing parsed JSON");
      const standardized = standardizeResearchFormat(parsed);
      return standardized.sections;
    } catch (parseError) {
      // Not JSON, treat as plain text
      console.log("Response is not JSON, treating as plain text");
    }

    // Use the standardization function to ensure consistent format
    console.log("Standardizing text response");
    const standardized = standardizeResearchFormat(response);

    // Return the standardized sections
    return standardized.sections;
  } catch (error) {
    console.error("Error formatting Perplexity response:", error);
    // Return default sections if there's an error
    return standardizeResearchFormat(null).sections;
  }
};

// Delete a partner by ID
export async function deletePartner(partnerId) {
  const response = await api.delete(`/api/partners/${partnerId}`);
  if (!response.ok) {
    throw new Error('Failed to delete partner');
  }
  return true;
}

export default {
  savePartnerResearch,
  getPartnerResearch,
  getPerplexityPartnerResearch,
  formatPerplexityResponse,
  deletePartner
};
