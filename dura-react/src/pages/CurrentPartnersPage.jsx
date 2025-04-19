import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { m as motion } from 'framer-motion';
import axios from 'axios';
import { Buildings, MagnifyingGlass, List, GridFour, Check, XCircle } from '@phosphor-icons/react';

// Styled components
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

const PageContainer = styled(motion.div)`
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
  color: ${({ theme }) => theme.colors.text.primary};
  position: relative;
  z-index: 1;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
`;

const Select = styled.select`
  background-color: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SearchInput = styled.div`
  position: relative;
  width: 250px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 100%;
  }

  input {
    width: 100%;
    background-color: ${({ theme }) => theme.colors.background.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 0.5rem;
    padding: 0.5rem 1rem 0.5rem 2.5rem;
    font-size: 0.9rem;
    outline: none;

    &:focus {
      border-color: ${({ theme }) => theme.colors.primary};
    }
  }

  svg {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const PartnersGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
`;

const PartnerCard = styled(motion.div)`
  background-color: rgba(15, 23, 42, 0.7);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    border-color: rgba(99, 102, 241, 0.3);
  }
`;

const PartnerHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const LogoContainer = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.background.tertiary};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const PartnerName = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const PartnerBody = styled.div`
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Category = styled.div`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.accent};
  margin-bottom: 0.75rem;
  font-weight: 500;
`;

const Description = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.5;
  margin-bottom: 1rem;
  flex: 1;
`;

const InclusionsExclusions = styled.div`
  margin-top: auto;
`;

const SectionTitle = styled.h4`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0.75rem 0 0.5rem;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const Tag = styled.span`
  font-size: 0.75rem;
  background-color: ${({ theme, type }) =>
    type === 'inclusion'
      ? 'rgba(76, 175, 80, 0.1)'
      : 'rgba(244, 67, 54, 0.1)'
  };
  color: ${({ theme, type }) =>
    type === 'inclusion'
      ? theme.colors.status.success
      : theme.colors.status.error
  };
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  white-space: nowrap;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background-color: rgba(15, 23, 42, 0.7);
  border-radius: 1rem;
  border: 1px dashed ${({ theme }) => theme.colors.border};
`;

const EmptyStateText = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: 1rem;
  max-width: 500px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
`;

const Spinner = styled(motion.div)`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: ${({ theme }) => theme.colors.primary};
`;

// Add new styled components for list view
const PartnersList = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: 0.75rem;
  }
`;

const PartnerListItem = styled(motion.div)`
  display: flex;
  background-color: rgba(15, 23, 42, 0.7);
  border-radius: 1rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    border-color: rgba(99, 102, 241, 0.3);
  }

  @media (max-width: 480px) {
    flex-direction: column;
    padding: 1rem;
    align-items: center;
    text-align: center;
  }
`;

const PartnerLogo = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 1rem;
  background-color: rgba(30, 41, 59, 0.8);
  margin-right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.accent};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 480px) {
    width: 48px;
    height: 48px;
    margin-right: 0;
    margin-bottom: 0.75rem;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }
`;

const PartnerInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ScoreAndStatus = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-left: 1.25rem;
  gap: 0.5rem;
`;

const Score = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  font-weight: 950;
  font-size: 1.75rem;
  color: white;
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.2),
    0 0 0 2px rgba(255, 255, 255, 0.1) inset,
    0 0 20px rgba(255, 255, 255, 0.1) inset;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);

  ${({ score }) => {
    if (score === 0) return `background: rgba(0, 0, 0, 0.7);`;
    if (score >= 1 && score <= 2) return `background: rgba(255, 0, 0, 0.7);`;
    if (score > 2 && score <= 4) return `background: rgba(255, 215, 0, 0.7);`;
    if (score >= 5 && score <= 9) return `background: rgba(0, 255, 0, 0.7);`;
    if (score === 10) return `background: rgba(255, 165, 0, 0.7);`;
    return `background: rgba(255, 255, 255, 0.7);`;
  }}
`;

const PartnerStatus = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  background-color: ${({ theme }) => theme.colors.status.success}20;
  color: ${({ theme }) => theme.colors.status.success};
`;

const ViewToggle = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-left: auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    margin-left: 0;
    width: 100%;
  }
`;

const ToggleButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: ${({ active, theme }) => active ? theme.colors.primary : 'rgba(15, 23, 42, 0.7)'};
  color: ${({ active }) => active ? 'white' : 'rgba(255, 255, 255, 0.7)'};
  border: 1px solid ${({ active, theme }) => active ? theme.colors.primary : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ active, theme }) => active ? theme.colors.primary : 'rgba(30, 41, 59, 0.8)'};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex: 1;
  }
`;

const CurrentPartnersPage = () => {
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('list'); // Default to list view

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/current-partners');
        setPartners(response.data.current_partners);
        setFilteredPartners(response.data.current_partners);
        setCategories(response.data.metadata.categories);
      } catch (err) {
        console.error('Failed to load current partners:', err);
        setError('Failed to load current partners. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  useEffect(() => {
    // Filter partners based on search term and category
    let filtered = [...partners];

    if (selectedCategory) {
      filtered = filtered.filter(partner =>
        partner.category && partner.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(partner =>
        partner.name.toLowerCase().includes(term) ||
        (partner.description && partner.description.toLowerCase().includes(term))
      );
    }

    setFilteredPartners(filtered);
  }, [searchTerm, selectedCategory, partners]);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Generate a logo URL based on company name
  const getLogoUrl = (name) => {
    if (!name) return null;

    // Convert name to domain-like string
    const domain = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
    return `https://img.logo.dev/${domain}?token=pk_TCK5i8rzR92YmS65BY2fgQ&retina=true`;
  };

  // Get initials from company name
  const getInitials = (name) => {
    if (!name) return '';

    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  if (loading) {
    return (
      <>
        <AnimatedBackground
          animate={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          }}
          transition={{ duration: 0.8 }}
        />
        <PageContainer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
        <Header>
          <Title>Current Partners</Title>
        </Header>
        <LoadingContainer>
          <Spinner
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </LoadingContainer>
      </PageContainer>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AnimatedBackground
          animate={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          }}
          transition={{ duration: 0.8 }}
        />
        <PageContainer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
        <Header>
          <Title>Current Partners</Title>
        </Header>
        <EmptyState>
          <EmptyStateText>{error}</EmptyStateText>
        </EmptyState>
      </PageContainer>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground
        animate={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        }}
        transition={{ duration: 0.8 }}
      />
      <PageContainer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
      <Header>
        <Title>Current Partners</Title>
        <ControlsContainer>
          <SearchInput>
            <MagnifyingGlass size={18} />
            <input
              type="text"
              placeholder="Search partners..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </SearchInput>
          <Select value={selectedCategory} onChange={handleCategoryChange}>
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
          <ViewToggle>
            <ToggleButton
              active={viewMode === 'list'}
              onClick={() => handleViewModeChange('list')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <List size={20} weight="bold" />
              List
            </ToggleButton>
            <ToggleButton
              active={viewMode === 'grid'}
              onClick={() => handleViewModeChange('grid')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <GridFour size={20} weight="bold" />
              Grid
            </ToggleButton>
          </ViewToggle>
        </ControlsContainer>
      </Header>

      {filteredPartners.length === 0 ? (
        <EmptyState>
          <Buildings size={48} weight="bold" color="rgba(99, 102, 241, 0.7)" />
          <EmptyStateText>
            {searchTerm || selectedCategory
              ? "No partners found matching your search criteria."
              : "No current partners found."}
          </EmptyStateText>
        </EmptyState>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <PartnersGrid
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.05
                  }
                },
                hidden: {}
              }}
            >
              {filteredPartners.map((partner, index) => (
                <PartnerCard
                  key={partner.name}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.3
                      }
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <PartnerHeader>
                    <LogoContainer>
                      {getLogoUrl(partner.name) ? (
                        <img src={getLogoUrl(partner.name)} alt={`${partner.name} logo`} />
                      ) : (
                        <Buildings size={24} weight="bold" />
                      )}
                    </LogoContainer>
                    <PartnerName>{partner.name}</PartnerName>
                  </PartnerHeader>
                  <PartnerBody>
                    <Category>{partner.category}</Category>
                    <Description>{partner.description}</Description>
                    <InclusionsExclusions>
                      {partner.inclusions && partner.inclusions.length > 0 && (
                        <>
                          <SectionTitle>Inclusions</SectionTitle>
                          <TagList>
                            {partner.inclusions.map((item, i) => (
                              <Tag key={`inclusion-${i}`} type="inclusion">{item}</Tag>
                            ))}
                          </TagList>
                        </>
                      )}
                      {partner.exclusions && partner.exclusions.length > 0 && (
                        <>
                          <SectionTitle>Exclusions</SectionTitle>
                          <TagList>
                            {partner.exclusions.map((item, i) => (
                              <Tag key={`exclusion-${i}`} type="exclusion">{item}</Tag>
                            ))}
                          </TagList>
                        </>
                      )}
                    </InclusionsExclusions>
                  </PartnerBody>
                </PartnerCard>
              ))}
            </PartnersGrid>
          ) : (
            <PartnersList
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.05
                  }
                },
                hidden: {}
              }}
            >
              {filteredPartners.map((partner, index) => (
                <PartnerListItem
                  key={partner.name}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.3
                      }
                    }
                  }}
                  whileHover={{ scale: 1.01 }}
                >
                  <PartnerLogo>
                    {getLogoUrl(partner.name) ? (
                      <img src={getLogoUrl(partner.name)} alt={`${partner.name} logo`} />
                    ) : (
                      getInitials(partner.name)
                    )}
                  </PartnerLogo>
                  <PartnerInfo>
                    <PartnerName>{partner.name}</PartnerName>
                    <Description>{partner.description}</Description>
                  </PartnerInfo>
                  <ScoreAndStatus>
                    <Score score={partner.partnership_score || 7}>
                      {Math.round(partner.partnership_score || 7)}
                    </Score>
                    <PartnerStatus>
                      Compatible
                    </PartnerStatus>
                  </ScoreAndStatus>
                </PartnerListItem>
              ))}
            </PartnersList>
          )}
        </>
      )}
    </PageContainer>
    </>
  );
};

export default CurrentPartnersPage;
