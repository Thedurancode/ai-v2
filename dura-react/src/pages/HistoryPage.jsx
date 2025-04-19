import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { m as motion } from 'framer-motion';
import { MagnifyingGlass, ArrowUp, ArrowDown, CaretLeft } from '@phosphor-icons/react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { seedHistoryIfEmpty, seedCompanyHistory } from '../services/api';

// Import components
import Header from '../components/Header';
import Footer from '../components/Footer';

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
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: rgba(99, 102, 241, 0.08);
    filter: blur(60px);
  }

  &::before {
    top: 10%;
    left: 20%;
    animation: float 15s ease-in-out infinite alternate;
  }

  &::after {
    bottom: 15%;
    right: 20%;
    background: rgba(244, 63, 94, 0.08);
    animation: float 18s ease-in-out infinite alternate-reverse;
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
  z-index: 1;
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
`;

const BackButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.08);
  color: white;
  border: none;
  border-radius: 0.75rem;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
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

const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0 1rem;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const FiltersContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background-color: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 1.25rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.2), 0 10px 15px -6px rgba(0, 0, 0, 0.15);
  }
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

const ContentContainer = styled.div`
  background-color: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 1.25rem;
  overflow: hidden;
  flex: 1;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.2), 0 10px 15px -6px rgba(0, 0, 0, 0.15);
  }
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

const ScoreCell = styled(TableCell)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ScoreCircle = styled(motion.div)`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  
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

const generateLogoUrl = (partner) => {
  if (partner.logo) return partner.logo;
  
  // Default logo placeholder if no logo exists
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    partner.name
  )}&background=random&color=fff&size=128`;
};

const HistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      // First, check if history is empty and seed if needed
      await seedHistoryIfEmpty();
      
      // Then fetch partners
      const response = await axios.get('/history');
      console.log("History API response:", response.data);
      
      // Check for various possible response formats
      let historyData = [];
      
      if (response.data && Array.isArray(response.data)) {
        // If response.data is already an array
        historyData = response.data;
      } else if (response.data && response.data.history && Array.isArray(response.data.history)) {
        // If response.data has a history property that's an array
        historyData = response.data.history;
      } else if (response.data && typeof response.data === 'object') {
        // If response.data is an object but not in expected format, try to extract values
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          // Use the first array found in the response
          historyData = possibleArrays[0];
        }
      }
      
      if (historyData && historyData.length > 0) {
        // Add id field to each partner if it doesn't exist
        const partnersWithIds = historyData.map((partner, index) => ({
          ...partner,
          id: partner.id || index
        }));
        setPartners(partnersWithIds);
      } else {
        // No history data, try the more aggressive seeding approach
        console.log('No history data found after initial seed, using aggressive seeding...');
        const success = await seedCompanyHistory();
        
        if (success) {
          // Try one more time to fetch the history
          const retryResponse = await axios.get('/history');
          let retryData = [];
          
          if (retryResponse.data && Array.isArray(retryResponse.data)) {
            retryData = retryResponse.data;
          } else if (retryResponse.data && retryResponse.data.history && Array.isArray(retryResponse.data.history)) {
            retryData = retryResponse.data.history;
          } else if (retryResponse.data && typeof retryResponse.data === 'object') {
            const possibleArrays = Object.values(retryResponse.data).filter(val => Array.isArray(val));
            if (possibleArrays.length > 0) {
              retryData = possibleArrays[0];
            }
          }
          
          if (retryData && retryData.length > 0) {
            const partnersWithIds = retryData.map((partner, index) => ({
              ...partner,
              id: partner.id || index
            }));
            setPartners(partnersWithIds);
          } else {
            setPartners([]);
          }
        } else {
          setPartners([]);
        }
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      setPartners([]);
    } finally {
      setLoading(false);
    }
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

  const handleSelectCompany = (company) => {
    navigate('/', { state: { selectedCompany: company } });
  };

  return (
    <>
      <AnimatedBackground
        animate={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        }}
        transition={{ duration: 0.8 }}
      />
      <PageContainer>
        <Header showHistoryButton={false} />
        
        <Main>
          <PageHeader>
            <BackButton
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <CaretLeft size={20} weight="bold" />
            </BackButton>
            <PageTitle>
              <motion.span
                animate={{ rotate: [0, 5, 0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                style={{ fontSize: '1.8rem' }}
              >
                🏢
              </motion.span>
              Previously Viewed Companies
            </PageTitle>
          </PageHeader>
          
          <FiltersContainer>
            <FilterGroup>
              <FilterLabel htmlFor="sort-select">Sort by:</FilterLabel>
              <FilterSelect 
                id="sort-select"
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-');
                  setSortField(field);
                  setSortDirection(direction);
                }}
              >
                <option value="score-desc">Score (High to Low)</option>
                <option value="score-asc">Score (Low to High)</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="date-desc">Date (Newest First)</option>
                <option value="date-asc">Date (Oldest First)</option>
                <option value="industry-asc">Industry (A-Z)</option>
                <option value="industry-desc">Industry (Z-A)</option>
              </FilterSelect>
            </FilterGroup>
            
            <SearchFilter>
              <SearchIcon>
                <MagnifyingGlass size={18} />
              </SearchIcon>
              <SearchInput
                type="text"
                placeholder="Search companies or industries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchFilter>
          </FiltersContainer>
          
          <ContentContainer>
            {loading ? (
              <EmptyState>
                <LoadingSpinner />
                <p>Loading company history...</p>
              </EmptyState>
            ) : sortedPartners.length === 0 ? (
              <EmptyState>
                <p>No companies found matching your filters.</p>
              </EmptyState>
            ) : (
              <CompaniesTable>
                <thead>
                  <tr>
                    <SortHeader 
                      onClick={() => handleSort('name')}
                      style={{ width: '30%' }}
                    >
                      Company
                      {sortField === 'name' && (
                        <SortIndicator>
                          {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        </SortIndicator>
                      )}
                    </SortHeader>
                    <SortHeader 
                      onClick={() => handleSort('industry')}
                      style={{ width: '25%' }}
                    >
                      Industry
                      {sortField === 'industry' && (
                        <SortIndicator>
                          {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        </SortIndicator>
                      )}
                    </SortHeader>
                    <SortHeader 
                      onClick={() => handleSort('score')}
                      style={{ width: '20%' }}
                    >
                      Score
                      {sortField === 'score' && (
                        <SortIndicator>
                          {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        </SortIndicator>
                      )}
                    </SortHeader>
                    <SortHeader 
                      onClick={() => handleSort('date')}
                      style={{ width: '25%' }}
                    >
                      Added Date
                      {sortField === 'date' && (
                        <SortIndicator>
                          {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        </SortIndicator>
                      )}
                    </SortHeader>
                  </tr>
                </thead>
                <tbody>
                  {sortedPartners.map((partner, index) => (
                    <TableRow 
                      key={index}
                      onClick={() => handleSelectCompany(partner)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <CompanyCell>
                        <CompanyLogo>
                          {partner.logo ? (
                            <img src={partner.logo} alt={`${partner.name} logo`} />
                          ) : (
                            <img src={generateLogoUrl(partner)} alt={`${partner.name} logo`} />
                          )}
                        </CompanyLogo>
                        {partner.name}
                      </CompanyCell>
                      <TableCell>{partner.industry || 'Unknown'}</TableCell>
                      <ScoreCell>
                        <ScoreCircle 
                          score={partner.partnership_score || 0}
                          whileHover={{ scale: 1.05 }}
                        >
                          {Math.round(partner.partnership_score || 0)}
                        </ScoreCircle>
                        <ScoreText>{getScoreText(partner.partnership_score || 0)}</ScoreText>
                      </ScoreCell>
                      <TableCell>{formatDate(partner.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </CompaniesTable>
            )}
          </ContentContainer>
        </Main>
        
        <Footer />
      </PageContainer>
    </>
  );
};

export default HistoryPage; 