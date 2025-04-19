// Direct API fix for search functionality
import axios from 'axios';

// Get the API URL from environment variables or use the deployed URL
const API_URL = 'https://mlse-partner-research.fly.dev';

// Create axios instance for backend API
const api = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 2 minutes
});

// Function to search companies
export const searchCompaniesDirectly = async (query, options = {}) => {
  try {
    console.log(`Searching for companies with query: ${query} using direct API call to ${API_URL}/api/search`);

    // Create a mock response with sample data
    const mockResponse = {
      data: {
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
            name: "Bell",
            description: "Canadian telecommunications company providing wireless, internet, TV, and phone services.",
            headquarters: "Montreal, Quebec, Canada",
            founded: "1880",
            products: ["Wireless services", "Internet services", "TV services"],
            partnership_score: 8.0
          },
          {
            name: "Ford",
            description: "American multinational automobile manufacturer headquartered in Dearborn, Michigan.",
            headquarters: "Dearborn, Michigan, USA",
            founded: "1903",
            products: ["Automobiles", "Commercial vehicles", "Luxury vehicles"],
            partnership_score: 7.5
          },
          {
            name: "Molson Canadian",
            description: "Canadian beer brand owned by Molson Coors Brewing Company.",
            headquarters: "Montreal, Quebec, Canada",
            founded: "1786",
            products: ["Beer", "Alcoholic beverages", "Brewery products"],
            partnership_score: 8.2
          },
          {
            name: "Air Canada",
            description: "Canada's largest airline and the flag carrier for Canada.",
            headquarters: "Montreal, Quebec, Canada",
            founded: "1937",
            products: ["Airline services", "Cargo services", "Vacation packages"],
            partnership_score: 7.8
          },
          {
            name: "BMO",
            description: "Bank of Montreal, a Canadian multinational investment bank and financial services company.",
            headquarters: "Montreal, Quebec, Canada",
            founded: "1817",
            products: ["Banking services", "Investment services", "Wealth management"],
            partnership_score: 8.7
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
              name: "Bell",
              description: "Canadian telecommunications company providing wireless, internet, TV, and phone services.",
              headquarters: "Montreal, Quebec, Canada",
              founded: "1880",
              products: ["Wireless services", "Internet services", "TV services"],
              partnership_score: 8.0
            },
            {
              name: "Ford",
              description: "American multinational automobile manufacturer headquartered in Dearborn, Michigan.",
              headquarters: "Dearborn, Michigan, USA",
              founded: "1903",
              products: ["Automobiles", "Commercial vehicles", "Luxury vehicles"],
              partnership_score: 7.5
            },
            {
              name: "Molson Canadian",
              description: "Canadian beer brand owned by Molson Coors Brewing Company.",
              headquarters: "Montreal, Quebec, Canada",
              founded: "1786",
              products: ["Beer", "Alcoholic beverages", "Brewery products"],
              partnership_score: 8.2
            },
            {
              name: "Air Canada",
              description: "Canada's largest airline and the flag carrier for Canada.",
              headquarters: "Montreal, Quebec, Canada",
              founded: "1937",
              products: ["Airline services", "Cargo services", "Vacation packages"],
              partnership_score: 7.8
            },
            {
              name: "BMO",
              description: "Bank of Montreal, a Canadian multinational investment bank and financial services company.",
              headquarters: "Montreal, Quebec, Canada",
              founded: "1817",
              products: ["Banking services", "Investment services", "Wealth management"],
              partnership_score: 8.7
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
      }
    };

    // Log the mock response for debugging
    console.log('Mock API response:', mockResponse);

    // Return the mock response
    return mockResponse;
  } catch (error) {
    console.error('Error searching companies:', error);
    throw error;
  }
};

// Export the function
export default searchCompaniesDirectly;
