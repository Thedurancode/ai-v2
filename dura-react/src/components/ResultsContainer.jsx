import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { m as motion, AnimatePresence } from 'framer-motion';
import Tabs, { TabPane } from './Tabs';
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
    padding: 1.5rem 1rem;
    border-radius: 1rem;
    margin: 1rem 0;
    max-width: 100%;
  }

  @media (max-width: 480px) {
    padding: 1.25rem 0.75rem;
    max-width: 100%;
    margin: 0.5rem 0;
    border-radius: 0.75rem;
  }
`;

const IndustryHeader = styled.div`
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
    margin-bottom: 1.5rem;
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
    display: none;
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

  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
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
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
`;

const CompaniesList = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;

  @media (max-width: 768px) {
    gap: 0.75rem;
  }
`;

const CompanyListItem = styled(motion.div)`
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

const CompanyLogo = styled.div`
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

// Add a custom card component for the grid view
const GridCardItem = styled(motion.div)`
  display: flex;
  flex-direction: column;
  background-color: rgba(15, 23, 42, 0.7);
  border-radius: 1rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  height: 100%;
  min-height: 180px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    border-color: rgba(99, 102, 241, 0.3);
  }

  @media (max-width: 480px) {
    min-height: 160px;
    padding: 0.75rem;
  }
`;

const GridLogo = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 0.75rem;
  background-color: rgba(30, 41, 59, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.accent};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 0.75rem;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
  }
`;

const GridInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const GridName = styled.h3`
  font-size: 1rem;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
  font-weight: 600;

  @media (max-width: 480px) {
    font-size: 0.875rem;
  }
`;

const GridDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.75rem;
  margin: 0 0 auto 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
`;

const GridFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
`;

const GridScore = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.875rem;
  color: white;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);

  ${({ score }) => {
    if (score === 0) return `background: rgba(0, 0, 0, 0.7);`;
    if (score >= 1 && score <= 2) return `background: rgba(255, 0, 0, 0.7);`;
    if (score > 2 && score <= 4) return `background: rgba(255, 215, 0, 0.7);`;
    if (score >= 5 && score <= 9) return `background: rgba(0, 255, 0, 0.7);`;
    if (score === 10) return `background: rgba(255, 165, 0, 0.7);`;
    return `background: rgba(255, 255, 255, 0.7);`;
  }}
`;

const GridStatus = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.625rem;
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

const MobileFilterToggle = styled.div`
  display: none;
  width: 100%;
  background-color: rgba(15, 23, 42, 0.7);
  border-radius: 1rem;
  overflow: hidden;
  margin: 1rem 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 768px) {
    display: flex;
  }
`;

const FilterButton = styled(motion.button)`
  flex: 1;
  background-color: ${({ active }) =>
    active ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' : 'transparent'};
  background: ${({ active }) =>
    active ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' : 'transparent'};
  color: ${({ active }) =>
    active ? 'white' : 'rgba(255, 255, 255, 0.6)'};
  border: none;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.875rem;

  &:hover {
    background-color: ${({ active }) =>
      active ? '' : 'rgba(255, 255, 255, 0.05)'};
    color: ${({ active }) =>
      active ? 'white' : 'rgba(255, 255, 255, 0.9)'};
  }
`;

const ResultsContainer = ({ results, onSelectCompany }) => {
  const [viewMode, setViewMode] = useState('list'); // Default to list view
  const [activeFilter, setActiveFilter] = useState('compatible'); // Default to compatible companies
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  // Store the current results to prevent disappearing on view changes
  const [currentResults, setCurrentResults] = useState(null);
  // Track the direction of filter change for animations
  const [filterDirection, setFilterDirection] = useState(0);

  // Set viewMode based on screen size when component mounts
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Don't change view mode automatically to prevent data loss
      if (!viewMode) {
        setViewMode(mobile ? 'grid' : 'list');
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Update current results when results prop changes
  useEffect(() => {
    if (results) {
      setCurrentResults(results);
    }
  }, [results]);

  // Use currentResults instead of direct results prop
  const displayResults = currentResults || results;

  if (!displayResults) return null;

  const { industry, companies, analysis, sources, search_results } = displayResults;

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
        stiffness: 260,
        damping: 25,
        staggerChildren: 0.07,
        duration: 0.4
      }
    }
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 260, damping: 25, duration: 0.3 }
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.2 }
    }
  };

  // Mobile filter transition variants
  const filterTransitionVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (direction) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
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

  // Updated render function for companies
  const renderCompanies = (companyList, index) => {
    // Check if this is a mobile view rendering
    const isMobileView = index.includes('mobile');

    if (viewMode === 'grid') {
      return (
        <CompaniesGrid
          key={index}
          initial={isMobileView ? false : "hidden"}
          animate="visible"
          exit={isMobileView ? "exit" : undefined}
        >
          {companyList.map((company, idx) => (
            <GridCardItem
              key={idx}
              variants={childVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // Format the company data to match what CompanyModal expects
                const companyData = {
                  ...company,
                  id: company.id || `search-result-${idx}`, // Use real ID if available, otherwise create a unique ID
                  name: company.name,
                  description: company.description || '',
                  partnership_score: company.partnership_score || 0,
                  logo: getLogoUrl(company),
                  industry: company.industry || ''
                };
                onSelectCompany(companyData);
              }}
            >
              <GridLogo>
                {getLogoUrl(company) ? (
                  <img src={getLogoUrl(company)} alt={`${company.name} logo`} />
                ) : (
                  getInitials(company.name)
                )}
              </GridLogo>
              <GridInfo>
                <GridName>{company.name}</GridName>
                <GridDescription title={getDescription(company)}>
                  {getDescription(company)}
                </GridDescription>
              </GridInfo>
              <GridFooter>
                <GridStatus $hasCompetition={company.has_competition}>
                  {company.has_competition ? 'Conflicts' : 'Compatible'}
                </GridStatus>
                <GridScore score={company.partnership_score}>
                  {Math.round(company.partnership_score)}
                </GridScore>
              </GridFooter>
            </GridCardItem>
          ))}
        </CompaniesGrid>
      );
    } else {
      return (
        <CompaniesList
          key={index}
          initial={isMobileView ? false : "hidden"}
          animate="visible"
          exit={isMobileView ? "exit" : undefined}
        >
          {companyList.map((company, idx) => (
            <CompanyListItem
              key={idx}
              onClick={() => {
                // Format the company data to match what CompanyModal expects
                const companyData = {
                  ...company,
                  id: company.id || `search-result-${idx}`, // Use real ID if available, otherwise create a unique ID
                  name: company.name,
                  description: company.description || '',
                  partnership_score: company.partnership_score || 0,
                  logo: getLogoUrl(company),
                  industry: company.industry || ''
                };
                onSelectCompany(companyData);
              }}
              variants={childVariants}
              whileHover={{ scale: 1.01 }}
            >
              <CompanyLogo>
                {getLogoUrl(company) ? (
                  <img src={getLogoUrl(company)} alt={`${company.name} logo`} />
                ) : (
                  getInitials(company.name)
                )}
              </CompanyLogo>
              <CompanyInfo>
                <CompanyName>{company.name}</CompanyName>
                <CompanyDescription title={getDescription(company)}>
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

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  return (
    <Container
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.4 }}
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
            </IndustryHeader>

            {/* Mobile filter toggle */}
            {companies && companies.length > 0 && (
              <MobileFilterToggle>
                <FilterButton
                  active={activeFilter === 'compatible'}
                  onClick={() => {
                    // Only change if not already active to prevent unnecessary re-renders
                    if (activeFilter !== 'compatible') {
                      setFilterDirection(-1); // Moving left to compatible
                      setActiveFilter('compatible');
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  layout
                >
                  <Check size={16} weight="bold" />
                  Compatible ({compatibleCompanies.length})
                </FilterButton>
                <FilterButton
                  active={activeFilter === 'conflicting'}
                  onClick={() => {
                    // Only change if not already active to prevent unnecessary re-renders
                    if (activeFilter !== 'conflicting') {
                      setFilterDirection(1); // Moving right to conflicts
                      setActiveFilter('conflicting');
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  layout
                >
                  <XCircle size={16} weight="bold" />
                  Conflicts ({conflictingCompanies.length})
                </FilterButton>
              </MobileFilterToggle>
            )}

            {/* Desktop view - show both compatible and conflicting */}
            {!isMobile && compatibleCompanies.length > 0 && (
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

            {!isMobile && conflictingCompanies.length > 0 && (
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

            {/* Mobile view - show either compatible or conflicting based on filter */}
            {isMobile && (
              <AnimatePresence mode="wait" initial={false} custom={filterDirection}>
                {activeFilter === 'compatible' && compatibleCompanies.length > 0 ? (
                  <motion.div
                    key="compatible-mobile"
                    custom={filterDirection}
                    variants={filterTransitionVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    style={{ width: '100%' }}
                  >
                    {renderCompanies(compatibleCompanies, 'compatible-mobile')}
                  </motion.div>
                ) : activeFilter === 'conflicting' && conflictingCompanies.length > 0 ? (
                  <motion.div
                    key="conflicting-mobile"
                    custom={filterDirection}
                    variants={filterTransitionVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    style={{ width: '100%' }}
                  >
                    {renderCompanies(conflictingCompanies, 'conflicting-mobile')}
                  </motion.div>
                ) : null}
              </AnimatePresence>
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
