import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { m as motion } from 'framer-motion';

// Import components
import SearchBox from '../components/SearchBox';
import Loader from '../components/Loader';
import ResultsContainer from '../components/ResultsContainer';
import CompanyModal from '../components/CompanyModal';
import HistoryModal from '../components/HistoryModal';
import Footer from '../components/Footer';
import ErrorBoundary from '../components/ErrorBoundary'; // Import ErrorBoundary
import ResultsSkeleton from '../components/SkeletonLoader'; // Import Skeleton Loader
import replitApi from '../services/replit-api'; // Import Replit-specific API

const AnimatedBackground = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  z-index: -1;
  overflow: hidden;

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 20vw;
    height: 20vw;
    max-width: 300px;
    max-height: 300px;
    min-width: 150px;
    min-height: 150px;
    border-radius: 50%;
    background: rgba(99, 102, 241, 0.08);
    filter: blur(60px);
  }

  &::before {
    top: 10%;
    left: 10%;
    animation: float 15s ease-in-out infinite alternate;

    @media (max-width: ${props => props.theme.breakpoints.md}) {
      left: 5%;
    }
  }

  &::after {
    bottom: 10%;
    right: 10%;
    background: rgba(244, 63, 94, 0.08);
    animation: float 18s ease-in-out infinite alternate-reverse;

    @media (max-width: ${props => props.theme.breakpoints.md}) {
      right: 5%;
    }
  }

  @keyframes float {
    0% {
      transform: translate(0, 0) scale(1);
    }
    50% {
      transform: translate(50px, 30px) scale(1.2);
    }
    100% {
      transform: translate(-30px, 50px) scale(0.8);
    }
  }
`;

const PageContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
  z-index: 1;

  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    padding: 1.5rem 1rem;
    max-width: 100%;
  }

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: 1rem 0.5rem;
    max-width: 100%;
  }

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: 0.5rem 0.25rem;
    max-width: 100%;
  }
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ErrorContainer = styled(motion.div)`
  background-color: ${props => props.theme?.colors?.background?.secondary || '#1E1E1E'};
  border-radius: ${props => props.theme?.borderRadius?.md || '0.5rem'};
  padding: 2rem;
  margin: 2rem auto;
  text-align: center;
  max-width: 800px;
  border-left: 4px solid ${props => props.theme?.colors?.status?.error || '#F44336'};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    max-width: 100%;
    margin: 1rem auto;
    padding: 1.5rem;
  }

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: 1rem;
    margin: 0.5rem auto;
  }
`;

const ErrorTitle = styled.h3`
  color: ${props => props.theme?.colors?.status?.error || '#F44336'};
  margin-bottom: 1rem;
  font-size: ${props => props.theme?.fontSizes?.xl || '1.25rem'};
`;

const ErrorMessage = styled.p`
  color: ${props => props.theme?.colors?.text?.secondary || '#CCCCCC'};
  margin-bottom: 1.5rem;
`;

const RetryButton = styled(motion.button)`
  background-color: ${props => props.theme?.colors?.accent || '#C8102E'};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: ${props => props.theme?.borderRadius?.md || '0.5rem'};
  cursor: pointer;
  font-weight: ${props => props.theme?.fontWeights?.medium || 500};

  &:hover {
    background-color: ${props => `${props.theme?.colors?.accent || '#C8102E'}dd`};
  }
`;

const DEFAULT_LOADING_STATUS = {
  current_step: 'idle',
  message: 'Ready to search',
  progress: 0,
  completed: false
};

const HomePage = ({ isHistoryModalOpen, setIsHistoryModalOpen }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // Used to store the current search query
  const [searchStatus, setSearchStatus] = useState(DEFAULT_LOADING_STATUS);
  const [searchResults, setSearchResults] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastFailedAction, setLastFailedAction] = useState(null);

  // Fetch search history
  const fetchHistory = async () => {
    try {
      console.log('Fetching search history...');
      await axios.get('/api/history');
      console.log('History refreshed on server');
      // This function is now just used to refresh the history data on the server
      // No need to store the data locally since we're using a separate page for history
    } catch (error) {
      console.warn('Error fetching search history:', error?.response?.data?.message || error.response?.data?.error || error.message);
      // Consider adding a user-facing notification if history is critical
    }
  };

  // Load history on component mount
  useEffect(() => {
    fetchHistory();
  }, []);

  // Poll for search status updates
  useEffect(() => {
    let statusInterval;

    const checkSearchStatus = async () => {
      try {
        console.log('Checking search status using Replit API...');

        // Try using our Replit-specific API service first
        try {
          const status = await replitApi.checkSearchStatus();
          console.log('Search status response from Replit API:', status);

          setSearchStatus(status);

          // If search is complete and has results, update search results
          if (status.completed && status.results) {
            // Format the results correctly based on where they came from
            const formattedResults = status.results;
            console.log('Search complete, results:', formattedResults);
            setSearchResults(formattedResults);
            // Refresh history when search completes
            fetchHistory();
          }

          if (status.completed || status.current_step === 'error') {
            clearInterval(statusInterval);
            setIsSearching(false);
          }

          return; // Exit early if successful
        } catch (replitError) {
          console.warn('Replit API status check failed, falling back to direct axios:', replitError);
          // Continue to the fallback method
        }

        // Fallback to direct axios call
        console.log('Falling back to direct axios call to /search-status');
        const response = await axios.get('/search-status');
        console.log('Search status response from direct axios:', response.data);
        const status = response.data;

        setSearchStatus(status);

        // If search is complete and has results, update search results
        if (status.completed && status.results) {
          // Format the results correctly based on where they came from
          const formattedResults = status.results;
          console.log('Search complete, results:', formattedResults);
          setSearchResults(formattedResults);
          // Refresh history when search completes
          fetchHistory();
        }

        if (status.completed || status.current_step === 'error') {
          clearInterval(statusInterval);
          setIsSearching(false);
        }
      } catch (error) {
        console.error('Error checking search status:', error);
        clearInterval(statusInterval);
        setIsSearching(false);
        // Try to get a more specific message from the backend response
        const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
        setSearchStatus({
          ...DEFAULT_LOADING_STATUS,
          current_step: 'error',
          message: `Failed to get search status: ${errorMessage}`,
          completed: true
        });
        setLastFailedAction({ type: 'status-check' }); // Store failed action
      }
    };

    if (isSearching) {
      statusInterval = setInterval(checkSearchStatus, 2000);
    }

    return () => {
      if (statusInterval) clearInterval(statusInterval);
    };
  }, [isSearching]);

  // Handle search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    setIsSearching(true);
    setSearchResults(null);
    setLastFailedAction(null); // Clear previous errors on new search
    setSearchStatus({
      ...DEFAULT_LOADING_STATUS,
      current_step: 'searching',
      message: `Searching for companies related to: "${query}"`,
      progress: 10
    });

    try {
      // Validate query before sending
      if (!query || !query.trim()) {
        throw new Error('Please provide a valid search query');
      }

      // Get the OpenAI API key from environment variables
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

      console.log('Using Replit API service for search');

      // Try using our Replit-specific API service first
      try {
        const data = await replitApi.searchCompanies(query.trim(), {
          api_key: openaiApiKey // Pass the API key to the backend
        });
        console.log('Search response from Replit API:', data);
        setSearchResults(data);
        setIsSearching(false);
        return; // Exit early if successful
      } catch (replitError) {
        console.warn('Replit API search failed, falling back to direct axios:', replitError);
        // Continue to the fallback method
      }

      // Fallback to direct axios call
      console.log('Falling back to direct axios call to /search');
      const response = await axios.post('/search', {
        query: query.trim(),
        api_key: openaiApiKey // Pass the API key to the backend
      });
      console.log('Search response from direct axios:', response.data);
      setSearchResults(response.data);
      setIsSearching(false);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults(null);
      // Try to get a more specific message from the backend response
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';

      // Check if this is a "no companies found" error
      const isNoCompaniesError = errorMessage.includes('No new companies found') ||
                                errorMessage.includes('No companies found');

      // Create a more helpful error message
      const friendlyMessage = isNoCompaniesError
        ? `No companies found for "${query}". Try a more general industry term like "sports technology" or "digital marketing".`
        : `Search failed: ${errorMessage}`;

      setSearchStatus({
        ...DEFAULT_LOADING_STATUS,
        current_step: 'error',
        message: friendlyMessage,
        completed: true
      });
      setLastFailedAction({ type: 'search', query }); // Store failed action
      setIsSearching(false);
    }
  };

  // Handle AI search
  const handleAiSearch = async () => {
    setIsSearching(true);
    setSearchResults(null);
    setLastFailedAction(null); // Clear previous errors on new search
    setSearchStatus({
      ...DEFAULT_LOADING_STATUS,
      current_step: 'searching',
      message: 'Starting AI-powered search...',
      progress: 10
    });

    try {
      // Get the OpenAI API key from environment variables
      const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

      console.log('Using Replit API service for AI search');

      // Try using our Replit-specific API service first
      try {
        await replitApi.aiSearch({
          api_key: openaiApiKey // Pass the API key to the backend
        });
        console.log('AI search initiated via Replit API, waiting for results via polling');
        // The actual results will be received via the polling mechanism
        return; // Exit early if successful
      } catch (replitError) {
        console.warn('Replit API AI search failed, falling back to direct axios:', replitError);
        // Continue to the fallback method
      }

      // Fallback to direct axios call
      console.log('Falling back to direct axios call to /ai-search');
      await axios.get('/ai-search', {
        params: {
          api_key: openaiApiKey // Pass the API key to the backend
        }
      });
      console.log('AI search initiated via direct axios, waiting for results via polling');
      // The actual results will be received via the polling mechanism
    } catch (error) {
      console.error('AI search error:', error);
      setSearchResults(null);
      // Try to get a more specific message from the backend response
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';

      // Check if this is a "no companies found" error
      const isNoCompaniesError = errorMessage.includes('No new companies found') ||
                                errorMessage.includes('No companies found');

      // Create a more helpful error message
      const friendlyMessage = isNoCompaniesError
        ? `No companies found. The AI search couldn't find relevant companies. Try using the manual search with a specific industry term.`
        : `AI search failed: ${errorMessage}`;

      setSearchStatus({
        ...DEFAULT_LOADING_STATUS,
        current_step: 'error',
        message: friendlyMessage,
        completed: true
      });
      setLastFailedAction({ type: 'ai-search' }); // Store failed action
      setIsSearching(false);
    }
  };

  // Handle selecting a company
  const handleSelectCompany = async (company) => {
    setSelectedCompany(company);
    setIsModalOpen(true);

    // Try to get additional details if needed
    try {
      console.log('Getting company details for:', company.name);

      // Try using our Replit-specific API service first (if we add this method later)
      // For now, just use the direct axios call
      const response = await axios.post('/company-details', {
        name: company.name
      });

      if (response.data && response.data.company) {
        console.log('Got additional company details:', response.data.company);
        setSelectedCompany({
          ...company,
          ...response.data.company
        });
      }
    } catch (error) {
      console.warn('Error fetching company details:', error?.response?.data?.message || error.message);
      // Keep the original company data if the fetch fails.
      // Consider adding a user-facing notification (e.g., toast)
      // to inform the user that details might be incomplete.
    }
  };

  // Handle closing the company modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedCompany(null), 300);
  };

  // Handle retry logic
  const handleRetry = () => {
    if (!lastFailedAction) return;

    const { type, query } = lastFailedAction;
    setLastFailedAction(null); // Clear failed action state before retrying
    setSearchStatus(DEFAULT_LOADING_STATUS); // Reset status display

    if (type === 'search' && query) {
      handleSearch(query);
    } else if (type === 'ai-search') {
      handleAiSearch();
    } else if (type === 'status-check') {
      // Re-initiate polling by setting isSearching to true
      setIsSearching(true);
    }
  };

  return (
    <>
      <AnimatedBackground
        animate={{
          background: isSearching ?
            'linear-gradient(135deg, #0b1120 0%, #172334 100%)' :
            'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        }}
        transition={{ duration: 0.8 }}
      />
      <PageContainer>
        <Main>
          <SearchBox
            onSearch={handleSearch}
            onAiSearch={handleAiSearch}
            onClear={() => setSearchQuery('')}
            disabled={isSearching}
            isSearching={isSearching}
          />
          <ErrorBoundary>

          {isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{ width: '100%', margin: '0 auto' }}
            >
              <Loader
                status={searchStatus}
              />
              {/* Show skeleton loader while search is in progress and hasn't errored */}
              {searchStatus.current_step === 'searching' && <ResultsSkeleton />}
            </motion.div>
          )}

          {!isSearching && searchResults && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{ width: '100%', margin: '0 auto' }}
            >
              {console.log('Rendering with searchResults:', searchResults)}
              <ResultsContainer
                results={{
                  industry: searchResults.industry,
                  companies: searchResults.analysis?.companies ||
                             searchResults.companies || [],
                  analysis: {
                    content: searchResults.analysis?.industry_overview ||
                             searchResults.industry_overview || ''
                  },
                  search_results: searchResults.search_results || []
                }}
                onSelectCompany={handleSelectCompany}
              />
            </motion.div>
          )}

          {!isSearching && searchStatus.current_step === 'error' && (
            <ErrorContainer
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ErrorTitle>Search Error</ErrorTitle>
              <ErrorMessage>{searchStatus.message}</ErrorMessage>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <RetryButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRetry} // Use the new retry handler
                  disabled={!lastFailedAction} // Disable if no action to retry
                >
                  Try Again {lastFailedAction ? `(${lastFailedAction.type.replace('-', ' ')})` : ''}
                </RetryButton>

                {searchStatus.message && searchStatus.message.includes('No companies found') && (
                  <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#aaa', maxWidth: '500px' }}>
                    <p>Suggested search terms: "sports technology", "digital marketing", "fan engagement", "sports analytics", "esports"</p>
                  </div>
                )}
              </div>
            </ErrorContainer>
          )}
          </ErrorBoundary>
        </Main>

        <Footer />
      </PageContainer>

      {selectedCompany && (
        <CompanyModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          company={selectedCompany}
        />
      )}

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onSelectCompany={handleSelectCompany}
      />
    </>
  );
};

export default HomePage;
