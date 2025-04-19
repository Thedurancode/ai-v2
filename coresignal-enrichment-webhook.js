// Google Apps Script to handle Coresignal enrichment webhook
// Deploy this as a web app with "Execute as: Me" and "Who has access: Anyone"

// Supabase credentials
const SUPABASE_URL = 'https://holkojtkhubekpiqagbq.supabase.co';
const SUPABASE_SERVICE_KEY = 'YOUR_SUPABASE_SERVICE_KEY'; // Replace with actual service key

// Function to handle POST requests
function doPost(e) {
  try {
    // Parse the request body
    const requestData = JSON.parse(e.postData.contents);
    
    // Extract data from the request
    const { action, partner_id, company_name, api_key } = requestData;
    
    // Validate the request
    if (action !== 'enrich_partner' || !partner_id || !company_name || !api_key) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Invalid request data'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Fetch company data from Coresignal
    const companyData = fetchCoresignalData(company_name, api_key);
    
    if (!companyData) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Failed to fetch company data'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Update the potential partner record in Supabase
    const updateResult = updatePotentialPartner(partner_id, companyData);
    
    if (!updateResult.success) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: updateResult.message
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Cache the company data
    cacheCompanyData(company_name, companyData);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Successfully enriched potential partner',
      company: company_name,
      id: partner_id
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: `Error: ${error.message}`
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Function to fetch company data from Coresignal
function fetchCoresignalData(companyName, apiKey) {
  try {
    console.log(`Fetching Coresignal data for ${companyName}`);
    
    if (!apiKey) {
      console.error('No Coresignal API key provided');
      return null;
    }
    
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    
    // Search for the company
    const searchUrl = `https://api.coresignal.com/v1/companies/search?query=${encodeURIComponent(companyName)}`;
    const searchOptions = {
      'method': 'get',
      'headers': headers,
      'muteHttpExceptions': true
    };
    
    const searchResponse = UrlFetchApp.fetch(searchUrl, searchOptions);
    
    if (searchResponse.getResponseCode() !== 200) {
      console.error(`Error from Coresignal API: ${searchResponse.getResponseCode()} - ${searchResponse.getContentText()}`);
      return null;
    }
    
    const searchData = JSON.parse(searchResponse.getContentText());
    
    // If no results found, return null
    if (!searchData.results || searchData.results.length === 0) {
      console.log(`No results found for ${companyName}`);
      return null;
    }
    
    // Get the first result
    const companyId = searchData.results[0].id;
    
    // Fetch detailed company data
    const detailUrl = `https://api.coresignal.com/v1/companies/${companyId}`;
    const detailOptions = {
      'method': 'get',
      'headers': headers,
      'muteHttpExceptions': true
    };
    
    const detailResponse = UrlFetchApp.fetch(detailUrl, detailOptions);
    
    if (detailResponse.getResponseCode() !== 200) {
      console.error(`Error fetching company details: ${detailResponse.getResponseCode()} - ${detailResponse.getContentText()}`);
      return null;
    }
    
    const companyData = JSON.parse(detailResponse.getContentText());
    return companyData;
  } catch (error) {
    console.error(`Error fetching Coresignal data: ${error.message}`);
    return null;
  }
}

// Function to update the potential partner record in Supabase
function updatePotentialPartner(partnerId, companyData) {
  try {
    // Extract relevant data from Coresignal response
    const {
      name,
      website,
      industry,
      description,
      hq_location,
      employee_count,
      revenue_annual_range,
      founded_year,
      social_media,
      leadership,
      products,
      competitors
    } = companyData;
    
    // Prepare the update data
    const updateData = {
      updated_at: new Date().toISOString(),
      last_updated_at: new Date().toISOString().split('T')[0],
      needs_enrichment: false,
      enriched: true
    };
    
    // Add fields if they exist in the Coresignal data
    if (website) updateData.website = website;
    if (industry) updateData.industry = industry;
    if (description) updateData.description = description;
    if (hq_location) updateData.hq_location = hq_location;
    if (employee_count) updateData.employee_count = employee_count;
    if (revenue_annual_range) updateData.revenue_annual_range = revenue_annual_range;
    if (founded_year) updateData.founded_year = founded_year;
    if (social_media) updateData.social_media = social_media;
    
    // Add more complex fields
    if (leadership) updateData.leadership = leadership;
    if (products) updateData.products = products;
    if (competitors) updateData.competitors = competitors;
    
    // Update the potential partner record in Supabase
    const url = `${SUPABASE_URL}/rest/v1/potential_partners?id=eq.${partnerId}`;
    const options = {
      'method': 'patch',
      'headers': {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      'payload': JSON.stringify(updateData),
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    
    if (response.getResponseCode() !== 204) {
      console.error(`Error updating potential partner: ${response.getResponseCode()} - ${response.getContentText()}`);
      return {
        success: false,
        message: `Error updating potential partner: ${response.getContentText()}`
      };
    }
    
    console.log(`Successfully updated potential partner ${partnerId}`);
    return {
      success: true
    };
  } catch (error) {
    console.error(`Error updating potential partner: ${error.message}`);
    return {
      success: false,
      message: `Error updating potential partner: ${error.message}`
    };
  }
}

// Function to cache company data in Supabase
function cacheCompanyData(companyName, companyData) {
  try {
    // Store the data in the company_data_cache table
    const url = `${SUPABASE_URL}/rest/v1/company_data_cache`;
    const options = {
      'method': 'post',
      'headers': {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      'payload': JSON.stringify({
        company_name: companyName,
        data: companyData,
        last_updated: new Date().toISOString()
      }),
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    
    if (response.getResponseCode() !== 201) {
      console.error(`Error caching company data: ${response.getResponseCode()} - ${response.getContentText()}`);
      return false;
    }
    
    console.log(`Successfully cached data for ${companyName}`);
    return true;
  } catch (error) {
    console.error(`Error caching company data: ${error.message}`);
    return false;
  }
}

// Function to handle GET requests (for testing)
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Coresignal Enrichment Webhook is running'
  })).setMimeType(ContentService.MimeType.JSON);
}
