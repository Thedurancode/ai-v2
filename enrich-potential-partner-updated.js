// Edge function to enrich potential partners using Coresignal API
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Create a Supabase client with the Auth context of the logged in user
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Coresignal API credentials - hardcoded for now
const CORESIGNAL_API_KEY = "eyJhbGciOiJFZERTQSIsImtpZCI6IjQ1OGJmZmE1LTRlNjgtMGJkYS01YjNkLTBmNDExNzMzNTBmZCJ9.eyJhdWQiOiJtbHNlLmNvbSIsImV4cCI6MTc2OTkwMDg5MCwiaWF0IjoxNzM4MzQzOTM4LCJpc3MiOiJodHRwczovL29wcy5jb3Jlc2lnbmFsLmNvbTo4MzAwL3YxL2lkZW50aXR5L29pZGMiLCJuYW1lc3BhY2UiOiJyb290IiwicHJlZmVycmVkX3VzZXJuYW1lIjoibWxzZS5jb20iLCJzdWIiOiI5Nzg4ZDg5Ni0yNzBjLTU4NjgtMTY0Mi05MWFiZDk0MGEwODYiLCJ1c2VyaW5mbyI6eyJzY29wZXMiOiJjZGFwaSJ9fQ._t7fLNrmK16uhrch3KV3BnXSWkbCy1X0PyHXD0GEyDO3u8IzGfwMEDa96sUt-tT4ZbuFeSDiXMTIJyov7Vn9Aw"
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/v1'

async function fetchCoresignalData(companyName) {
  try {
    console.log(`Fetching Coresignal data for ${companyName}`)
    
    if (!CORESIGNAL_API_KEY) {
      console.error('No Coresignal API key found')
      return null
    }

    const headers = {
      'Authorization': `Bearer ${CORESIGNAL_API_KEY}`,
      'Content-Type': 'application/json'
    }
    
    // Search for the company
    const searchUrl = `${CORESIGNAL_BASE_URL}/companies/search?query=${encodeURIComponent(companyName)}`
    const searchResponse = await fetch(searchUrl, { headers })
    
    if (!searchResponse.ok) {
      console.error(`Error from Coresignal API: ${searchResponse.status} - ${await searchResponse.text()}`)
      return null
    }
    
    const searchData = await searchResponse.json()
    
    // If no results found, return null
    if (!searchData.results || searchData.results.length === 0) {
      console.log(`No results found for ${companyName}`)
      return null
    }
    
    // Get the first result
    const companyId = searchData.results[0].id
    
    // Fetch detailed company data
    const detailUrl = `${CORESIGNAL_BASE_URL}/companies/${companyId}`
    const detailResponse = await fetch(detailUrl, { headers })
    
    if (!detailResponse.ok) {
      console.error(`Error fetching company details: ${detailResponse.status} - ${await detailResponse.text()}`)
      return null
    }
    
    const companyData = await detailResponse.json()
    return companyData
  } catch (error) {
    console.error(`Error fetching Coresignal data: ${error.message}`)
    return null
  }
}

async function updatePotentialPartner(partnerId, companyData) {
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
    } = companyData
    
    // Prepare the update data
    const updateData = {
      updated_at: new Date().toISOString(),
      last_updated_at: new Date().toISOString().split('T')[0],
      needs_enrichment: false,
      enriched: true
    }
    
    // Add fields if they exist in the Coresignal data
    if (website) updateData.website = website
    if (industry) updateData.industry = industry
    if (description) updateData.description = description
    if (hq_location) updateData.hq_location = hq_location
    if (employee_count) updateData.employee_count = employee_count
    if (revenue_annual_range) updateData.revenue_annual_range = revenue_annual_range
    if (founded_year) updateData.founded_year = founded_year
    if (social_media) updateData.social_media = social_media
    
    // Add more complex fields
    if (leadership) updateData.leadership = leadership
    if (products) updateData.products = products
    if (competitors) updateData.competitors = competitors
    
    // Update the potential partner record
    const { data, error } = await supabase
      .from('potential_partners')
      .update(updateData)
      .eq('id', partnerId)
    
    if (error) {
      console.error(`Error updating potential partner: ${error.message}`)
      return false
    }
    
    console.log(`Successfully updated potential partner ${partnerId}`)
    return true
  } catch (error) {
    console.error(`Error updating potential partner: ${error.message}`)
    return false
  }
}

async function cacheCompanyData(companyName, companyData) {
  try {
    // Store the data in the company_data_cache table
    const { data, error } = await supabase
      .from('company_data_cache')
      .upsert({
        company_name: companyName,
        data: companyData,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'company_name'
      })
    
    if (error) {
      console.error(`Error caching company data: ${error.message}`)
      return false
    }
    
    console.log(`Successfully cached data for ${companyName}`)
    return true
  } catch (error) {
    console.error(`Error caching company data: ${error.message}`)
    return false
  }
}

export const handler = async (req) => {
  try {
    // Get the request body
    const body = await req.json()
    const { record, old_record } = body
    
    // If this is not an insert or update, or if the record is not marked for enrichment, return
    if (!record || (old_record && !record.needs_enrichment)) {
      return new Response(JSON.stringify({ message: 'No enrichment needed' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      })
    }
    
    const partnerId = record.id
    const companyName = record.name
    
    if (!companyName) {
      return new Response(JSON.stringify({ message: 'No company name provided' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      })
    }
    
    console.log(`Processing enrichment for ${companyName} (ID: ${partnerId})`)
    
    // Check if we have cached data
    const { data: cachedData, error: cacheError } = await supabase
      .from('company_data_cache')
      .select('data, last_updated')
      .eq('company_name', companyName)
      .single()
    
    let companyData
    
    if (cachedData && !cacheError && cachedData.last_updated) {
      // Check if the cached data is less than 7 days old
      const lastUpdated = new Date(cachedData.last_updated)
      const now = new Date()
      const diffDays = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24))
      
      if (diffDays < 7) {
        console.log(`Using cached data for ${companyName} (${diffDays} days old)`)
        companyData = cachedData.data
      } else {
        console.log(`Cached data for ${companyName} is too old (${diffDays} days), fetching fresh data`)
        companyData = await fetchCoresignalData(companyName)
        
        if (companyData) {
          await cacheCompanyData(companyName, companyData)
        }
      }
    } else {
      console.log(`No cached data found for ${companyName}, fetching from Coresignal`)
      companyData = await fetchCoresignalData(companyName)
      
      if (companyData) {
        await cacheCompanyData(companyName, companyData)
      }
    }
    
    if (!companyData) {
      return new Response(JSON.stringify({ message: 'Failed to fetch company data' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      })
    }
    
    // Update the potential partner record with the enriched data
    const updated = await updatePotentialPartner(partnerId, companyData)
    
    if (!updated) {
      return new Response(JSON.stringify({ message: 'Failed to update potential partner' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      })
    }
    
    return new Response(JSON.stringify({ 
      message: 'Successfully enriched potential partner',
      company: companyName,
      id: partnerId
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    console.error(`Error in edge function: ${error.message}`)
    return new Response(JSON.stringify({ message: `Error: ${error.message}` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
}
