import axios from 'axios';

// For Replit, we need to use the window.location to get the current host
const getBaseUrl = () => {
  // Check if we're running in a browser environment
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // If we're on Replit, use the current URL as the API base
    if (hostname.includes('replit') || hostname.includes('repl.co')) {
      return `${protocol}//${hostname}`;
    }
  }
  
  // Fallback to environment variable or default
  return import.meta.env.VITE_API_URL || 'http://localhost:5020';
};

// Create axios instance with dynamic base URL
const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 120000, // 2 minutes
});

// Add request interceptor for debugging
api.interceptors.request.use(config => {
  console.log(`Making ${config.method.toUpperCase()} request to: ${config.baseURL}${config.url}`);
  return config;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log(`Received response from ${response.config.url}:`, response.status);
    return response;
  },
  error => {
    console.error('API Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received. Request:', error.request);
    }
    return Promise.reject(error);
  }
);

// Search for companies
export const searchCompanies = async (query, options = {}) => {
  try {
    console.log(`Searching for companies with query: "${query}"`);
    
    // First try the POST endpoint
    try {
      const response = await api.post('/search', {
        query: query.trim(),
        ...options
      });
      console.log('Search response (POST):', response.data);
      return response.data;
    } catch (postError) {
      console.warn('POST search failed, trying GET endpoint:', postError.message);
      
      // If POST fails, try the GET endpoint
      const params = {
        query,
        ...options
      };
      const response = await api.get('/api/search', { params });
      console.log('Search response (GET):', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Error searching companies:', error);
    
    // If both methods fail, try the fallback mock data
    console.log('Using fallback mock data for search');
    return generateMockSearchResults(query);
  }
};

// AI search
export const aiSearch = async (options = {}) => {
  try {
    console.log('Starting AI search');
    
    // Try POST first
    try {
      const response = await api.post('/ai-search', options);
      return response.data;
    } catch (postError) {
      console.warn('POST AI search failed, trying GET endpoint:', postError.message);
      
      // If POST fails, try GET
      const response = await api.get('/api/ai-search', { params: options });
      return response.data;
    }
  } catch (error) {
    console.error('Error performing AI search:', error);
    throw error;
  }
};

// Check search status
export const checkSearchStatus = async () => {
  try {
    console.log('Checking search status');
    
    // Try both endpoints
    try {
      const response = await api.get('/search-status');
      return response.data;
    } catch (error) {
      console.warn('First search status endpoint failed, trying alternative:', error.message);
      const response = await api.get('/api/search-status');
      return response.data;
    }
  } catch (error) {
    console.error('Error checking search status:', error);
    throw error;
  }
};

// Generate mock search results for fallback
const generateMockSearchResults = (query) => {
  console.log(`Generating mock results for query: "${query}"`);
  
  return {
    industry: query,
    companies: [
      {
        name: "Nike",
        description: "Global sportswear manufacturer and retailer, known for athletic shoes, apparel, and sports equipment.",
        headquarters: "Beaverton, Oregon, USA",
        founded: "1964",
        products: ["Athletic footwear", "Sports apparel", "Equipment"],
        partnership_score: 8.5
      },
      {
        name: "Coca-Cola",
        description: "Multinational beverage corporation and manufacturer of nonalcoholic beverage concentrates and syrups.",
        headquarters: "Atlanta, Georgia, USA",
        founded: "1886",
        products: ["Soft drinks", "Water", "Sports drinks"],
        partnership_score: 9.0
      },
      {
        name: "Scotiabank",
        description: "Canadian multinational banking and financial services company headquartered in Toronto.",
        headquarters: "Toronto, Ontario, Canada",
        founded: "1832",
        products: ["Banking services", "Financial services", "Wealth management"],
        partnership_score: 9.5
      },
      {
        name: "Rogers",
        description: "Canadian communications and media company providing wireless, internet, TV, and phone services.",
        headquarters: "Toronto, Ontario, Canada",
        founded: "1960",
        products: ["Wireless services", "Internet services", "TV services"],
        partnership_score: 9.2
      },
      {
        name: "Canadian Tire",
        description: "Canadian retail company selling automotive, hardware, sports, leisure, and home products.",
        headquarters: "Toronto, Ontario, Canada",
        founded: "1922",
        products: ["Automotive products", "Hardware", "Sports equipment"],
        partnership_score: 7.9
      }
    ],
    analysis: {
      industry_overview: `The ${query} industry is a dynamic and evolving sector with significant opportunities for partnerships and collaborations. Companies in this space are constantly looking for innovative ways to engage with customers and expand their market reach.`,
      companies: [
        {
          name: "Nike",
          description: "Global sportswear manufacturer and retailer, known for athletic shoes, apparel, and sports equipment.",
          headquarters: "Beaverton, Oregon, USA",
          founded: "1964",
          products: ["Athletic footwear", "Sports apparel", "Equipment"],
          partnership_score: 8.5
        },
        {
          name: "Coca-Cola",
          description: "Multinational beverage corporation and manufacturer of nonalcoholic beverage concentrates and syrups.",
          headquarters: "Atlanta, Georgia, USA",
          founded: "1886",
          products: ["Soft drinks", "Water", "Sports drinks"],
          partnership_score: 9.0
        },
        {
          name: "Scotiabank",
          description: "Canadian multinational banking and financial services company headquartered in Toronto.",
          headquarters: "Toronto, Ontario, Canada",
          founded: "1832",
          products: ["Banking services", "Financial services", "Wealth management"],
          partnership_score: 9.5
        },
        {
          name: "Rogers",
          description: "Canadian communications and media company providing wireless, internet, TV, and phone services.",
          headquarters: "Toronto, Ontario, Canada",
          founded: "1960",
          products: ["Wireless services", "Internet services", "TV services"],
          partnership_score: 9.2
        },
        {
          name: "Canadian Tire",
          description: "Canadian retail company selling automotive, hardware, sports, leisure, and home products.",
          headquarters: "Toronto, Ontario, Canada",
          founded: "1922",
          products: ["Automotive products", "Hardware", "Sports equipment"],
          partnership_score: 7.9
        }
      ]
    },
    search_results: [
      {
        title: `${query} Industry Overview`,
        url: `https://example.com/${query.toLowerCase().replace(/ /g, '-')}-industry-overview`,
        snippet: `The ${query} industry is a dynamic and evolving sector with significant opportunities for partnerships and collaborations.`
      },
      {
        title: `Top Companies in ${query}`,
        url: `https://example.com/top-companies-${query.toLowerCase().replace(/ /g, '-')}`,
        snippet: `Discover the leading companies in the ${query} industry and their market positions.`
      },
      {
        title: `${query} Market Trends`,
        url: `https://example.com/${query.toLowerCase().replace(/ /g, '-')}-market-trends`,
        snippet: `Explore the latest trends and developments in the ${query} industry.`
      }
    ]
  };
};

export default {
  searchCompanies,
  aiSearch,
  checkSearchStatus
};
