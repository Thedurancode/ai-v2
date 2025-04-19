import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  X, Buildings, Globe, MapPin,
  Users, CalendarBlank, Briefcase,
  Star, Rocket, UsersThree,
  ChartLine, Handshake, Trophy, Info, Brain, MagnifyingGlass, SpinnerGap,
  CloudArrowUp, Lightning, ArrowClockwise, Article, ChartBar, Graph,
  FilePdf
} from '@phosphor-icons/react';
import ReactMarkdown from 'react-markdown';
import { useFavorites } from '../context/FavoritesContext';
import { useResearch } from '../context/ResearchContext';
import { formatPerplexityResponse } from '../services/partnerApi.js';
import { generateAndDownloadPDF } from '../utils/reactPdfUtils.js';

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  50% {
    transform: scale(1.06);
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
  100% {
    transform: scale(1);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

// Shared styles
const glassEffect = css`
  background-color: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

// Removed unused animation

// Removed unused style

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 0;
    align-items: flex-start;
  }
`;

const ModalContainer = styled.div`
  ${glassEffect}
  border-radius: 1.5rem;
  width: 100%;
  max-width: 1000px;
  max-height: 85vh; /* Slightly reduced to ensure it fits on most screens */
  overflow-y: auto;
  position: relative;
  padding-bottom: 2rem; /* Add padding at the bottom for better spacing */

  @media (max-width: 768px) {
    max-height: 100vh;
    border-radius: 0;
    height: 100%;
    padding-bottom: 1rem;
  }

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.3);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.5);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.7);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: rgba(15, 23, 42, 0.5);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  z-index: 10;

  &:hover {
    background: rgba(99, 102, 241, 0.7);
  }
`;

const ModalHeader = styled.div`
  padding: 2rem 2rem 1.5rem;
  position: relative;

  @media (max-width: 768px) {
    padding: 1.5rem 1.5rem 1rem;
  }
`;

const ModalCompanyHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const CompanyInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const LogoContainer = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 1rem;
  background-color: rgba(15, 23, 42, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
  }
`;

const CompanyDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CompanyName = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const CompanyMeta = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    gap: 0.75rem;
  }
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);

  svg {
    color: rgba(99, 102, 241, 0.8);
  }
`;

const HeaderScoreCircle = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    margin-top: 0.5rem;
  }
`;

const ScoreCircle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  font-weight: 950;
  font-size: 2.5rem;
  color: white;
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.2),
    0 0 0 2px rgba(255, 255, 255, 0.1) inset,
    0 0 20px rgba(255, 255, 255, 0.1) inset;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  animation: ${pulseAnimation} 3s infinite ease-in-out;

  ${({ score }) => {
    if (score >= 8) return `background: linear-gradient(135deg, #03dac6 0%, #00b8a9 100%);`;
    if (score >= 6) return `background: linear-gradient(135deg, #C8102E 0%, #e72b3e 100%);`;
    if (score >= 4) return `background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%);`;
    return `background: linear-gradient(135deg, #F44336 0%, #e53935 100%);`;
  }}

  @media (max-width: 768px) {
    width: 80px;
    height: 80px;
    font-size: 2rem;
  }
`;

const ScoreValue = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: center;
`;

const ScoreLabel = styled.span`
  font-size: 1rem;
  font-weight: 500;
  margin-left: 0.25rem;
  opacity: 0.8;
`;

const ScoreCategory = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ score }) => {
    if (score >= 8) return '#03dac6';
    if (score >= 6) return '#C8102E';
    if (score >= 4) return '#ffc107';
    return '#F44336';
  }};

  @media (max-width: 768px) {
    font-size: 0.875rem;
  }
`;

// Research Section Components
const ResearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ResearchMetadata = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  padding: 0.75rem 1rem;
  background: rgba(30, 41, 59, 0.3);
  border-radius: 0.75rem;
  border: 1px solid rgba(99, 102, 241, 0.15);
`;

const MetadataItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: rgba(99, 102, 241, 1);
  }

  strong {
    font-weight: 600;
    color: white;
  }
`;

const ResearchContent = styled.div`
  background: rgba(15, 23, 42, 0.3);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const ResearchSection = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${props => props.isLast ? '0' : '1.5rem'};
  border-bottom: ${props => props.isLast ? 'none' : '1px solid rgba(255, 255, 255, 0.08)'};
  padding-bottom: ${props => props.isLast ? '0' : '1.5rem'};
`;

const SectionHeading = styled.h4`
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const SectionNumber = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.8) 0%, rgba(79, 82, 221, 0.9) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: bold;
  color: white;
`;

const SectionContent = styled.div`
  font-size: 0.9375rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);

  p {
    margin-bottom: 1rem;
  }

  ul, ol {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
  }

  li {
    margin-bottom: 0.5rem;
  }

  strong, b {
    color: white;
    font-weight: 600;
  }

  em, i {
    font-style: italic;
    opacity: 0.9;
  }

  h1, h2, h3, h4, h5, h6 {
    margin-top: 1.5rem;
    margin-bottom: 1rem;
    color: white;
    font-weight: 600;
  }

  a {
    color: rgba(99, 102, 241, 0.9);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  blockquote {
    border-left: 3px solid rgba(99, 102, 241, 0.6);
    padding-left: 1rem;
    margin-left: 0;
    margin-right: 0;
    font-style: italic;
    color: rgba(255, 255, 255, 0.8);
  }

  code {
    background: rgba(0, 0, 0, 0.2);
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.875rem;
  }

  pre {
    background: rgba(0, 0, 0, 0.2);
    padding: 1rem;
    border-radius: 5px;
    overflow-x: auto;
    margin-bottom: 1rem;

    code {
      background: transparent;
      padding: 0;
    }
  }

  hr {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin: 1.5rem 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;

    th, td {
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.5rem;
      text-align: left;
    }

    th {
      background: rgba(30, 41, 59, 0.5);
      color: white;
    }

    tr:nth-child(even) {
      background: rgba(30, 41, 59, 0.3);
    }
  }
`;

const ResearchFooter = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 1rem;
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const AiBadge = styled.div`
  background: rgba(99, 102, 241, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  color: rgba(99, 102, 241, 0.9);
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const SpinnerIcon = styled(SpinnerGap)`
  animation: ${spin} 1s linear infinite;
`;

// Removed unused ModuleButtonsContainer

// Removed unused ModuleButton

const ModalBody = styled.div`
  padding: 0 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  /* Add a subtle divider between sections */
  & > *:not(:last-child)::after {
    content: '';
    position: absolute;
    bottom: -0.75rem;
    left: 10%;
    right: 10%;
    height: 1px;
    background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%);
  }

  @media (max-width: 768px) {
    padding: 0 1.5rem 1.5rem;
    gap: 1rem;

    & > *:not(:last-child)::after {
      bottom: -0.5rem;
    }
  }
`;

const ModalSection = styled.div`
  ${glassEffect}
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: ${css`${fadeIn} 0.5s ease forwards, ${slideUp} 0.5s ease forwards`};
  margin-bottom: 1.5rem; /* Add spacing between sections */
  position: relative; /* For section dividers */

  &:last-child {
    margin-bottom: 0; /* Remove margin from last section */
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
    margin-bottom: 1rem;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem; /* Slightly larger for better section separation */
  font-weight: 600;
  color: white;
  margin: 0 0 0.75rem 0; /* Add a bit of bottom margin */
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.5rem; /* Add padding at bottom */
  border-bottom: 1px solid rgba(255, 255, 255, 0.1); /* Add subtle border */

  svg {
    color: rgba(99, 102, 241, 0.8);
    font-size: 1.25rem; /* Slightly larger icons */
  }

  @media (max-width: 768px) {
    font-size: 1.125rem;
  }
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const DetailLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
`;

const DetailValue = styled.div`
  font-size: 1rem;
  font-weight: 500;
  color: white;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    gap: 0.75rem;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${({ variant }) =>
    variant === 'primary' ? 'rgba(99, 102, 241, 0.8)' : 'rgba(15, 23, 42, 0.7)'};
  color: white;
  border: 1px solid ${({ variant }) =>
    variant === 'primary' ? 'rgba(99, 102, 241, 0.8)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 0.75rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ variant }) =>
      variant === 'primary' ? 'rgba(99, 102, 241, 0.9)' : 'rgba(30, 41, 59, 0.8)'};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 0.6rem 1rem;
    font-size: 0.875rem;
  }
`;

const OpportunityItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background-color: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);

  svg {
    color: rgba(99, 102, 241, 0.8);
    flex-shrink: 0;
    margin-top: 0.25rem;
  }
`;

const OpportunityText = styled.div`
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
`;

const PartnerDetailModal = ({ isOpen, onClose, partner }) => {
  const { favorites, toggleFavorite } = useFavorites();
  const {
    partnerResearch,
    getPartnerResearchData
  } = useResearch();
  // No longer using activeModule state since all sections will be displayed at once
  const [researchData, setResearchData] = useState(null);
  const [researchSections, setResearchSections] = useState([]);
  const [isLoadingResearch, setIsLoadingResearch] = useState(false);
  const [researchError, setResearchError] = useState(null);

  const isFavorite = (partner) => {
    return favorites.some(fav =>
      fav.id === partner.id ||
      (fav.name === partner.name && fav.description === partner.description)
    );
  };

  // Get score category text
  const getScoreCategory = (score) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Average';
    return 'Low';
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Generate a logo URL based on company name
  const getLogoUrl = (partner) => {
    if (partner.logo) return partner.logo;
    if (partner.company_logo) return partner.company_logo;

    // Default logo placeholder if no logo exists
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      partner.name || 'Unknown'
    )}&background=random&color=fff&size=128`;
  };

  // Check if we have research data in context when partner changes
  useEffect(() => {
    if (isOpen && partner && partner.id) {
      // Check if we have research data in context
      const existingResearch = partnerResearch[partner.id];
      if (existingResearch) {
        setResearchData(existingResearch);

        // Format the research data into sections
        if (existingResearch.data) {
          const sections = formatPerplexityResponse(existingResearch.data);
          setResearchSections(sections);
        }
      }

      // Always load research data when modal opens
      loadResearchData();
    }
  }, [isOpen, partner, partnerResearch]);

  // Load research data from API
  const loadResearchData = async (forceRefresh = false) => {
    if (!partner || !partner.id) {
      setResearchError('Partner information is incomplete');
      return;
    }

    setIsLoadingResearch(true);
    setResearchError(null);

    console.log(`Loading research data for partner: ${partner.name}, force refresh: ${forceRefresh}`);

    try {
      // If partner already has research data, we can show a message
      if (partner.has_research) {
        console.log(`Partner ${partner.name} already has research from ${partner.research_source} on ${partner.research_date}`);
      }

      // Get research data from context/API with force refresh option
      const data = await getPartnerResearchData(partner, forceRefresh);

      if (data) {
        setResearchData(data);

        // Format the research data into sections
        if (typeof data.data === 'string') {
          const sections = formatPerplexityResponse(data.data);
          setResearchSections(sections);
        } else {
          setResearchSections([]);
          setResearchError('Unable to format research data');
        }
      } else {
        // If no data in context/API, we need to generate new research
        // This will be handled by the research button click
        if (!isLoadingResearch && !partner.has_research) {
          setResearchSections([]);
          setResearchError('No research data available. Click the button below to generate research.');
        }
      }
    } catch (error) {
      console.error('Error loading research data:', error);
      setResearchError(error.message || 'Failed to load research data');
    } finally {
      setIsLoadingResearch(false);
    }
  };

  // Generate new research data and save to Supabase
  const generateResearch = async () => {
    console.log('generateResearch called for partner:', partner);
    if (!partner || !partner.id) {
      console.error('Partner information is incomplete:', partner);
      setResearchError('Partner information is incomplete');
      return;
    }

    setIsLoadingResearch(true);
    setResearchError(null);
    console.log('Loading research data for partner:', partner.name);

    try {
      // Import the function directly to avoid any context issues
      const { getPerplexityPartnerResearch } = await import('../services/partnerApi.js');
      console.log('Imported getPerplexityPartnerResearch function');

      // Call the API directly
      console.log('Calling getPerplexityPartnerResearch with partner:', partner.name);
      const researchData = await getPerplexityPartnerResearch(partner);
      console.log('Research data received:', researchData);

      if (researchData) {
        // Save to Supabase first
        try {
          const supabaseResponse = await use_mcp_tool({
            server_name: 'github.com/supabase-community/supabase-mcp',
            tool_name: 'execute_sql',
            arguments: {
              project_id: 'YOUR_SUPABASE_PROJECT_ID', // Need to get this from user
              query: `
                INSERT INTO partner_research (partner_id, research_data, source, updated_at)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (partner_id) 
                DO UPDATE SET 
                  research_data = EXCLUDED.research_data,
                  source = EXCLUDED.source,
                  updated_at = EXCLUDED.updated_at
              `,
              params: [
                partner.id,
                JSON.stringify(researchData),
                researchData.source || 'perplexity',
                new Date().toISOString()
              ]
            }
          });
          console.log('Saved research to Supabase:', supabaseResponse);
        } catch (supabaseError) {
          console.error('Error saving to Supabase:', supabaseError);
          // Continue even if Supabase save fails
        }

        // Update the research data state
        setResearchData(researchData);
        console.log('Research data set to state');

        // Format the research data into sections
        let dataToFormat = researchData;
        if (typeof researchData === 'object' && researchData.data) {
          dataToFormat = researchData.data;
        }

        if (typeof dataToFormat === 'string') {
          console.log('Formatting research data');
          const sections = formatPerplexityResponse(dataToFormat);
          console.log('Formatted sections:', sections);
          setResearchSections(sections);
        } else {
          console.error('Unable to format research data:', dataToFormat);
          setResearchSections([]);
          setResearchError('Unable to format research data');
        }
      } else {
        console.error('No research data returned');
        throw new Error('Failed to generate research data');
      }
    } catch (error) {
      console.error('Error generating research:', error);
      setResearchError(error.message || 'Failed to generate research');
    } finally {
      setIsLoadingResearch(false);
      console.log('Research loading completed');
    }
  };

  const handleAction = (action) => {
    switch (action) {
      case 'toggle-favorite':
        toggleFavorite(partner);
        break;
      case 'research':
        if (!researchData) {
          loadResearchData();
        }
        break;
      case 'generate-research':
        generateResearch();
        break;
      case 'export-pdf':
        exportResearchToPDF();
        break;
      default:
        console.log(`Action ${action} not implemented yet`);
    }
  };

  // Export research to PDF using React PDF
  const exportResearchToPDF = async () => {
    try {
      if (!researchSections || researchSections.length === 0) {
        alert('No research data available to export. Please generate research first.');
        return;
      }

      console.log('Exporting research to PDF using React PDF...');
      await generateAndDownloadPDF(partner, researchSections);
      console.log('PDF export complete');
    } catch (error) {
      console.error('Error exporting research to PDF:', error);
      alert(`Failed to export research: ${error.message}`);
    }
  };

  // Render all sections individually
  const renderOverviewSection = () => {
    return (
          <ModalSection>
            <SectionTitle>
              <Info size={24} weight="fill" />
              Company Overview
            </SectionTitle>
            <DetailGrid>
              <DetailItem>
                <DetailLabel>Location</DetailLabel>
                <DetailValue>{partner.hq_location || partner.country || 'Unknown'}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Company Size</DetailLabel>
                <DetailValue>{partner.size_range || partner.employee_count || 'Unknown'}</DetailValue>
              </DetailItem>
              <DetailItem>
                <DetailLabel>Founded</DetailLabel>
                <DetailValue>{partner.founded_year_min || 'Unknown'}</DetailValue>
              </DetailItem>
            </DetailGrid>

            <DetailItem style={{ marginTop: '1rem' }}>
              <DetailLabel>Description</DetailLabel>
              <DetailValue style={{ lineHeight: '1.6' }}>{partner.description || 'No description available.'}</DetailValue>
            </DetailItem>

            {partner.website && (
              <ActionButton
                as="a"
                href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
              >
                <Globe size={18} weight="fill" />
                Visit Website
              </ActionButton>
            )}
          </ModalSection>
        );
  };

  const renderLeadershipSection = () => {
    return (
          <ModalSection>
            <SectionTitle>
              <UsersThree size={24} weight="fill" />
              Leadership Team
            </SectionTitle>

            {partner.leadership && (Array.isArray(partner.leadership) || typeof partner.leadership === 'object') ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Array.isArray(partner.leadership) ? (
                  // Handle array of leadership
                  partner.leadership.map((leader, index) => (
                    <DetailItem key={index}>
                      <DetailLabel>{leader.title || leader.position || 'Team Member'}</DetailLabel>
                      <DetailValue>{leader.name || (typeof leader === 'string' ? leader : JSON.stringify(leader))}</DetailValue>
                    </DetailItem>
                  ))
                ) : partner.key_executives ? (
                  // Handle key_executives object
                  Object.entries(partner.key_executives).map(([key, value], index) => (
                    <DetailItem key={index}>
                      <DetailLabel>{key.replace(/_/g, ' ')}</DetailLabel>
                      <DetailValue>{typeof value === 'string' ? value : JSON.stringify(value)}</DetailValue>
                    </DetailItem>
                  ))
                ) : (
                  // Handle generic object
                  Object.entries(partner.leadership).map(([key, value], index) => (
                    <DetailItem key={index}>
                      <DetailLabel>{key.replace(/_/g, ' ')}</DetailLabel>
                      <DetailValue>{typeof value === 'string' ? value : JSON.stringify(value)}</DetailValue>
                    </DetailItem>
                  ))
                )}
              </div>
            ) : (
              <DetailValue style={{ opacity: 0.7 }}>Leadership information not available.</DetailValue>
            )}
          </ModalSection>
        );
  };

  const renderResearchSection = () => {
    return (
          <ModalSection>
            <SectionTitle>
              <Brain size={24} weight="fill" />
              AI Research
            </SectionTitle>

            {isLoadingResearch ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3rem',
                  minHeight: '200px',
                  borderRadius: '1rem',
                  backgroundColor: 'rgba(30, 41, 59, 0.4)',
                  border: '2px dashed rgba(99, 102, 241, 0.3)'
                }}
              >
                <div
                  style={{
                    animation: `${spin} 2s linear infinite`,
                  }}
                >
                  <SpinnerGap size={40} weight="bold" style={{
                    color: 'rgba(99, 102, 241, 0.8)'
                  }} />
                </div>
                <div style={{
                  marginTop: '1.5rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '1.125rem',
                  fontWeight: '500'
                }}>
                  Generating AI Research...
                </div>
                <div style={{
                  marginTop: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.9375rem',
                  maxWidth: '80%',
                  textAlign: 'center'
                }}>
                  This may take a minute as we analyze company data, financials, and market opportunities.
                </div>
              </div>
            ) : researchError ? (
              <div
                style={{
                  padding: '1.5rem',
                  borderRadius: '1rem',
                  border: '2px dashed rgba(239, 68, 68, 0.3)',
                  backgroundColor: 'rgba(30, 41, 59, 0.4)',
                  color: 'rgba(239, 68, 68, 0.9)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}
              >
                <div style={{ marginBottom: '1rem', fontWeight: '500', fontSize: '1.125rem' }}>
                  Error loading research
                </div>
                <div style={{ marginBottom: '1.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>{researchError}</div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  {/* Refresh button */}
                  <button
                    onClick={() => loadResearchData(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      background: isLoadingResearch ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.2)',
                      border: '1px solid rgba(99, 102, 241, 0.5)',
                      borderRadius: '0.75rem',
                      color: isLoadingResearch ? 'rgba(255, 255, 255, 0.7)' : 'white',
                      fontSize: '0.9375rem',
                      fontWeight: '500',
                      cursor: isLoadingResearch ? 'not-allowed' : 'pointer',
                      opacity: isLoadingResearch ? 0.8 : 1
                    }}
                    disabled={isLoadingResearch}
                  >
                    {isLoadingResearch ? (
                      <>
                        <SpinnerIcon size={18} weight="bold" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <ArrowClockwise size={18} weight="bold" />
                        Refresh Data
                      </>
                    )}
                  </button>

                  {/* Generate new research button */}
                  <button
                    onClick={() => handleAction('generate-research')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      background: isLoadingResearch ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.5)',
                      borderRadius: '0.75rem',
                      color: isLoadingResearch ? 'rgba(255, 255, 255, 0.7)' : 'white',
                      fontSize: '0.9375rem',
                      fontWeight: '500',
                      cursor: isLoadingResearch ? 'not-allowed' : 'pointer',
                      opacity: isLoadingResearch ? 0.8 : 1
                    }}
                    disabled={isLoadingResearch}
                  >
                    {isLoadingResearch ? (
                      <>
                        <SpinnerIcon size={18} weight="bold" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Lightning size={18} weight="bold" />
                        Generate New Research
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : researchSections.length > 0 ? (
              <ResearchContainer>
                {/* Research metadata */}
                {researchData && researchData.source && researchData.updated_at && (
                  <ResearchMetadata>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <MetadataItem>
                          <Brain size={14} weight="fill" />
                          <span>Source: <strong>{researchData.source === 'perplexity' ? 'Perplexity AI' : researchData.source}</strong></span>
                        </MetadataItem>
                        <MetadataItem>
                          <CalendarBlank size={14} weight="fill" />
                          <span>Updated: <strong>{new Date(researchData.updated_at).toLocaleDateString()}</strong></span>
                        </MetadataItem>
                      </div>

                      {/* Refresh button */}
                      <button
                        onClick={() => {
                          // Force refresh the research data
                          loadResearchData(true);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.4rem 0.75rem',
                          background: isLoadingResearch ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.2)',
                          border: '1px solid rgba(99, 102, 241, 0.5)',
                          borderRadius: '0.5rem',
                          color: isLoadingResearch ? 'rgba(255, 255, 255, 0.7)' : 'white',
                          fontSize: '0.8125rem',
                          fontWeight: '500',
                          cursor: isLoadingResearch ? 'not-allowed' : 'pointer',
                          opacity: isLoadingResearch ? 0.8 : 1
                        }}
                        disabled={isLoadingResearch}
                      >
                        {isLoadingResearch ? (
                          <>
                            <SpinnerIcon size={14} weight="bold" />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <ArrowClockwise size={14} weight="bold" />
                            Refresh Data
                          </>
                        )}
                      </button>
                    </div>
                  </ResearchMetadata>
                )}

                <ResearchContent>
                {researchSections
                  .filter((section, index, self) => (
                    index === self.findIndex(s => s.heading === section.heading) && 
                    section.content && 
                    section.content.trim() !== ''
                  ))
                  .map((section, index) => {
                    // Determine which icon to use based on section heading
                    let SectionIcon = Info;
                    if (/overview|company|about/i.test(section.heading)) {
                        SectionIcon = Buildings;
                    } else if (/leadership|executive|management|team/i.test(section.heading)) {
                        SectionIcon = UsersThree;
                    } else if (/market|position|industry/i.test(section.heading)) {
                        SectionIcon = Graph;
                    } else if (/compet|rival/i.test(section.heading)) {
                        SectionIcon = Trophy;
                    } else if (/partner|strateg|opportunit/i.test(section.heading)) {
                        SectionIcon = Handshake;
                    } else if (/summary|analysis/i.test(section.heading)) {
                        SectionIcon = Article;
                    }

                    return section.content ? (
                      <ResearchSection
                        key={index}
                        isLast={index === researchSections.length - 1}
                      >
                        <SectionHeading>
                          <SectionNumber>{index + 1}</SectionNumber>
                          <SectionIcon size={18} weight="fill" style={{ color: 'rgba(99, 102, 241, 0.9)' }} />
                          {section.heading}
                        </SectionHeading>
                        <SectionContent>
                          <ReactMarkdown>
                            {section.content}
                          </ReactMarkdown>
                        </SectionContent>
                      </ResearchSection>
                    ) : null
                  })}
                </ResearchContent>

                <ResearchFooter>
                  <span>Research powered by</span>
                  <AiBadge>
                    <Brain size={12} weight="fill" />
                    <span>Perplexity AI</span>
                  </AiBadge>
                </ResearchFooter>
              </ResearchContainer>
            ) : (
              <div
                style={{
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  borderRadius: '1rem',
                  border: '2px dashed rgba(99, 102, 241, 0.3)',
                  backgroundColor: 'rgba(30, 41, 59, 0.4)',
                  minHeight: '200px'
                }}
              >
                <CloudArrowUp size={48} weight="thin" style={{
                  color: 'rgba(99, 102, 241, 0.7)',
                  marginBottom: '1rem',
                }} />
                <div style={{
                  fontSize: '1.125rem',
                  fontWeight: '500',
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '0.75rem'
                }}>
                  No AI Research Available
                </div>
                <div style={{
                  fontSize: '0.9375rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '1.5rem',
                  maxWidth: '80%',
                  lineHeight: '1.5'
                }}>
                  Generate comprehensive AI research about this company including financials, opportunities, and competitive analysis.
                </div>
                <button
                  onClick={() => handleAction('generate-research')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.8) 0%, rgba(79, 82, 221, 0.9) 100%)',
                    border: 'none',
                    borderRadius: '0.75rem',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(99, 102, 241, 0.2) inset'
                  }}
                >
                  <Lightning size={20} weight="fill" />
                  Generate AI Research
                </button>
              </div>
            )}
          </ModalSection>
        );
  };

  // No longer need modules definition since we're showing all sections

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const modalVariants = {
    hidden: { scale: 0.95, y: 20, opacity: 0 },
    visible: { scale: 1, y: 0, opacity: 1, transition: { duration: 0.3 } },
    exit: { scale: 0.95, y: 20, opacity: 0, transition: { duration: 0.2 } }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  if (!partner) return null;

  return (
    <div>
      {isOpen && (
        <ModalBackdrop
          style={{
            opacity: 1,
          }}
          onClick={onClose}
        >
          <ModalContainer
            style={{
              opacity: 1,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <CloseButton
              onClick={onClose}
            >
              <X size={20} weight="bold" />
            </CloseButton>

            <ModalHeader>
              <ModalCompanyHeader>
                <CompanyInfo>
                  <LogoContainer>
                    {partner.logo ? (
                      <img src={getLogoUrl(partner)} alt={`${partner.name} logo`} />
                    ) : (
                      <Buildings size={36} weight="bold" />
                    )}
                  </LogoContainer>

                  <CompanyDetails>
                    <CompanyName>{partner.name}</CompanyName>
                    <CompanyMeta>
                      {(partner.hq_location || partner.country) && (
                        <MetaItem>
                          <MapPin size={16} />
                          {partner.hq_location || partner.country}
                        </MetaItem>
                      )}

                      {(partner.size_range || partner.employee_count) && (
                        <MetaItem>
                          <Users size={16} />
                          {partner.size_range || `${partner.employee_count} employees`}
                        </MetaItem>
                      )}

                      {partner.created_at && (
                        <MetaItem>
                          <CalendarBlank size={16} />
                          Added: {formatDate(partner.created_at)}
                        </MetaItem>
                      )}
                    </CompanyMeta>
                  </CompanyDetails>
                </CompanyInfo>

                <HeaderScoreCircle>
                  <ScoreCircle
                    score={partner.score || partner.partnership_score || 0}
                  >
                    <ScoreValue>
                      {Math.round(partner.score || partner.partnership_score || 0)}
                      <ScoreLabel>/10</ScoreLabel>
                    </ScoreValue>
                  </ScoreCircle>
                  <ScoreCategory score={partner.score || partner.partnership_score || 0}>
                    {getScoreCategory(partner.score || partner.partnership_score || 0)} Potential
                  </ScoreCategory>
                </HeaderScoreCircle>
              </ModalCompanyHeader>
            </ModalHeader>

            {/* Removed Module Navigation - all sections will be displayed at once */}

            {/* Moved Actions Section */}
            <ModalBody style={{ paddingBottom: 0 }}>
              <ModalSection
                style={{ marginBottom: '1.5rem' }} // Add some spacing below actions
              >
                <SectionTitle>
                  <Rocket size={24} weight="fill" />
                  Actions
                </SectionTitle>
                <ActionButtonsContainer>
                  <ActionButton
                    variant={isFavorite(partner) ? 'primary' : 'secondary'}
                    onClick={() => handleAction('toggle-favorite')}
                  >
                    <Star weight={isFavorite(partner) ? "fill" : "regular"} size={18} />
                    {isFavorite(partner) ? 'Remove from Favorites' : 'Add to Favorites'}
                  </ActionButton>

                  <ActionButton
                    variant="secondary"
                    onClick={() => handleAction('research')}
                  >
                    <MagnifyingGlass weight="regular" size={18} />
                    {partner.has_research ? 'View Research' : 'Research Company'}
                    {partner.has_research && (
                      <span style={{
                        fontSize: '0.7rem',
                        marginLeft: '0.5rem',
                        padding: '0.1rem 0.4rem',
                        background: 'rgba(99, 102, 241, 0.2)',
                        borderRadius: '0.25rem',
                        color: 'rgba(255, 255, 255, 0.9)'
                      }}>
                        {new Date(partner.research_date).toLocaleDateString()}
                      </span>
                    )}
                  </ActionButton>

                  {/* PDF Export Button - Only show if research is available */}
                  {researchSections && researchSections.length > 0 && (
                    <ActionButton
                      variant="secondary"
                      onClick={() => handleAction('export-pdf')}
                    >
                      <FilePdf weight="regular" size={18} />
                      Export PDF
                    </ActionButton>
                  )}
                </ActionButtonsContainer>
              </ModalSection>
            </ModalBody>
            {/* End Moved Actions Section */}

            {/* All sections displayed at once */}
            <ModalBody>
              {/* Research Section - Moved to top */}
              {renderResearchSection()}

              {/* Overview Section */}
              {renderOverviewSection()}

              {/* Leadership Section */}
              {renderLeadershipSection()}
            </ModalBody>
          </ModalContainer>
        </ModalBackdrop>
      )}
    </div>
  );
};

export default PartnerDetailModal;
