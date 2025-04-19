import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlass, CaretDown, ArrowUp, ArrowDown, X } from '@phosphor-icons/react';
import axios from 'axios';
import { seedHistoryIfEmpty, seedCompanyHistory } from '../services/api';

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  overflow-y: auto;
`;

const ModalContent = styled(motion.div)`
  background-color: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 1.25rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  width: 100%;
  max-width: 1000px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.2), 0 10px 15px -6px rgba(0, 0, 0, 0.15);
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CloseButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 1.5rem 2rem;
  background-color: rgba(15, 23, 42, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  flex-wrap: wrap;
  gap: 1rem;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const FilterLabel = styled.label`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
`;

const FilterSelect = styled.select`
  background-color: rgba(15, 23, 42, 0.7);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: rgba(99, 102, 241, 0.7);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
  }
`;

const SearchFilter = styled.div`
  position: relative;
  margin-left: auto;
`;

const SearchInput = styled.input`
  background-color: rgba(15, 23, 42, 0.7);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  font-size: 0.875rem;
  width: 280px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: rgba(99, 102, 241, 0.7);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
  pointer-events: none;
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
`;

const CompaniesTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 1rem 2rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  background-color: rgba(15, 23, 42, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: sticky;
  top: 0;
  z-index: 10;
`;

const SortHeader = styled(TableHeader)`
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  
  &:hover {
    color: white;
  }
`;

const SortIndicator = styled.span`
  margin-left: 0.5rem;
  display: inline-flex;
  align-items: center;
`;

const TableRow = styled(motion.tr)`
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(15, 23, 42, 0.5);
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
`;

const TableCell = styled.td`
  padding: 1rem 2rem;
  font-size: 0.875rem;
  color: white;
`;

const CompanyCell = styled(TableCell)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const LogoScoreContainer = styled.div`
  position: relative;
  width: 40px;
  height: 40px;
`;

const CompanyLogo = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 0.75rem;
  background-color: rgba(30, 41, 59, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 600;
  font-size: 0.875rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ScoreBadge = styled(motion.div)`
  position: absolute;
  bottom: -5px;
  right: -5px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.625rem;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  
  ${({ score, theme }) => {
    if (score >= 8) return `background: linear-gradient(135deg, ${theme.colors.scoring?.excellent || theme.colors.status.excellent} 0%, #00b8a9 100%);`;
    if (score >= 6) return `background: linear-gradient(135deg, ${theme.colors.scoring?.good || theme.colors.status.good} 0%, #e72b3e 100%);`;
    if (score >= 4) return `background: linear-gradient(135deg, ${theme.colors.scoring?.average || theme.colors.status.average} 0%, #ffb300 100%);`;
    return `background: linear-gradient(135deg, ${theme.colors.scoring?.poor || theme.colors.status.poor} 0%, #e53935 100%);`;
  }}
`;

const ScoreText = styled.span`
  font-size: 0.875rem;
  color: white;
`;

const EmptyState = styled.div`
  padding: 5rem 3rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.125rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: #6366f1;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// Helper functions
const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const generateLogoUrl = (companyName) => {
  if (!companyName) return '';
  
  // Clean the company name to create a domain-like string
  // Remove special characters and spaces, convert to lowercase
  const domainName = companyName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
  
  // Add .com to make it look like a domain
  const domain = domainName.endsWith('.com') ? domainName : `${domainName}.com`;
  
  // Use logo.dev API to generate a logo
  return `https://img.logo.dev/${domain}?token=pk_TCK5i8rzR92YmS65BY2fgQ&retina=true`;
};

const HistoryModal = ({ isOpen, onClose, onSelectCompany }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('previouslyViewed');

  useEffect(() => {
    if (isOpen) {
      fetchPartners();
    }
  }, [isOpen]);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      // First, try the initial seeding if needed
      await seedHistoryIfEmpty();
      
      // Fetch search history AND previously viewed companies
      const response = await axios.get('/search-history');
      console.log("Search history API response:", response.data);
      
      // Get the previously considered companies
      let viewedCompanies = [];
      if (response.data && response.data.previously_considered && 
          response.data.previously_considered.companies) {
        // Check if companies is array of strings or objects
        if (response.data.previously_considered.companies.length > 0 && 
            typeof response.data.previously_considered.companies[0] === 'string') {
          // Transform string array into array of company objects with score and logo
          viewedCompanies = response.data.previously_considered.companies.map((name, index) => {
            // Generate a random score between 5 and 9.5 for demo purposes
            const partnershipScore = (5 + Math.random() * 4.5).toFixed(1);
            
            return {
              id: `prev-${index}`,
              name: name,
              viewed_at: new Date().toISOString(),
              partnership_score: partnershipScore,
              logo: generateLogoUrl(name)
            };
          });
        } else {
          // Assume companies are already objects with required properties
          viewedCompanies = response.data.previously_considered.companies.map((company, index) => ({
            id: `prev-${index}`,
            name: company.name || company,
            viewed_at: company.viewed_at || new Date().toISOString(),
            partnership_score: company.partnership_score || (5 + Math.random() * 4.5).toFixed(1),
            logo: company.logo || generateLogoUrl(company.name || company)
          }));
        }
      }
      
      // Get search history data
      let historyData = [];
      if (response.data && response.data.search_history) {
        historyData = response.data.search_history.map((item, index) => ({
          id: `hist-${index}`,
          type: item.type,
          query: item.query,
          results_count: item.results_count,
          timestamp: item.timestamp
        }));
      }
      
      // Reset loading state before processing data
      setLoading(false);
      
      // Set the active data based on the active tab
      if (activeTab === 'previouslyViewed') {
        if (viewedCompanies && viewedCompanies.length > 0) {
          setPartners(viewedCompanies);
        } else {
          // If no viewed companies but we have search history, attempt to seed
          console.log('No previously viewed companies found, attempting to seed...');
          const success = await seedCompanyHistory();
          
          if (success) {
            // Try one more time to fetch the history
            const retryResponse = await axios.get('/search-history');
            
            if (retryResponse.data && retryResponse.data.previously_considered && 
                retryResponse.data.previously_considered.companies) {
              const retryCompanies = retryResponse.data.previously_considered.companies.map((name, index) => {
                const partnershipScore = (5 + Math.random() * 4.5).toFixed(1);
                
                return {
                  id: `prev-${index}`,
                  name: name,
                  viewed_at: new Date().toISOString(),
                  partnership_score: partnershipScore,
                  logo: generateLogoUrl(name)
                };
              });
              setPartners(retryCompanies);
            } else {
              setPartners([]);
            }
          } else {
            setPartners([]);
          }
        }
      } else {
        // For search history tab
        setPartners(historyData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching history data:', error);
      setPartners([]);
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPartners([]); // Clear existing data
    setLoading(true); // Set loading state
    fetchPartners();
  };

  const filteredPartners = partners.filter(partner => {
    return (
      partner.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.industry?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const sortedPartners = [...filteredPartners].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'name') {
      comparison = (a.name || '').localeCompare(b.name || '');
    } else if (sortField === 'industry') {
      comparison = (a.industry || '').localeCompare(b.industry || '');
    } else if (sortField === 'score') {
      comparison = (a.partnership_score || 0) - (b.partnership_score || 0);
    } else if (sortField === 'date') {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      comparison = dateA - dateB;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getScoreText = (score) => {
    if (score >= 8) return 'Excellent';
    if (score >= 5) return 'Good';
    if (score >= 3) return 'Average';
    return 'Poor';
  };

  const TabContainer = styled.div`
    display: flex;
    padding: 1rem 2rem;
    background: rgba(15, 23, 42, 0.3);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  `;

  const TabButton = styled.button`
    background: ${props => props.active ? 'rgba(99, 102, 241, 0.2)' : 'transparent'};
    color: ${props => props.active ? 'white' : 'rgba(255, 255, 255, 0.6)'};
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    margin-right: 1rem;
    
    &:hover {
      background: ${props => props.active ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
    }
  `;

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <ModalContent
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader>
              <ModalTitle>History</ModalTitle>
              <CloseButton
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
              >
                <X weight="bold" />
              </CloseButton>
            </ModalHeader>
            
            <TabContainer>
              <TabButton 
                active={activeTab === 'previouslyViewed'} 
                onClick={() => handleTabChange('previouslyViewed')}
              >
                Previously Viewed
              </TabButton>
              <TabButton 
                active={activeTab === 'searchHistory'} 
                onClick={() => handleTabChange('searchHistory')}
              >
                Search History
              </TabButton>
            </TabContainer>
            
            <FiltersContainer>
              <SearchFilter>
                <SearchIcon>
                  <MagnifyingGlass size={20} weight="bold" />
                </SearchIcon>
                <SearchInput
                  type="text"
                  placeholder={activeTab === 'previouslyViewed' ? "Search companies..." : "Search history..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </SearchFilter>
            </FiltersContainer>
            
            <ModalBody>
              {loading ? (
                <EmptyState>
                  <LoadingSpinner />
                  <p>Loading history data...</p>
                </EmptyState>
              ) : partners.length > 0 ? (
                <CompaniesTable>
                  <thead>
                    <tr>
                      {activeTab === 'previouslyViewed' ? (
                        <>
                          <SortHeader onClick={() => handleSort('name')}>
                            Company Name
                            {sortField === 'name' && (
                              <SortIndicator>
                                {sortDirection === 'asc' ? (
                                  <ArrowUp size={16} weight="bold" />
                                ) : (
                                  <ArrowDown size={16} weight="bold" />
                                )}
                              </SortIndicator>
                            )}
                          </SortHeader>
                          <SortHeader onClick={() => handleSort('date')}>
                            Viewed Date
                            {sortField === 'date' && (
                              <SortIndicator>
                                {sortDirection === 'asc' ? (
                                  <ArrowUp size={16} weight="bold" />
                                ) : (
                                  <ArrowDown size={16} weight="bold" />
                                )}
                              </SortIndicator>
                            )}
                          </SortHeader>
                        </>
                      ) : (
                        <>
                          <SortHeader onClick={() => handleSort('type')}>
                            Search Type
                            {sortField === 'type' && (
                              <SortIndicator>
                                {sortDirection === 'asc' ? (
                                  <ArrowUp size={16} weight="bold" />
                                ) : (
                                  <ArrowDown size={16} weight="bold" />
                                )}
                              </SortIndicator>
                            )}
                          </SortHeader>
                          <SortHeader onClick={() => handleSort('query')}>
                            Query
                            {sortField === 'query' && (
                              <SortIndicator>
                                {sortDirection === 'asc' ? (
                                  <ArrowUp size={16} weight="bold" />
                                ) : (
                                  <ArrowDown size={16} weight="bold" />
                                )}
                              </SortIndicator>
                            )}
                          </SortHeader>
                          <SortHeader onClick={() => handleSort('results')}>
                            Results
                            {sortField === 'results' && (
                              <SortIndicator>
                                {sortDirection === 'asc' ? (
                                  <ArrowUp size={16} weight="bold" />
                                ) : (
                                  <ArrowDown size={16} weight="bold" />
                                )}
                              </SortIndicator>
                            )}
                          </SortHeader>
                          <SortHeader onClick={() => handleSort('date')}>
                            Date
                            {sortField === 'date' && (
                              <SortIndicator>
                                {sortDirection === 'asc' ? (
                                  <ArrowUp size={16} weight="bold" />
                                ) : (
                                  <ArrowDown size={16} weight="bold" />
                                )}
                              </SortIndicator>
                            )}
                          </SortHeader>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {partners
                      .filter(partner => {
                        if (searchTerm === '') return true;
                        
                        if (activeTab === 'previouslyViewed') {
                          return partner.name.toLowerCase().includes(searchTerm.toLowerCase());
                        } else {
                          return (
                            partner.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            partner.query?.toLowerCase().includes(searchTerm.toLowerCase())
                          );
                        }
                      })
                      .map((partner) => (
                        <TableRow
                          key={partner.id}
                          onClick={() => {
                            if (activeTab === 'previouslyViewed') {
                              onSelectCompany({ 
                                name: partner.name,
                                partnership_score: partner.partnership_score,
                                logo: partner.logo
                              });
                            }
                          }}
                          whileHover={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
                          style={{ cursor: activeTab === 'previouslyViewed' ? 'pointer' : 'default' }}
                        >
                          {activeTab === 'previouslyViewed' ? (
                            <>
                              <CompanyCell>
                                <LogoScoreContainer>
                                  <CompanyLogo>
                                    {partner.logo ? (
                                      <img src={partner.logo} alt={partner.name} />
                                    ) : (
                                      getInitials(partner.name)
                                    )}
                                  </CompanyLogo>
                                  <ScoreBadge 
                                    score={Number(partner.partnership_score)}
                                    whileHover={{ scale: 1.2 }}
                                  >
                                    {partner.partnership_score}
                                  </ScoreBadge>
                                </LogoScoreContainer>
                                <div>
                                  <div>{partner.name}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                                    {getScoreText(Number(partner.partnership_score))}
                                  </div>
                                </div>
                              </CompanyCell>
                              <TableCell>
                                {formatDate(partner.viewed_at)}
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell>{partner.type}</TableCell>
                              <TableCell>{partner.query}</TableCell>
                              <TableCell>{partner.results_count}</TableCell>
                              <TableCell>{formatDate(partner.timestamp)}</TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                  </tbody>
                </CompaniesTable>
              ) : (
                <EmptyState>
                  <p>
                    {activeTab === 'previouslyViewed'
                      ? "No previously viewed companies found. Start by searching for companies."
                      : "No search history available."}
                  </p>
                </EmptyState>
              )}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
};

export default HistoryModal;
