import { rest } from 'msw';

export const handlers = [
  // Other handlers...
  
  rest.post('/company-details', (req, res, ctx) => {
    const { name, industry } = req.body;
    
    // Simulate a web search response with additional company details
    // In a real app, this would call an API to search the web
    
    // Return mock data for testing purposes
    const companyData = {
      headquarters: getHeadquarters(name, industry),
      products: getProducts(name, industry),
      website: getWebsite(name),
      additional_info: "Additional information retrieved from web search."
    };
    
    return res(
      ctx.status(200),
      ctx.json(companyData)
    );
  })
];

// Helper functions to generate mock data
function getHeadquarters(name, industry) {
  const locations = {
    'technology': ['San Francisco, CA', 'Seattle, WA', 'Austin, TX', 'Boston, MA'],
    'sports': ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Miami, FL'],
    'healthcare': ['Rochester, MN', 'Cleveland, OH', 'Houston, TX', 'Baltimore, MD'],
    'finance': ['New York, NY', 'Charlotte, NC', 'San Francisco, CA', 'Chicago, IL'],
    'retail': ['Seattle, WA', 'Bentonville, AR', 'Minneapolis, MN', 'Cincinnati, OH'],
    'manufacturing': ['Detroit, MI', 'Pittsburgh, PA', 'Charlotte, NC', 'Chicago, IL'],
    'food': ['Atlanta, GA', 'Battle Creek, MI', 'Camden, NJ', 'Pittsburgh, PA'],
  };
  
  const defaultLocations = ['New York, NY', 'Chicago, IL', 'Los Angeles, CA', 'Dallas, TX', 'Atlanta, GA'];
  const industryLocations = locations[industry?.toLowerCase()] || defaultLocations;
  
  // Use the company name to deterministically pick a location
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return industryLocations[hash % industryLocations.length];
}

function getProducts(name, industry) {
  const productsByIndustry = {
    'technology': [
      'Cloud computing solutions, data analytics platforms, and AI-powered software',
      'Consumer electronics, smartphones, laptops, and smart home devices',
      'Enterprise software, security solutions, and business intelligence tools',
      'Networking hardware, servers, and IT infrastructure services'
    ],
    'sports': [
      'Athletic footwear, performance apparel, and sports equipment',
      'Team merchandise, licensed products, and training gear',
      'Sports nutrition products, protein supplements, and fitness accessories',
      'Sporting goods, outdoor equipment, and recreational products'
    ],
    'healthcare': [
      'Medical devices, diagnostic equipment, and monitoring systems',
      'Pharmaceuticals, biologic medications, and over-the-counter products',
      'Healthcare software, electronic health records, and telemedicine platforms',
      'Medical supplies, laboratory equipment, and surgical instruments'
    ],
    'finance': [
      'Consumer banking, mortgage services, and personal loans',
      'Investment management, retirement planning, and wealth advisory services',
      'Commercial banking, corporate credit, and treasury management',
      'Insurance products, risk management solutions, and annuities'
    ],
    'retail': [
      'Apparel, footwear, accessories, and fashion products',
      'Home goods, furniture, décor, and household essentials',
      'Consumer electronics, appliances, and entertainment products',
      'Grocery, fresh food, pantry items, and specialty foods'
    ],
    'manufacturing': [
      'Industrial machinery, automation equipment, and robotics',
      'Automotive components, engines, transmissions, and vehicle systems',
      'Construction materials, building products, and infrastructure components',
      'Aerospace parts, aviation systems, and defense equipment'
    ],
    'food': [
      'Packaged foods, snacks, beverages, and convenience items',
      'Organic foods, natural products, and specialty ingredients',
      'Dairy products, meat alternatives, and protein-based foods',
      'Ready-to-eat meals, frozen foods, and food service solutions'
    ],
  };
  
  const defaultProducts = [
    'Various consumer and business products tailored to market needs',
    'Innovative solutions designed to address customer pain points',
    'Quality products with focus on sustainability and ethical sourcing',
    'Diverse product portfolio serving multiple market segments'
  ];
  
  const industryProducts = productsByIndustry[industry?.toLowerCase()] || defaultProducts;
  
  // Use the company name to deterministically pick products
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return industryProducts[hash % industryProducts.length];
}

function getWebsite(name) {
  // Create a simplistic website based on the company name
  const simplifiedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const domains = ['.com', '.io', '.co', '.net', '.org'];
  
  // Pick a domain extension based on name hash
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const domain = domains[hash % domains.length];
  
  return `https://www.${simplifiedName}${domain}`;
} 