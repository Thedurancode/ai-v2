import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCompanyResearch, saveCompanyResearch } from '../services/api';
import { getPartnerResearch, savePartnerResearch, getPerplexityPartnerResearch } from '../services/partnerApi';
import standardizeResearchFormat from '../utils/researchFormatter';

const ResearchContext = createContext();

export const useResearch = () => {
  const context = useContext(ResearchContext);
  if (!context) {
    throw new Error('useResearch must be used within a ResearchProvider');
  }
  return context;
};

export const ResearchProvider = ({ children }) => {
  const [companyResearch, setCompanyResearch] = useState({});
  const [partnerResearch, setPartnerResearch] = useState({});
  const [loadingResearch, setLoadingResearch] = useState({});

  // Load research data from localStorage on mount
  useEffect(() => {
    try {
      const savedCompanyResearch = localStorage.getItem('companyResearch');
      const savedPartnerResearch = localStorage.getItem('partnerResearch');

      if (savedCompanyResearch) {
        setCompanyResearch(JSON.parse(savedCompanyResearch));
      }

      if (savedPartnerResearch) {
        setPartnerResearch(JSON.parse(savedPartnerResearch));
      }
    } catch (error) {
      console.error('Error loading research from localStorage:', error);
    }
  }, []);

  // Save research data to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('companyResearch', JSON.stringify(companyResearch));
    } catch (error) {
      console.error('Error saving company research to localStorage:', error);
    }
  }, [companyResearch]);

  useEffect(() => {
    try {
      localStorage.setItem('partnerResearch', JSON.stringify(partnerResearch));
    } catch (error) {
      console.error('Error saving partner research to localStorage:', error);
    }
  }, [partnerResearch]);

  const getResearch = async (company, forceRefresh = false) => {
    if (!company?.name) return null;

    // Return cached data if available and not forcing refresh
    if (!forceRefresh && companyResearch[company.name]) {
      return companyResearch[company.name];
    }

    // Set loading state for this company
    setLoadingResearch(prev => ({ ...prev, [company.name]: true }));

    try {
      // Try to fetch from backend first
      const savedResearch = await getCompanyResearch(company.name, forceRefresh);

      if (savedResearch && savedResearch.success && savedResearch.research) {
        // Update context state with the research data
        setCompanyResearch(prev => ({
          ...prev,
          [company.name]: savedResearch.research
        }));

        // Return the research data
        return savedResearch.research;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching research for ${company.name}:`, error);
      return null;
    } finally {
      setLoadingResearch(prev => ({ ...prev, [company.name]: false }));
    }
  };

  const saveResearch = async (company, data, source) => {
    if (!company?.name || !data) return;

    try {
      // Save to backend
      await saveCompanyResearch(company.name, data, source);

      // Update context state
      setCompanyResearch(prev => ({
        ...prev,
        [company.name]: {
          data,
          source,
          updated_at: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error(`Error saving research for ${company.name}:`, error);
    }
  };

  const isResearchLoading = (companyName) => {
    return !!loadingResearch[companyName];
  };

  const hasResearch = (companyName) => {
    return !!companyResearch[companyName];
  };

  // Partner research functions
  const getPartnerResearchData = async (partner, forceRefresh = false) => {
    if (!partner?.id) return null;

    // Return cached data if available and not forcing refresh
    if (!forceRefresh && partnerResearch[partner.id]) {
      return partnerResearch[partner.id];
    }

    // Set loading state for this partner
    setLoadingResearch(prev => ({ ...prev, [`partner-${partner.id}`]: true }));

    try {
      // Try to fetch from backend first
      const savedResearch = await getPartnerResearch(partner.id, forceRefresh);

      if (savedResearch && savedResearch.success && savedResearch.research) {
        // Standardize the research format
        const standardizedResearch = {
          ...savedResearch.research,
          data: standardizeResearchFormat(savedResearch.research.data)
        };

        // Update context state with the standardized research data
        setPartnerResearch(prev => ({
          ...prev,
          [partner.id]: standardizedResearch
        }));

        // Return the standardized research data
        return standardizedResearch;
      }

      // If forceRefresh is true or no existing research, generate new research
      if (forceRefresh || !savedResearch || !savedResearch.success) {
        try {
          // Generate new research
          const newResearch = await getPerplexityPartnerResearch(partner);

          if (newResearch) {
            // Standardize the research format
            let researchData;

            if (typeof newResearch === 'string') {
              // If it's a string, wrap it in an object with standardized format
              researchData = {
                data: standardizeResearchFormat(newResearch),
                source: 'perplexity',
                updated_at: new Date().toISOString()
              };
            } else {
              // If it's already an object, standardize the data property
              researchData = {
                ...newResearch,
                data: standardizeResearchFormat(newResearch.data || newResearch),
                source: newResearch.source || 'perplexity',
                updated_at: newResearch.updated_at || new Date().toISOString()
              };
            }

            // Update context state
            setPartnerResearch(prev => ({
              ...prev,
              [partner.id]: researchData
            }));

            return researchData;
          }
        } catch (genError) {
          console.error(`Error generating new research for ${partner.name}:`, genError);
          throw genError;
        }
      }

      return null;
    } catch (error) {
      console.error(`Error fetching research for partner ${partner.name}:`, error);
      throw error;
    } finally {
      setLoadingResearch(prev => ({ ...prev, [`partner-${partner.id}`]: false }));
    }
  };

  const savePartnerResearchData = async (partner, data, source) => {
    if (!partner?.id || !data) return;

    try {
      // Save to backend
      await savePartnerResearch(partner.id, partner.name, data, source);

      // Update context state
      setPartnerResearch(prev => ({
        ...prev,
        [partner.id]: {
          data,
          source,
          updated_at: new Date().toISOString()
        }
      }));

      // Update the partner object to indicate it has research
      return {
        success: true,
        message: `Research saved for ${partner.name}`
      };
    } catch (error) {
      console.error(`Error saving research for partner ${partner.name}:`, error);
      return {
        success: false,
        message: error.message || 'Failed to save research'
      };
    }
  };

  const isPartnerResearchLoading = (partnerId) => {
    return !!loadingResearch[`partner-${partnerId}`];
  };

  const hasPartnerResearch = (partnerId) => {
    return !!partnerResearch[partnerId];
  };

  return (
    <ResearchContext.Provider
      value={{
        // Company research
        companyResearch,
        getResearch,
        saveResearch,
        isResearchLoading,
        hasResearch,

        // Partner research
        partnerResearch,
        getPartnerResearchData,
        savePartnerResearchData,
        isPartnerResearchLoading,
        hasPartnerResearch
      }}
    >
      {children}
    </ResearchContext.Provider>
  );
};
