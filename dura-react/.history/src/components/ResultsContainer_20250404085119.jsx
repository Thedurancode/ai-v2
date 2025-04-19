import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import Tabs, { TabPane } from './Tabs';
import CompanyCard from './CompanyCard';
import { GridFour, List, Check, XCircle, Buildings, Link } from '@phosphor-icons/react';
import { getLogoUrl, getDescription, getInitials } from '../utils/companyUtils'; // Import utils

const Container = styled(motion.div)`
  background-color: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 1.25rem;
  padding: 2.5rem;
  margin: 2rem 0;
  position: relative;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  width: 100%;
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
  
  &:hover {
    box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.2), 0 10px 15px -6px rgba(0, 0, 0, 0.15);
  }
  
  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
    border-radius: 1rem;
  }
`;

const IndustryHeader = styled.div`
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const ViewToggle = styled.div`
  display: flex;
  background-color: rgba(15, 23, 42, 0.7);
  border-radius: 1rem;
  overflow: hidden;
  margin-left: ${({ theme }) => theme.spacing.md};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 768px) {
    margin-top: ${({ theme }) => theme.spacing.md};
    margin-left: 0;
  }
`;

const ToggleButton = styled(motion.button)`
  background-color: ${({ active }) => 
    active ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' : 'transparent'};
  background: ${({ active }) => 
    active ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' : 'transparent'};
  color: ${({ active }) => 
    active ? 'white' : 'rgba(255, 255, 255, 0.6)'};
  border: none;
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  
  &:hover {
    background-color: ${({ active }) => 
      active ? '' : 'rgba(255, 255, 255, 0.05)'};
    color: ${({ active }) => 
      active ? 'white' : 'rgba(255, 255, 255, 0.9)'};
  }
`;

const IndustryTitle = styled(motion.h2)`
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
`;

const IndustryDescription = styled(motion.p)`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.125rem;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const CompaniesGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
`;

const CompaniesList = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const CompanyListItem = styled(motion.div)`
  display: flex;
  background-color: rgba(15, 23, 42, 0.7);
  border-radius: 1rem;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    border-color: rgba(99, 102, 241, 0.3);
  }
`;

const CompanyLogo = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 1rem;
  background-color: rgba(30, 41, 59, 0.8);
  margin-right: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.accent};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }
`;

const CompanyInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const CompanyName = styled.h3`
  font-size: 1.125rem;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
`;

const CompanyDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
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
    if (score === 0) return `background: #000000;`;
    if (score >= 1 && score <= 2) return `background: #FF0000;`;
    if (score > 2 && score <= 4) return `background: #FFD700;`; // Darker gold yellow
    if (score >= 5 && score <= 9) return `background: #00FF00;`; // Street light green
    if (score === 10) return `background: #FFA500;`; // Orange fire
    return `background: #FFFFFF;`;
  }}
`;

const CompetitionStatus = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  
  ${({ $hasCompetition, theme }) => $hasCompetition 
    ? `
      background-color: ${theme.colors.status.error}20;
      color: ${theme.colors.status.error};
    `
    : `
      background-color: ${theme.colors.status.success}20;
      color: ${theme.colors.status.success};
    `
  }
`;

const AnalysisContent = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  line-height: 1.8;
`;

const AnalysisSection = styled(motion.div)`
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: rgba(15, 23, 42, 0.7);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const AnalysisTitle = styled.h3`
  font-size: 1.25rem;
  color: #ffffff;
  margin-bottom: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AnalysisParagraph = styled.p`
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.7);
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SourcesContent = styled.div`
  color: #ffffff;
  font-size: 1rem;
`;

const SourceItem = styled(motion.div)`
  padding: 1.25rem;
  background-color: rgba(15, 23, 42, 0.7);
  border-radius: 1rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    border-color: rgba(99, 102, 241, 0.3);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SourceTitle = styled.h4`
  font-size: 1.125rem;
  color: #ffffff;
  margin-bottom: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SourceUrl = styled.a`
  color: #3b82f6;
  display: block;
  margin-bottom: 0.75rem;
  word-break: break-all;
  text-decoration: none;
  font-size: 0.875rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const SourceExcerpt = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
`;

const NoResults = styled(motion.div)`
  text-align: center;
  padding: 3rem 2rem;
`;

const NoResultsTitle = styled.h3`
  font-size: 1.5rem;
  color: #ffffff;
  margin-bottom: 1rem;
`;

const NoResultsText = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.125rem;
`;

// Divider styled component
const Divider = styled(motion.div)`
  margin: 2rem 0 1.25rem 0;
  padding: 1rem 1.25rem;
  background-color: rgba(15, 23, 42, 0.7);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  gap: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const ResultsContainer = ({ results, onSelectCompany }) => {
  const [viewMode, setViewMode] = useState('list'); // Default to list view
  
  if (!results) return null;

  const { industry, companies, analysis, sources, search_results } = results;
  
  // Use search_results as sources if sources is not available
  const sourcesData = sources || search_results || [];

  // First separate compatible and conflicting companies
  const compatibleCompanies = (companies || [])
    .filter(company => !company.has_competition)
    .sort((a, b) => {
      const scoreA = parseFloat(a.partnership_score) || 0;
      const scoreB = parseFloat(b.partnership_score) || 0;
      return scoreB - scoreA; // Highest score first
    });
  
  const conflictingCompanies = (companies || [])
    .filter(company => company.has_competition)
    .sort((a, b) => {
      const scoreA = parseFloat(a.partnership_score) || 0;
      const scoreB = parseFloat(b.partnership_score) || 0;
      return scoreB - scoreA; // Highest score first
    });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        staggerChildren: 0.07
      }
    }
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    }
  };

  // Function to format analysis text with sections
  const renderAnalysisContent = () => {
    if (!analysis || !analysis.content) {
      return <AnalysisParagraph>No analysis available.</AnalysisParagraph>;
    }

    // Handle either object structure or basic string
    if (typeof analysis.content === 'object') {
      return Object.entries(analysis.content).map(([sectionTitle, content]) => (
        <AnalysisSection key={sectionTitle}>
          <AnalysisTitle>{sectionTitle}</AnalysisTitle>
          {typeof content === 'string' ? (
            <AnalysisParagraph>{content}</AnalysisParagraph>
          ) : (
            Object.entries(content).map(([subTitle, text], index) => (
              <div key={index}>
                <h4>{subTitle}</h4>
                <AnalysisParagraph>{text}</AnalysisParagraph>
              </div>
            ))
          )}
        </AnalysisSection>
      ));
    }

    // Handle string content
    return <AnalysisParagraph>{analysis.content}</AnalysisParagraph>;
  };
  // Note: getLogoUrl and getDescription are now imported from utils

  // Function to get the best available description (Now imported)
  // const getDescription = (company) => { ... };

  // Function to get the best available logo (Now imported)
  // const getLogoUrl = (company) => { ... };



















  // Render companies in the selected view mode
  const renderCompanies = (companyList, index) => {
    if (viewMode === 'grid') {
      return (
        <CompaniesGrid key={index}>
          {companyList.map((company, idx) => (
            <CompanyCard 
              key={idx} 
              company={{...company, id: idx}}
              onClick={() => onSelectCompany({...company, id: idx})}
            />
          ))}
        </CompaniesGrid>
      );
    } else {
      return (
        <CompaniesList key={index}>
          {companyList.map((company, idx) => (
            <CompanyListItem 
              key={idx}
              onClick={() => onSelectCompany({...company, id: idx})}
              variants={childVariants}
              whileHover={{ scale: 1.01 }}
            >
              <CompanyLogo>
                {getLogoUrl(company) ? (
                  <img src={getLogoUrl(company)} alt={`${company.name} logo`} />
                ) : (
                  getInitials(company.name) // Use utility for initials
                )}
              </CompanyLogo>
              <CompanyInfo>
                <CompanyName>{company.name}</CompanyName>
                <CompanyDescription title={getDescription(company)}> {/* Add title for full text on hover */}
                  {getDescription(company)}
                </CompanyDescription>
              </CompanyInfo>
              <ScoreAndStatus>
                <Score score={company.partnership_score}>
                  {Math.round(company.partnership_score)}
                </Score>
                <CompetitionStatus $hasCompetition={company.has_competition}>
                  {company.has_competition ? 'Conflicts' : 'Compatible'}
                </CompetitionStatus>
              </ScoreAndStatus>
            </CompanyListItem>
          ))}
        </CompaniesList>
      );
    }
  };

  return (
    <Container
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Tabs defaultTab="Companies">
        <TabPane label="Companies">
          <motion.div variants={childVariants}>
            <IndustryHeader>
              <HeaderContent>
                <IndustryTitle
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.span
                    animate={{ rotate: [0, 5, 0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                  >
                    <Buildings size={28} weight="fill" />
                  </motion.span>
                  {industry || 'Search Results'}
                </IndustryTitle>
                <IndustryDescription
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {companies && companies.length 
                    ? `Found ${companies.length} potential partners in ${industry}`
                    : 'No companies found for this industry'}
                </IndustryDescription>
              </HeaderContent>
              <ViewToggle>
                <ToggleButton 
                  active={viewMode === 'list'} 
                  onClick={() => setViewMode('list')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <List size={20} weight="bold" />
                  List
                </ToggleButton>
                <ToggleButton 
                  active={viewMode === 'grid'} 
                  onClick={() => setViewMode('grid')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <GridFour size={20} weight="bold" />
                  Grid
                </ToggleButton>
              </ViewToggle>
            </IndustryHeader>
            
            {compatibleCompanies.length > 0 && (
              <>
                <Divider
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Check size={22} weight="bold" color="#4CAF50" />
                  Compatible Partners ({compatibleCompanies.length})
                </Divider>
                {renderCompanies(compatibleCompanies, 'compatible')}
              </>
            )}
            
            {conflictingCompanies.length > 0 && (
              <>
                <Divider
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <XCircle size={22} weight="bold" color="#F44336" />
                  Potential Conflicts ({conflictingCompanies.length})
                </Divider>
                {renderCompanies(conflictingCompanies, 'conflicting')}
              </>
            )}
            
            {companies && companies.length === 0 && (
              <NoResults
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <NoResultsTitle>No results found</NoResultsTitle>
                <NoResultsText>Try another search term or industry.</NoResultsText>
              </NoResults>
            )}
          </motion.div>
        </TabPane>
        
        <TabPane label="Analysis">
          <AnalysisContent>
            {renderAnalysisContent()}
          </AnalysisContent>
        </TabPane>
        
        <TabPane label="Sources">
          <SourcesContent>
            {sourcesData && sourcesData.length > 0 ? (
              sourcesData.map((source, index) => (
                <SourceItem 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.01 }}
                >
                  <SourceTitle>
                    <Link size={18} weight="bold" />
                    {source.title || 'Unnamed Source'}
                  </SourceTitle>
                  {source.url && (
                    <SourceUrl href={source.url} target="_blank" rel="noopener noreferrer">
                      {source.url}
                    </SourceUrl>
                  )}
                  {(source.excerpt || source.text) && (
                    <SourceExcerpt>{source.excerpt || source.text}</SourceExcerpt>
                  )}
                </SourceItem>
              ))
            ) : (
              <AnalysisParagraph>No sources available.</AnalysisParagraph>
            )}
          </SourcesContent>
        </TabPane>
      </Tabs>
    </Container>
  );
};

export default ResultsContainer;
