import React, { useEffect, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { m as motion, AnimatePresence } from 'framer-motion';
import { X, Buildings, CheckCircle, XCircle, Globe, MapPin, Users, CalendarBlank, Briefcase, CurrencyDollar, Star, LinkedinLogo, SpinnerGap, Brain, MagnifyingGlass, Lightbulb, Rocket, ArrowsClockwise, FilePdf, VideoCamera, UsersThree } from '@phosphor-icons/react';
import { getPerplexityResearch, getOpenAIResearch, checkApiHealth, exportResearchAsPDF } from '../services/api';
import { getPerplexityPartnerResearch } from '../services/partnerApi';
import { useFavorites } from '../context/FavoritesContext';
import { useResearch } from '../context/ResearchContext';
import ReactMarkdown from 'react-markdown';

// Enhanced Markdown component that removes Summary Table: Key Facts
const EnhancedMarkdown = ({ content }) => {
  // Process the content to remove Summary Table: Key Facts section
  const processContent = () => {
    if (!content) return '';

    // Split the content by lines
    const lines = content.split('\n');
    let processedLines = [];
    let skipLines = false;
    let skipTable = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if this line contains the key facts heading
      if (line.includes('Summary Table: Key Facts') ||
          line.includes('## Summary Table: Key Facts') ||
          line.includes('### Summary Table: Key Facts')) {
        skipLines = true; // Start skipping lines
        skipTable = true; // We'll need to skip the table too
        continue; // Skip this line
      }

      // If we're skipping and this is a new section heading, stop skipping
      if (skipLines && line.trim().startsWith('#')) {
        skipLines = false;
        skipTable = false;
      }

      // Skip table lines if we're in skip mode
      if (skipTable && line.trim().startsWith('|')) {
        continue;
      }

      // If we're not in a table anymore, stop skipping tables
      if (skipTable && !line.trim().startsWith('|') && line.trim() !== '') {
        skipTable = false;
      }

      // Skip the marker line
      if (line.includes('<!-- key-facts-table-start -->')) {
        continue;
      }

      // Add the line if we're not skipping
      if (!skipLines) {
        processedLines.push(line);
      }
    }

    return processedLines.join('\n');
  };

  return (
    <ReactMarkdown>
      {processContent()}
    </ReactMarkdown>
  );
};

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
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

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
`;

// Shared styles
const glassEffect = css`
  background-color: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const hoverLift = css`
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }
`;

const ModalBackdrop = styled(motion.div)`
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

const ModalContainer = styled(motion.div)`
  ${glassEffect}
  border-radius: 1.5rem;
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }

  @media (max-width: 768px) {
    width: 100%;
    max-height: 95vh;
    border-radius: 1.25rem 1.25rem 0 0;
    margin: 0;
  }
`;

const CloseButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 50%;
  width: 2.75rem;
  height: 2.75rem;
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg) scale(1.1);
  }

  @media (max-width: 768px) {
    width: 2.25rem;
    height: 2.25rem;
    top: 1rem;
    right: 1rem;
  }
`;

const ModalHeader = styled.div`
  padding: 2.5rem;
  background: linear-gradient(to bottom, rgba(20, 30, 48, 0.7), rgba(15, 23, 42, 0.4));
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  width: 100%;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const ModalCompanyHeader = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  justify-content: space-between;
  padding: 1rem 0;
  animation: ${fadeIn} 0.6s ease forwards;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const CompanyLogo = styled.div`
  width: 90px;
  height: 90px;
  border-radius: 1rem;
  background-color: rgba(30, 41, 59, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 600;
  font-size: 1.5rem;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  animation: ${floatAnimation} 3s ease-in-out infinite;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 25px rgba(0, 0, 0, 0.3);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  @media (max-width: 768px) {
    width: 70px;
    height: 70px;
    align-self: flex-start;
  }
`;

const CompanyDetails = styled.div`
  flex: 1;
  max-width: calc(100% - 280px);
  margin-left: 2rem;
  animation: ${slideUp} 0.5s ease forwards;

  @media (max-width: 768px) {
    width: 100%;
    margin-top: 1rem;
    margin-left: 0;
    max-width: 100%;
    padding-right: 80px;
  }
`;

const CompanyName = styled.h2`
  font-size: 2rem;
  color: white;
  margin: 0 0 0.75rem 0;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    font-size: 1.5rem;
    padding-right: 40px;
  }
`;

const EnrichmentStatus = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  gap: 0.5rem;
  margin-left: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;

  svg {
    animation: ${spin} 2s linear infinite;
  }
`;

const CompanyDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.125rem;
  margin: 0.75rem 0 0 0;
  line-height: 1.6;
  max-width: 95%;

  @media (max-width: 768px) {
    font-size: 1rem;
    max-width: 100%;
  }
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
  justify-content: center;

  @media (max-width: 768px) {
    gap: 0.75rem;
    margin-top: 1.5rem;
  }
`;

const IconButtonContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
  animation: ${fadeIn} 0.5s ease forwards;
  animation-delay: ${({ index }) => 0.1 * index}s;
  opacity: 0;
`;

const IconButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 75px;
  height: 75px;
  border-radius: 1rem;
  background: ${({ variant }) =>
    variant === 'primary' ? 'linear-gradient(135deg, #4f46e5 0%, #7e22ce 100%)' :
    variant === 'secondary' ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)' :
    'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)'
  };
  color: white;
  border: 1px solid ${({ variant }) =>
    variant === 'primary' ? 'rgba(255, 255, 255, 0.2)' :
    'rgba(255, 255, 255, 0.1)'
  };
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover:not(:disabled) {
    transform: translateY(-5px) scale(1.05);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);

    &::before {
      opacity: 1;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.95);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 32px;
    height: 32px;
    filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.2));
  }

  .spinning {
    animation: ${spin} 2s linear infinite;
  }

  @media (max-width: 768px) {
    width: 60px;
    height: 60px;

    svg {
      width: 24px;
      height: 24px;
    }
  }
`;

const IconLabel = styled.div`
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 0.5rem;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const ScoreValue = styled(motion.div)`
  font-size: inherit;
  font-weight: 800;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  animation: ${pulseAnimation} 2.5s infinite ease-in-out;

  &:hover {
    animation-play-state: paused;
  }
`;

const HeaderScoreCircle = styled(motion.div)`
  width: 130px;
  height: 130px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 3.75rem;
  color: white;
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.4), 0 0 0 5px rgba(255, 255, 255, 0.15);
  position: relative;
  overflow: visible;
  margin-left: auto;
  z-index: 10;

  background: ${({ score }) => {
    if (score >= 8) return 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
    if (score >= 6) return 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)';
    if (score >= 4) return 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)';
    return 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
  }};

  @media (max-width: 768px) {
    width: 90px;
    height: 90px;
    font-size: 2.5rem;
    position: absolute;
    top: 10px;
    right: 10px;
  }
`;

const ScoreIndicator = styled(motion.div)`
  position: absolute;
  border-radius: 50%;
  opacity: 0.3;
  width: 120%;
  height: 120%;
  top: -10%;
  left: -10%;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%);
`;

const ScoreLabel = styled.div`
  font-size: 1.125rem;
  font-weight: 500;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.95);
`;

const ScoreCategory = styled.div`
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);

  background: ${({ score }) => {
    if (score >= 8) return 'rgba(16, 185, 129, 0.15)';
    if (score >= 6) return 'rgba(245, 158, 11, 0.15)';
    if (score >= 4) return 'rgba(99, 102, 241, 0.15)';
    return 'rgba(239, 68, 68, 0.15)';
  }};

  color: ${({ score }) => {
    if (score >= 8) return '#10B981';
    if (score >= 6) return '#F59E0B';
    if (score >= 4) return '#6366F1';
    return '#EF4444';
  }};

  @media (max-width: 768px) {
    bottom: -20px;
    font-size: 0.75rem;
    padding: 0.3rem 0.75rem;
  }
`;

const ModalBody = styled.div`
  padding: 2.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 2rem;
  width: 95%;
  margin: 2rem auto;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
    width: 95%;
    margin: 1rem auto;
    gap: 1.5rem;
  }
`;

// New styled components for company module buttons
const ModuleButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 2rem;
  width: 95%;
  margin: 0 auto;
  overflow-x: auto;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    padding: 1rem;
    justify-content: flex-start;
  }
`;

const ModuleButton = styled.button`
  background: ${({ active }) =>
    active
      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.8) 0%, rgba(79, 70, 229, 0.8) 100%)'
      : 'rgba(30, 41, 59, 0.6)'
  };
  color: white;
  border: 1px solid ${({ active }) =>
    active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)'
  };
  border-radius: 0.75rem;
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: ${({ active }) =>
    active
      ? '0 8px 16px rgba(79, 70, 229, 0.3)'
      : '0 4px 8px rgba(0, 0, 0, 0.1)'
  };

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
    background: ${({ active }) =>
      active
        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(79, 70, 229, 0.9) 100%)'
        : 'rgba(44, 55, 73, 0.8)'
    };
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;
    padding: 0.5rem 1rem;
  }
`;

const ModalSection = styled(motion.div)`
  ${glassEffect}
  border-radius: 1.25rem;
  padding: 2rem;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  ${hoverLift}
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 5px;
    background: linear-gradient(to right, ${({ theme }) => theme.colors.accent}, ${({ theme }) => theme.colors.accentSecondary || theme.colors.accent});
    opacity: 0.8;
  }

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    padding: 1.5rem;

    &:hover {
      transform: none;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.5rem;
  color: white;
  margin-bottom: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;
  position: relative;

  svg {
    margin-right: 0.75rem;
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.accent}, ${({ theme }) => theme.colors.accentSecondary || theme.colors.accent});
    color: white;
    border-radius: 50%;
    padding: 8px;
    width: 40px;
    height: 40px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 768px) {
    font-size: 1.25rem;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;

    svg {
      padding: 6px;
      width: 32px;
      height: 32px;
      margin-right: 0.5rem;
    }
  }
`;

const CompetitionSection = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 0.75rem;
  background-color: ${({ $hasCompetition, theme }) =>
    $hasCompetition
      ? `${theme.colors.status.error}10`
      : `${theme.colors.status.success}10`
  };
  border: 1px solid ${({ $hasCompetition, theme }) =>
    $hasCompetition
      ? `${theme.colors.status.error}30`
      : `${theme.colors.status.success}30`
  };
`;

const CompetitionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  color: ${({ $hasCompetition, theme }) =>
    $hasCompetition
      ? theme.colors.status.error
      : theme.colors.status.success
  };
  font-weight: 600;
  font-size: 1.125rem;
`;

const CompetitionDetails = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const DetailLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const DetailValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  line-height: 1.4;
`;

const CompanyList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const CompanyItem = styled.li`
  padding: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ theme }) => theme.colors.background.tertiary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  &:last-child {
    margin-bottom: 0;
  }
`;

const ScoreSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xl};
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const TotalScore = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: ${({ theme }) => theme.spacing.xl};
`;

const ScoreCircle = styled(motion.div)`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  position: absolute;
  top: 0;
  right: 0;

  ${({ score, theme }) => {
    if (score >= 8) return `background: linear-gradient(135deg, ${theme.colors.scoring?.excellent || theme.colors.status.excellent} 0%, #00b8a9 100%);`;
    if (score >= 6) return `background: linear-gradient(135deg, ${theme.colors.scoring?.good || theme.colors.status.good} 0%, #e72b3e 100%);`;
    if (score >= 4) return `background: linear-gradient(135deg, ${theme.colors.scoring?.average || theme.colors.status.average} 0%, #ffb300 100%);`;
    return `background: linear-gradient(135deg, ${theme.colors.scoring?.poor || theme.colors.status.poor} 0%, #e53935 100%);`;
  }}

  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    font-size: 1rem;
  }
`;

const ScoreBreakdown = styled.div`
  flex: 1;
  min-width: 300px;
`;

const ScoreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const ScoreCard = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background.tertiary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const ScoreCardHeader = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const ScoreCardValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};

  ${({ score, max, theme }) => {
    const percentage = score / max;
    if (percentage >= 0.8) return `color: ${theme.colors.scoring.excellent};`;
    if (percentage >= 0.6) return `color: ${theme.colors.scoring.good};`;
    if (percentage >= 0.4) return `color: ${theme.colors.scoring.average};`;
    return `color: ${theme.colors.scoring.poor};`;
  }}
`;

const CoverImage = styled.div`
  width: 100%;
  height: 300px;
  background-color: ${({ theme }) => theme.colors.background.tertiary};
  background-size: cover;
  background-position: center;
  position: relative;
  margin-bottom: 0;
  box-shadow: ${({ theme }) => theme.shadows.md};

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100px;
    background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  }

  @media (max-width: 768px) {
    height: 200px;
  }
`;

const CompanyTagline = styled.p`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-style: italic;
  margin: ${({ theme }) => theme.spacing.md} 0;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border-left: 4px solid ${({ theme }) => theme.colors.accent};
  line-height: 1.5;
`;

const LinkedInSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const LinkedInLink = styled.a`
  display: inline-flex;
  align-items: center;
  color: white;
  background-color: #0077B5; /* LinkedIn blue */
  text-decoration: none;
  font-size: ${({ theme }) => theme.fontSizes.md};
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  align-self: flex-start;
  transition: all 0.2s ease;

  &:hover {
    background-color: #005c8d;
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  @media (max-width: 768px) {
    margin-top: 10px;
  }
`;

const SpecialtiesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 768px) {
    gap: ${({ theme }) => theme.spacing.sm};
    margin-top: ${({ theme }) => theme.spacing.md};
  }
`;

const SpecialtyTag = styled.div`
  background-color: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  font-size: ${({ theme }) => theme.fontSizes.md};
  box-shadow: ${({ theme }) => theme.shadows.xs};
  border: 1px solid ${({ theme }) => theme.colors.border};
  transition: all 0.2s ease;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
    background-color: ${({ theme }) => theme.colors.accent}10;
    border-color: ${({ theme }) => theme.colors.accent};
  }

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};

    &:hover {
      transform: none;
    }
  }
`;

const LocationsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

const LocationItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSizes.md};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.xs};

  svg {
    color: ${({ theme }) => theme.colors.accent};
    min-width: 20px;
  }
`;

const FundingInfo = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.xs};

  @media (max-width: 768px) {
    margin-top: ${({ theme }) => theme.spacing.md};
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const FundingHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${({ theme }) => theme.spacing.xs};
    padding-bottom: ${({ theme }) => theme.spacing.sm};
    margin-bottom: ${({ theme }) => theme.spacing.sm};
  }
`;

const FundingTitle = styled.h4`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};

  svg {
    color: ${({ theme }) => theme.colors.accent};
  }
`;

const FundingAmount = styled.div`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.accent};
  font-size: ${({ theme }) => theme.fontSizes.lg};

  @media (max-width: 768px) {
    margin-top: ${({ theme }) => theme.spacing.xs};
    font-size: ${({ theme }) => theme.fontSizes.md};
  }
`;

const FundingDetails = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  @media (max-width: 768px) {
    margin-bottom: ${({ theme }) => theme.spacing.sm};
  }
`;

const FundingInvestors = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
  line-height: 1.5;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.sm};
    margin-top: ${({ theme }) => theme.spacing.md};
  }
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: all 0.2s ease;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
  }

  svg {
    color: ${({ theme }) => theme.colors.accent};
    min-width: 24px;
    width: 24px;
    height: 24px;
  }

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.md};

    &:hover {
      transform: none;
    }

    svg {
      min-width: 20px;
      width: 20px;
      height: 20px;
    }
  }
`;

const InfoContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const InfoLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`;

const InfoValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text.primary};
  word-break: break-word;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;

const FollowerCount = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  align-self: flex-start;

  svg {
    color: ${({ theme }) => theme.colors.accent};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
`;

const Spinner = styled(motion.div)`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.accent};
`;

const LoadingText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  margin: 0;
`;

const ErrorContainer = styled(LoadingContainer)`
  color: ${({ theme }) => theme.colors.status.error};
`;

const ErrorIcon = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.status.error};
`;

const ErrorText = styled(LoadingText)`
  color: ${({ theme }) => theme.colors.status.error};
`;

const ErrorHint = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
`;

const CoverTitle = styled.h1`
  position: absolute;
  bottom: 40px;
  left: 40px;
  color: white;
  font-size: ${({ theme }) => theme.fontSizes.xxxl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin: 0;
  z-index: 5;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);

  @media (max-width: 768px) {
    bottom: 20px;
    left: 20px;
    font-size: ${({ theme }) => theme.fontSizes.xl};
  }
`;

const CompanyHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const CompanyTitleSection = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

const ScoreText = styled.span`
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
  margin-top: 0.25rem;
`;

// Add the score category function that was missing
const getScoreCategory = (score) => {
  if (score >= 8) return "Excellent";
  if (score >= 6) return "Good";
  if (score >= 4) return "Average";
  return "Poor";
};

// CircularProgress component for displaying score visually
const CircularProgress = ({ score }) => {
  const category = getScoreCategory(score);

  return (
    <motion.div
      initial={{ scale: 0, rotate: -90 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        duration: 0.8
      }}
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        zIndex: 5
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        style={{
          position: 'absolute',
          transform: 'rotate(-90deg)',
          zIndex: 1
        }}
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(0, 0, 0, 0.2)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(255, 255, 255, 0.9)"
          strokeWidth="8"
          strokeDasharray="283"
          strokeDashoffset={283 - (283 * score / 10)}
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
};

const FavoriteButton = styled(motion.button)`
  position: absolute;
  top: 1rem;
  right: 4rem;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  color: ${props => props.isFavorite ? '#F59E0B' : '#6B7280'};
  cursor: pointer;
  padding: 0.75rem;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

  &:hover {
    color: #F59E0B;
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
    background: rgba(30, 41, 59, 0.9);
  }
`;

const CompanyModal = ({ isOpen, onClose, company }) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { getResearch, saveResearch, isResearchLoading, hasResearch } = useResearch();
  const [isLoading, setIsLoading] = useState(true);
  const [isEnriching, setIsEnriching] = useState(false); // We still track this but don't show UI for it
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [perplexityData, setPerplexityData] = useState(null);
  const [isPerplexityLoading, setIsPerplexityLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeCompanyModule, setActiveCompanyModule] = useState(null);
  const [showPerplexitySection, setShowPerplexitySection] = useState(false);
  const [perplexityError, setPerplexityError] = useState(null);
  const [sportsPartnerships, setSportsPartnerships] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if current company is in favorites
  const isFavorited = company ? isFavorite(company) : false;

  // Load research data when company changes or modal opens
  useEffect(() => {
    if (company && isOpen) {
      loadResearchData();
    }
  }, [company, isOpen]);

  // Global cleanup effect to ensure all states are reset when the component unmounts
  useEffect(() => {
    return () => {
      // Reset all loading states when component unmounts
      setIsLoading(false);
      setIsEnriching(false);
      setIsAnalyzing(false);
      setIsPerplexityLoading(false);
    };
  }, []);

  // Handle initial modal loading state
  useEffect(() => {
    if (isOpen && company) {
      setIsLoading(true);

      // Set enrichment state based on company flags (we still track this but don't show UI for it)
      if (company.enrichError) {
        setIsEnriching(false);
      } else if (company.linkedin_data) {
        setIsEnriching(false);
      } else if (company.isEnriching !== undefined) {
        setIsEnriching(company.isEnriching);
      } else {
        setIsEnriching(true);

        // Set a timeout to prevent infinite spinner
        const timer = setTimeout(() => {
          setIsEnriching(false);
        }, 5000); // Reduced from 10000 to ensure faster termination

        return () => clearTimeout(timer);
      }

      // Set a brief loading state and ensure it always gets cleared
      const loadingTimer = setTimeout(() => setIsLoading(false), 800);

      return () => {
        clearTimeout(loadingTimer);
        setIsLoading(false); // Ensure loading state is cleared when component unmounts
        setIsEnriching(false); // Also ensure enriching state is cleared when component unmounts
      };
    } else if (!isOpen) {
      // When modal is closed, ensure loading state is reset
      setIsLoading(false);
      setIsEnriching(false); // Also reset enriching state when modal is closed
    }
  }, [isOpen, company]);

  // Update isEnriching when LinkedIn data becomes available
  useEffect(() => {
    if (company && company.linkedin_data) {
      setIsEnriching(false);
    }

    // Always ensure isEnriching stops after a reasonable timeout
    // This fixes the issue with perpetual spinning
    if (isEnriching) {
      const forceTimeout = setTimeout(() => {
        setIsEnriching(false);
      }, 7000); // Force stop after 7 seconds max

      return () => clearTimeout(forceTimeout);
    }
  }, [company?.linkedin_data, isEnriching]);

  const loadResearchData = async () => {
    if (!company?.name) return;

    // Check if we already have research data
    const research = await getResearch(company);

    if (research && research.data) {
      // If we have data, check its source and set the appropriate state
      console.log(`Loaded research data from context for ${company.name}, source: ${research.source}`);

      // Always show appropriate research section based on what we have
      if (research.source === 'perplexity' || research.source === 'perplexity-fallback') {
        setPerplexityData(research.data);
        setAiAnalysis(null); // Clear other research type
        setShowPerplexitySection(true); // Ensure Perplexity section is visible
        console.log("Set perplexityData from cached research.");
      } else if (research.source === 'openai' || research.source === 'ai-analysis' || research.source === 'deepseek' || research.source === 'fallback-generated') {
        // Format the data if it's raw OpenAI response or stored analysis
        const formattedData = formatOpenAIResponse(research.data);
        setAiAnalysis({
          title: `Research: ${company.name}`,
          type: 'research', // Assume research type for display
          sections: formattedData,
          isCached: true,
          source: research.source,
          createdAt: research.created_at || research.updated_at,
          companyName: company.name
        });
        setPerplexityData(null); // Clear other research type
        setShowPerplexitySection(false); // Hide Perplexity section if showing AI analysis
        console.log("Set aiAnalysis from cached research.");
      } else {
        // Handle unknown source or default case - maybe display as AI analysis?
        console.warn("Loaded research data from context with unknown source:", research.source);
        const formattedData = formatOpenAIResponse(research.data); // Attempt formatting
        setAiAnalysis({
          title: `Research: ${company.name}`,
          type: 'research',
          sections: formattedData,
          isCached: true,
          source: research.source || 'unknown',
          createdAt: research.created_at || research.updated_at,
          companyName: company.name
        });
        setPerplexityData(null);
        setShowPerplexitySection(false);
      }
    } else {
      // No cached data found - DO NOT auto-trigger research generation
      console.log("No cached research data found for:", company.name);
      console.log("User must click Research button to generate research");

      // Reset states to ensure clean UI
      setPerplexityData(null);
      setAiAnalysis(null);
      setShowPerplexitySection(false);
    }
  };

  // List of available company module components
  const companyModules = [
    // Modules have been removed as requested
  ];

  // Toggle company module display
  const toggleCompanyModule = (moduleId) => {
    if (activeCompanyModule === moduleId) {
      setActiveCompanyModule(null); // Hide if already showing
    } else {
      setActiveCompanyModule(moduleId); // Show the selected module
    }
  };

  // Render the active company module component
  const renderCompanyModule = () => {
    if (!activeCompanyModule) return null;

    switch (activeCompanyModule) {
      case 'financials':
        return (
          <ModalSection>
            <SectionTitle>Company Financials</SectionTitle>
            <CompetitionDetails>
              <DetailLabel>Annual Revenue:</DetailLabel>
              <DetailValue>{company.revenue || 'Not available'}</DetailValue>

              <DetailLabel>Funding Status:</DetailLabel>
              <DetailValue>
                {company.linkedin_data?.funding_data?.lastFundingRound ?
                  `${company.linkedin_data.funding_data.lastFundingRound.fundingType} -
                   ${formatCurrency(company.linkedin_data.funding_data.lastFundingRound.moneyRaised)}` :
                  'Not available'}
              </DetailValue>

              <DetailLabel>Valuation:</DetailLabel>
              <DetailValue>{company.valuation || 'Not available'}</DetailValue>
            </CompetitionDetails>
          </ModalSection>
        );

      case 'team':
        return (
          <ModalSection>
            <SectionTitle>Leadership Team</SectionTitle>
            <CompetitionDetails>
              {company.linkedin_data?.executives ?
                company.linkedin_data.executives.map((exec, index) => (
                  <React.Fragment key={index}>
                    <DetailLabel>{exec.title || 'Executive'}:</DetailLabel>
                    <DetailValue>{exec.name || 'Unknown'}</DetailValue>
                  </React.Fragment>
                )) :
                <DetailValue>No leadership information available</DetailValue>
              }
            </CompetitionDetails>
          </ModalSection>
        );

      case 'products':
        return (
          <ModalSection>
            <SectionTitle>Products & Services</SectionTitle>
            <CompetitionDetails>
              {company.linkedin_data?.specialties ?
                <>
                  <DetailLabel>Specialties:</DetailLabel>
                  <DetailValue>{company.linkedin_data.specialties.join(', ')}</DetailValue>
                </> :
                <DetailValue>No product information available</DetailValue>
              }
            </CompetitionDetails>
          </ModalSection>
        );

      case 'competitors':
        return (
          <ModalSection>
            <SectionTitle>Key Competitors</SectionTitle>
            <CompetitionDetails>
              {company.competitors ?
                company.competitors.map((competitor, index) => (
                  <React.Fragment key={index}>
                    <DetailValue>{competitor.name || competitor}</DetailValue>
                  </React.Fragment>
                )) :
                <DetailValue>No competitor information available</DetailValue>
              }
            </CompetitionDetails>
          </ModalSection>
        );

      case 'partnerships':
        return (
          <ModalSection>
            <SectionTitle>Strategic Partnerships</SectionTitle>
            <CompetitionDetails>
              {company.partnerships ?
                company.partnerships.map((partner, index) => (
                  <React.Fragment key={index}>
                    <DetailValue>{partner.name || partner}</DetailValue>
                  </React.Fragment>
                )) :
                <DetailValue>No partnership information available</DetailValue>
              }
            </CompetitionDetails>
          </ModalSection>
        );

      default:
        return null;
    }
  };

  const handleAction = async (action, options = {}) => {
    console.log(`Action triggered: ${action} for company: ${company?.name}`);

    if (action === 'perplexity') {
      // Show the Perplexity section when this action is triggered
      setShowPerplexitySection(true);

      // If we already have data for this company, don't reload
      if (hasResearch(company.name) && !options.forceRefresh) {
        const research = await getResearch(company);
        if (research && research.data) {
          setPerplexityData(research.data);
          return;
        }
      }

      // Use Perplexity API for deep research
      setIsPerplexityLoading(true);
      setPerplexityData(null); // Clear previous data
      setSportsPartnerships(null); // Clear sports partnerships data

      // Set a timeout to ensure loading state is reset even if request fails
      const loadingTimeout = setTimeout(() => {
        setIsPerplexityLoading(false);
      }, 180000); // 3 minutes timeout

      try {
        // First check if the API is healthy
        console.log("Checking API health before making Perplexity request...");
        const healthCheck = await checkApiHealth();
        console.log("API health check result:", healthCheck);

        if (!healthCheck.api_server) {
          throw new Error(`API server is not available. Please check your connection and try again.`);
        }

        if (!healthCheck.perplexity_api) {
          // Get a more detailed error message
          const errorDetail = healthCheck.perplexity_error || 'Unknown error';
          console.error(`Perplexity API error details: ${errorDetail}`);

          // Check for specific error types
          if (errorDetail.includes('timeout')) {
            throw new Error(`Perplexity API timed out. The server might be busy, please try again later.`);
          } else if (errorDetail.includes('network') || errorDetail.includes('ECONNREFUSED')) {
            throw new Error(`Network error connecting to Perplexity API. Please check your connection.`);
          } else if (errorDetail.includes('401') || errorDetail.includes('unauthorized')) {
            throw new Error(`Perplexity API authentication failed. API key may be invalid or expired.`);
          } else if (errorDetail.includes('429') || errorDetail.includes('too many requests')) {
            throw new Error(`Perplexity API rate limit exceeded. Please try again later.`);
          } else {
            throw new Error(`Perplexity API is not available: ${errorDetail}`);
          }
        }

        console.log("Starting Perplexity API request");
        const researchData = await getPerplexityResearch(company);
        console.log("Perplexity API request successful, data length:", researchData?.length || 0);
        setPerplexityData(researchData);

        // Extract sports partnerships
        const extractedSportsPartnerships = extractSportsPartnerships(researchData);
        setSportsPartnerships(extractedSportsPartnerships);

        // Store in research context
        await saveResearch(company, researchData, 'perplexity');

        console.log("Perplexity data set in state and saved to context for:", company.name);
      } catch (error) {
        console.error("Error fetching Perplexity research:", error);
        console.error("Error message:", error.message);

        // Show user-friendly error alert
        const errorMessage = error.message || "Unknown error occurred";
        alert(`Perplexity research failed: ${errorMessage}. This could be due to a timeout or API issue. Falling back to web search.`);

        // If API fails, fallback to opening the website
        const companyName = company?.name || '';
        const industry = company?.coresignal_data?.company_details?.industry || '';
        const query = encodeURIComponent(`Comprehensive business intelligence report on ${companyName}${industry ? ` in the ${industry} industry` : ''}: business model, revenue streams, market position, major competitors, strategic partnerships, recent developments, growth potential, and investment outlook.`);
        window.open(`https://www.perplexity.ai/search?q=${query}`, '_blank');
      } finally {
        setIsPerplexityLoading(false);
        clearTimeout(loadingTimeout); // Clear the timeout when the request completes
      }
    } else if (action === 'pdf-download' || action === 'export-pdf') {
      // Handle PDF download action
      console.log("PDF export triggered for:", company.name);
      try {
        // Use the exportResearchAsPDF function which uses the modern PDF styling
        await exportResearchAsPDF(company.name);
        console.log("PDF export complete");
      } catch (error) {
        console.error("PDF generation failed:", error);
        alert(`Failed to generate PDF: ${error.message}`);
      }

    } else if (action === 'video-content') {
      // Handle Video content action
      console.log("Video content triggered for:", company.name);
      alert(`Loading video content for ${company.name}...`);
      // Implement video content display functionality

    } else if (action === 'ai-analysis') {
      // Perform in-place AI analysis
      setIsAnalyzing(true);
      setAiAnalysis(null); // Clear previous analysis

      // Set a timeout to ensure the analyzing state doesn't get stuck
      const analysisTimeout = setTimeout(() => {
        setIsAnalyzing(false);
      }, 15000); // 15 seconds timeout

      // Simulate AI analysis loading (would be replaced with actual API call)
      setTimeout(() => {
        const analysis = generateAIAnalysis(company);
        console.log("Generated AI analysis:", analysis);
        setAiAnalysis(analysis);

        // Store in research context
        saveResearch(company, analysis, 'ai-analysis');

        console.log("AI analysis set in state and saved to context for:", company.name);
        setIsAnalyzing(false);
        clearTimeout(analysisTimeout); // Clear the timeout when the analysis completes
      }, 2000);
    } else if (action === 'deep-research') {
      // First, check if we already have research data for this company
      console.log(`Checking for existing research for ${company.name}...`);
      const existingResearch = await getResearch(company);

      // If we have data and not forcing refresh, verify it's for the correct company
      if (existingResearch && existingResearch.data && !options.forceRefresh) {
        console.log(`Found existing research, verifying it matches ${company.name}`);

        // Double-check the research is for the current company
        if (existingResearch.company_name && existingResearch.company_name !== company.name) {
          console.warn(`Cached research is for ${existingResearch.company_name} but viewing ${company.name}. Will generate new research.`);
          // Continue to generate new research below
        } else {
          console.log(`Using existing research for ${company.name}`);

          if (existingResearch.source === 'openai' || existingResearch.source === 'deepseek') {
            // Format the existing data for display
            const sections = formatOpenAIResponse(existingResearch.data);

            setAiAnalysis({
              title: `Research: ${company.name}`,
              type: 'research',
              sections: sections,
              isCached: true,
              source: existingResearch.source,
              createdAt: existingResearch.created_at || existingResearch.updated_at,
              companyName: company.name
            });

            // No need to show loading animation
            return;
          }
        }
      }

      // If we reached here, we need to generate new research or forced refresh
      // Trigger deep research using OpenAI API
      setIsAnalyzing(true);
      setAiAnalysis(null); // Clear previous analysis

      // Set a timeout to ensure the analyzing state doesn't get stuck
      const deepResearchTimeout = setTimeout(() => {
        setIsAnalyzing(false);
      }, 180000); // 3 minutes timeout

      try {
        console.log("Starting OpenAI research request for:", company.name);

        // Check if we should force refresh
        const requestOptions = { ...company };
        if (options.forceRefresh) {
          requestOptions.forceRefresh = true;
          console.log("Force refresh requested for research");
        }

        // Using OpenAI API instead of local mock data
        const result = await getOpenAIResearch(requestOptions);

        // The result could be just the research data or an object with metadata
        let deepSeekData;
        let isCached = false;
        let source = 'deepseek';
        let createdAt = null;

        if (typeof result === 'object' && result.data && result.source) {
          // This is a result from the database with metadata
          deepSeekData = result.data;
          isCached = true;
          source = result.source;
          createdAt = result.created_at || null;

          // Check if the returned research is for the current company
          // If not, fetch new research specifically for this company
          if (result.company_name && result.company_name !== company.name) {
            console.log(`Received cached research for ${result.company_name} but viewing ${company.name}. Fetching specific data...`);
            // Force a fresh research request for the current company
            const freshResult = await getOpenAIResearch({
              ...company,
              forceRefresh: true
            });

            if (typeof freshResult === 'object' && freshResult.data) {
              deepSeekData = freshResult.data;
              isCached = freshResult.created_at !== freshResult.updated_at;
              source = freshResult.source;
              createdAt = freshResult.created_at || null;
            } else {
              deepSeekData = freshResult;
            }
          }
        } else {
          // This is just the research data
          deepSeekData = result;
        }

        // Check if we got valid research data
        if (deepSeekData && typeof deepSeekData === 'string' && deepSeekData.length > 100) {
          console.log("OpenAI research successful, data length:", deepSeekData.length);

          // Format the OpenAI response for display
          const sections = formatOpenAIResponse(deepSeekData);
          console.log("Formatted sections:", sections.length);

          const formattedData = {
            title: `Research: ${company.name}`,
            type: 'research',
            sections: sections,
            isCached: isCached,
            source: source,
            createdAt: createdAt,
            companyName: company.name // Store the company name to verify research is for the correct company
          };

          setAiAnalysis(formattedData);

          // Save the research in the context and database for future use
          if (!isCached || options.forceRefresh) {
            console.log(`Saving new research data for ${company.name}`);
            await saveResearch(company, deepSeekData, 'deepseek');
          }
        } else {
          console.error("OpenAI returned invalid or too short research data", deepSeekData);
          throw new Error("Invalid research data");
        }
      } catch (error) {
        console.error("Error with research:", error.message);

        // Fallback to local data if the API fails
        console.log("Using fallback local research data");
        const research = generateDeepResearch(company);
        setAiAnalysis(research);

        // Save the fallback research
        await saveResearch(company, research, 'fallback-generated');
      } finally {
        setIsAnalyzing(false);
        clearTimeout(deepResearchTimeout); // Clear the timeout when the request completes
      }
    } else if (action === 'score') {
      // Trigger AI-powered partnership score generation
      setIsAnalyzing(true);
      setAiAnalysis(null); // Clear previous analysis

      // Set a timeout to ensure the analyzing state doesn't get stuck
      const scoreTimeout = setTimeout(() => {
        setIsAnalyzing(false);
      }, 15000); // 15 seconds timeout

      // Simulate AI analysis loading (would be replaced with actual API call)
      setTimeout(() => {
        const analysis = generateAIAnalysis(company);
        console.log("Generated AI analysis:", analysis);
        setAiAnalysis(analysis);
        setIsAnalyzing(false);
        clearTimeout(scoreTimeout); // Clear the timeout when the score completes
      }, 2000);
    }
  };

  // Generate AI analysis content based on company data
  const generateAIAnalysis = (company) => {
    const companyName = company?.name || '';
    const industry = company?.coresignal_data?.company_details?.industry || 'this industry';
    const size = company?.coresignal_data?.company_details?.size || 'unknown size';

    return {
      title: `AI Analysis of ${companyName}`,
      type: 'analysis',
      sections: [
        {
          heading: 'Partnership Potential',
          content: `${companyName} shows ${company.partnership_score >= 7 ? 'strong' : company.partnership_score >= 5 ? 'moderate' : 'limited'} potential for partnership based on our analysis. With a partnership score of ${company.partnership_score}/10, they ${company.has_competition ? 'may compete with some existing partners' : 'do not appear to compete with existing partners'}. ${company.partnership_score >= 8 ? 'We recommend prioritizing this partnership opportunity due to strong alignment with strategic goals.' : company.partnership_score >= 6 ? 'This partnership represents a solid opportunity with manageable risks.' : 'Consider this partnership with caution as there may be alignment challenges.'}`
        },
        {
          heading: 'Market Position',
          content: `As a ${size} company in ${industry}, ${companyName} ${company.partnership_score >= 7 ? 'holds a significant position' : 'is positioned as a challenger'} in their market segment. ${company.coresignal_data?.company_details?.employee_count ? `Their employee count of ${company.coresignal_data.company_details.employee_count.toLocaleString()} indicates strong market presence.` : ''} ${company.coresignal_data?.company_details?.industry ? `Core competencies in ${industry} position them well within the competitive landscape.` : ''} Their current trajectory suggests ${company.partnership_score >= 7 ? 'continued growth and market expansion' : company.partnership_score >= 5 ? 'stable performance with moderate growth potential' : 'potential market challenges that may require careful monitoring'}.`
        },
        {
          heading: 'Strategic Fit',
          content: `The strategic alignment between our organizations appears ${company.partnership_score >= 7 ? 'strong, with complementary capabilities' : company.partnership_score >= 5 ? 'moderate, with some overlapping interests' : 'limited, with potential areas of conflict'}. ${company.has_competition ? `We should note the existing partnerships with ${company.competing_partners ? company.competing_partners.join(', ') : 'competitors'} that could create conflicts of interest.` : 'No major conflicts with existing partnerships were identified, suggesting a clean integration path.'} Potential collaboration areas include ${company.partnership_score >= 7 ? 'joint ventures, co-marketing, and integrated product offerings' : company.partnership_score >= 5 ? 'targeted co-marketing initiatives and selective product integrations' : 'limited promotional activities and carefully defined engagement parameters'}.`
        },
        {
          heading: 'Recommendation',
          content: `Based on our analysis, we ${company.partnership_score >= 7 ? 'strongly recommend' : company.partnership_score >= 5 ? 'cautiously recommend' : 'recommend carefully evaluating'} pursuing a partnership with ${companyName}. ${company.has_competition ? 'Consider potential conflicts with existing partners before proceeding.' : 'No major conflicts were detected with existing partnerships.'} We suggest ${company.partnership_score >= 7 ? 'moving forward with comprehensive partnership discussions' : company.partnership_score >= 5 ? 'beginning with a limited engagement to validate partnership assumptions' : 'proceeding with caution and starting with a minimal commitment phase'} to maximize value and minimize risk.`
        }
      ]
    };
  };

  // Generate deep research content based on company data
  const generateDeepResearch = (company) => {
    const companyName = company?.name || '';
    const industry = company?.coresignal_data?.company_details?.industry || 'this industry';

    return {
      title: `Deep Research: ${companyName}`,
      type: 'research',
      sections: [
        {
          heading: 'Company Overview',
          content: `${companyName} is ${company.coresignal_data?.company_details?.description || company.description || `a company operating in ${industry}`}. ${company.coresignal_data?.company_details?.founded ? `Founded in ${company.coresignal_data.company_details.founded}, they` : 'They'} ${company.coresignal_data?.company_details?.headquarters ? `are headquartered in ${company.coresignal_data.company_details.headquarters}` : 'operate globally'}. ${company.coresignal_data?.company_details?.size ? `With a workforce falling in the range of ${company.coresignal_data.company_details.size}, they have established a ${company.partnership_score >= 7 ? 'significant' : company.partnership_score >= 5 ? 'notable' : 'developing'} presence in their market.` : ''}${company.coresignal_data?.company_details?.employee_count ? ` Their approximate employee count is ${company.coresignal_data.company_details.employee_count.toLocaleString()}.` : ''}`
        },
        {
          heading: 'Market Analysis',
          content: `In ${industry}, ${companyName} competes with several major players. Their partnership compatibility score of ${company.partnership_score}/10 suggests ${company.partnership_score >= 7 ? 'strong alignment' : company.partnership_score >= 5 ? 'potential alignment' : 'possible challenges'} with our strategic goals. ${company.coresignal_data?.company_details?.industry ? `They specialize in ${industry}, which ${company.partnership_score >= 7 ? 'complements our offerings' : company.partnership_score >= 5 ? 'partially aligns with our focus areas' : 'represents a distinct approach from our core business'}.` : ''} Market trends in this sector indicate ${company.partnership_score >= 7 ? 'growth opportunities through strategic partnerships' : company.partnership_score >= 5 ? 'selective partnership opportunities with careful positioning' : 'challenging conditions requiring precise partnership parameters'}. Current industry consolidation patterns suggest this is ${company.partnership_score >= 7 ? 'an optimal time' : company.partnership_score >= 5 ? 'a reasonable time' : 'a cautious time'} to pursue this partnership.`
        },
        {
          heading: 'Strategic Opportunities',
          content: `Potential collaboration areas with ${companyName} include co-marketing initiatives, product integrations, and market expansion opportunities. ${company.has_competition ? 'Note that there may be conflicts with existing partners that should be carefully managed.' : 'No major conflicts with existing partnerships were identified.'} We see particular value in ${company.partnership_score >= 7 ? 'comprehensive integration across product lines and marketing channels' : company.partnership_score >= 5 ? 'targeted collaborations in specific market segments' : 'limited, well-defined collaborative initiatives'}. Their ${company.coresignal_data?.company_details?.employee_count ? `social following of ${company.coresignal_data.company_details.employee_count.toLocaleString()} users` : 'market presence'} offers ${company.partnership_score >= 7 ? 'significant audience reach' : company.partnership_score >= 5 ? 'moderate audience expansion' : 'some additional market visibility'} for joint initiatives.`
        },
        {
          heading: 'Risk Assessment',
          content: `Primary risks in engaging with ${companyName} include ${company.has_competition ? 'conflicts with existing partners, ' : ''}market volatility in ${industry}, and potential resource alignment challenges. We recommend ${company.partnership_score >= 7 ? 'moving forward with clear boundaries' : company.partnership_score >= 5 ? 'a measured approach with defined milestones' : 'starting with a limited engagement to test compatibility'}. Specific risk mitigation strategies should include ${company.has_competition ? 'clear partnership scope definitions to avoid channel conflicts, ' : ''}${company.partnership_score >= 7 ? 'regular strategic alignment reviews' : company.partnership_score >= 5 ? 'quarterly performance assessments' : 'monthly progress evaluations'}, and ${company.partnership_score >= 7 ? 'flexible terms allowing for expansion' : company.partnership_score >= 5 ? 'moderate initial commitment with expansion options' : 'minimal initial resource commitment with clear exit parameters'}.`
        },
        {
          heading: 'Financial Considerations',
          content: `${company.linkedin_data?.funding_data ? `Based on their funding history (${company.linkedin_data.funding_data.lastFundingRound ? company.linkedin_data.funding_data.lastFundingRound.fundingType || 'recent funding' : 'funding activity'}), ${companyName} appears to be in a ${company.partnership_score >= 7 ? 'strong' : company.partnership_score >= 5 ? 'stable' : 'developing'} financial position.` : `Financial information for ${companyName} is limited, suggesting the need for due diligence before significant partnership investments.`} Partnership economics should be structured with ${company.partnership_score >= 7 ? 'balanced value exchange and long-term revenue sharing' : company.partnership_score >= 5 ? 'clear ROI metrics and moderate resource commitment' : 'minimal initial investment and performance-based scaling'} to optimize outcomes. We anticipate potential ROI from this partnership to be ${company.partnership_score >= 8 ? 'excellent' : company.partnership_score >= 6 ? 'good' : company.partnership_score >= 4 ? 'moderate' : 'uncertain'}, with payback period estimated at ${company.partnership_score >= 8 ? '6-12 months' : company.partnership_score >= 6 ? '12-18 months' : company.partnership_score >= 4 ? '18-24 months' : 'over 24 months'}.`
        }
      ]
    };
  };

  // Generate Perplexity research content based on company data
  const generatePerplexityResearch = (company) => {
    const companyName = company?.name || '';
    const industry = company?.coresignal_data?.company_details?.industry || 'this industry';

    return {
      title: `Perplexity Research: ${companyName}`,
      type: 'research',
      sections: [
        {
          heading: 'Company Overview',
          content: `${companyName} is ${company.coresignal_data?.company_details?.description || company.description || `a company operating in ${industry}`}. ${company.coresignal_data?.company_details?.founded ? `Founded in ${company.coresignal_data.company_details.founded}, they` : 'They'} ${company.coresignal_data?.company_details?.headquarters ? `are headquartered in ${company.coresignal_data.company_details.headquarters}` : 'operate globally'}. ${company.coresignal_data?.company_details?.size ? `With a workforce falling in the range of ${company.coresignal_data.company_details.size}, they have established a ${company.partnership_score >= 7 ? 'significant' : company.partnership_score >= 5 ? 'notable' : 'developing'} presence in their market.` : ''}${company.coresignal_data?.company_details?.employee_count ? ` Their approximate employee count is ${company.coresignal_data.company_details.employee_count.toLocaleString()}.` : ''}`
        },
        {
          heading: 'Market Analysis',
          content: `In ${industry}, ${companyName} competes with several major players. Their partnership compatibility score of ${company.partnership_score}/10 suggests ${company.partnership_score >= 7 ? 'strong alignment' : company.partnership_score >= 5 ? 'potential alignment' : 'possible challenges'} with our strategic goals. ${company.coresignal_data?.company_details?.industry ? `They specialize in ${industry}, which ${company.partnership_score >= 7 ? 'complements our offerings' : company.partnership_score >= 5 ? 'partially aligns with our focus areas' : 'represents a distinct approach from our core business'}.` : ''} Market trends in this sector indicate ${company.partnership_score >= 7 ? 'growth opportunities through strategic partnerships' : company.partnership_score >= 5 ? 'selective partnership opportunities with careful positioning' : 'challenging conditions requiring precise partnership parameters'}. Current industry consolidation patterns suggest this is ${company.partnership_score >= 7 ? 'an optimal time' : company.partnership_score >= 5 ? 'a reasonable time' : 'a cautious time'} to pursue this partnership.`
        },
        {
          heading: 'Strategic Opportunities',
          content: `Potential collaboration areas with ${companyName} include co-marketing initiatives, product integrations, and market expansion opportunities. ${company.has_competition ? 'Note that there may be conflicts with existing partners that should be carefully managed.' : 'No major conflicts with existing partnerships were identified.'} We see particular value in ${company.partnership_score >= 7 ? 'comprehensive integration across product lines and marketing channels' : company.partnership_score >= 5 ? 'targeted collaborations in specific market segments' : 'limited, well-defined collaborative initiatives'}. Their ${company.coresignal_data?.company_details?.employee_count ? `social following of ${company.coresignal_data.company_details.employee_count.toLocaleString()} users` : 'market presence'} offers ${company.partnership_score >= 7 ? 'significant audience reach' : company.partnership_score >= 5 ? 'moderate audience expansion' : 'some additional market visibility'} for joint initiatives.`
        },
        {
          heading: 'Risk Assessment',
          content: `Primary risks in engaging with ${companyName} include ${company.has_competition ? 'conflicts with existing partners, ' : ''}market volatility in ${industry}, and potential resource alignment challenges. We recommend ${company.partnership_score >= 7 ? 'moving forward with clear boundaries' : company.partnership_score >= 5 ? 'a measured approach with defined milestones' : 'starting with a limited engagement to test compatibility'}. Specific risk mitigation strategies should include ${company.has_competition ? 'clear partnership scope definitions to avoid channel conflicts, ' : ''}${company.partnership_score >= 7 ? 'regular strategic alignment reviews' : company.partnership_score >= 5 ? 'quarterly performance assessments' : 'monthly progress evaluations'}, and ${company.partnership_score >= 7 ? 'flexible terms allowing for expansion' : company.partnership_score >= 5 ? 'moderate initial commitment with expansion options' : 'minimal initial resource commitment with clear exit parameters'}.`
        },
        {
          heading: 'Financial Considerations',
          content: `${company.linkedin_data?.funding_data ? `Based on their funding history (${company.linkedin_data.funding_data.lastFundingRound ? company.linkedin_data.funding_data.lastFundingRound.fundingType || 'recent funding' : 'funding activity'}), ${companyName} appears to be in a ${company.partnership_score >= 7 ? 'strong' : company.partnership_score >= 5 ? 'stable' : 'developing'} financial position.` : `Financial information for ${companyName} is limited, suggesting the need for due diligence before significant partnership investments.`} Partnership economics should be structured with ${company.partnership_score >= 7 ? 'balanced value exchange and long-term revenue sharing' : company.partnership_score >= 5 ? 'clear ROI metrics and moderate resource commitment' : 'minimal initial investment and performance-based scaling'} to optimize outcomes. We anticipate potential ROI from this partnership to be ${company.partnership_score >= 8 ? 'excellent' : company.partnership_score >= 6 ? 'good' : company.partnership_score >= 4 ? 'moderate' : 'uncertain'}, with payback period estimated at ${company.partnership_score >= 8 ? '6-12 months' : company.partnership_score >= 6 ? '12-18 months' : company.partnership_score >= 4 ? '18-24 months' : 'over 24 months'}.`
        }
      ]
    };
  };

  const fetchPerplexityResearch = async (company) => {
    setIsPerplexityLoading(true);
    setPerplexityError(null);
    setSportsPartnerships(null); // Clear sports partnerships data
    try {
      const research = await getPerplexityPartnerResearch(company);

      // Update perplexityData with the research data
      if (research && research.data) {
        setPerplexityData(research.data);
        setShowPerplexitySection(true);

        // Extract sports partnerships
        const extractedSportsPartnerships = extractSportsPartnerships(research.data);
        setSportsPartnerships(extractedSportsPartnerships);

        // Store in research context
        await saveResearch(company, research.data, 'perplexity');
      }
    } catch (error) {
      setPerplexityError(error.message || 'Failed to load research from Perplexity.');
    } finally {
      setIsPerplexityLoading(false);
    }
  };

  useEffect(() => {
    if (company && !company.competes_with_partners && !company.has_competition && isOpen) {
      // Only fetch if we don't already have data
      if (!perplexityData) {
        fetchPerplexityResearch(company);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, isOpen, perplexityData]);

  const handleRefreshResearch = async () => {
    // Set refreshing state to true
    setIsRefreshing(true);

    // Clear existing data before refreshing
    setPerplexityData(null);
    setSportsPartnerships(null);
    setPerplexityError(null);

    try {
      // Force refresh the research data
      if (!company.competes_with_partners && !company.has_competition) {
        // For companies that don't compete, use fetchPerplexityResearch
        await fetchPerplexityResearch(company);
      } else {
        // For other companies, use the standard perplexity action
        await handleAction('perplexity', { forceRefresh: true });
      }
    } catch (error) {
      console.error('Error refreshing research:', error);
      alert('Failed to refresh research data. Please try again.');
    } finally {
      // Set refreshing state back to false
      setIsRefreshing(false);
    }
  };

  if (!company) return null;

  // Get company initials for logo fallback
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get logo URL using logo.dev API
  const getLogoUrl = (company) => {
    if (!company) return null;

    // Get domain from LinkedIn data website or from company name
    let domain = null;
    if (company.linkedin_data?.website) {
      // Extract domain from website URL
      domain = company.linkedin_data.website.replace(/^https?:\/\//i, '').split('/')[0];
    } else if (company.domain) {
      domain = company.domain;
    } else if (company.name) {
      // Try to guess domain from company name (simplified)
      domain = company.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
    }

    if (domain) {
      return `https://img.logo.dev/${domain}?token=pk_TCK5i8rzR92YmS65BY2fgQ&retina=true`;
    }

    return null;
  };

  // Format number with commas for readability
  const formatNumber = (num) => {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "";
  };

  // Safe currency formatter
  const formatCurrency = (amount, currencyCode = 'USD') => {
    try {
      // Handle empty or null values
      if (amount === null || amount === undefined || amount === '') {
        return '';
      }

      // Handle object with empty values
      if (typeof amount === 'object') {
        // Check if it's an empty object or has empty amount
        if (!amount ||
            Object.keys(amount).length === 0 ||
            amount.amount === '' ||
            amount.amount === undefined ||
            amount.amount === null) {
          return '';
        }
        // If it has an amount property, use that
        amount = amount.amount;
      }

      // Convert string to number (removing non-numeric chars except decimal)
      if (typeof amount === 'string') {
        amount = amount.replace(/[^0-9.]/g, '');
        amount = parseFloat(amount);
      }

      // Validate the number
      if (isNaN(amount) || amount === 0) {
        return '';
      }

      // Format with proper currency
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode || 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return '';
    }
  };

  // Helper function to get score category text
  const getScoreCategory = (score) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Average';
    return 'Poor';
  };

  // Helper function to get color based on score
  const getScoreColor = (score) => {
    score = parseFloat(score);
    if (score >= 9) return '#047857'; // Green
    if (score >= 8) return '#059669'; // Green
    if (score >= 7) return '#0284c7'; // Blue
    if (score >= 6) return '#0ea5e9'; // Blue
    if (score >= 5) return '#f59e0b'; // Yellow
    if (score >= 4) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const renderCompetitionSection = () => {
    if (!company) return null;

    const hasCompetition = company.has_competition || company.competes_with_partners;

    return (
      <>
        <SectionTitle>Compatibility</SectionTitle>
        <CompetitionSection $hasCompetition={hasCompetition}>
          <CompetitionHeader $hasCompetition={hasCompetition}>
            {hasCompetition ? (
              <>
                <XCircle size={20} weight="fill" />
                Potential Conflict with Existing Partners
              </>
            ) : (
              <>
                <CheckCircle size={20} weight="fill" />
                Compatible with Existing Partners
              </>
            )}
          </CompetitionHeader>
          {hasCompetition ? (
            <>
              <p>This company may compete with some of your existing partners. Consider reviewing your current partnerships before pursuing this opportunity.</p>

              {/* Display competing partners if available */}
              {company.competing_partners_details && company.competing_partners_details.length > 0 ? (
                <CompetitionDetails>
                  <DetailLabel>Conflicting Partners:</DetailLabel>
                  <CompanyList>
                    {company.competing_partners_details.map((partner, index) => (
                      <CompanyItem key={index}>
                        {partner.name}
                      </CompanyItem>
                    ))}
                  </CompanyList>
                </CompetitionDetails>
              ) : company.competing_partners && company.competing_partners.length > 0 ? (
                <CompetitionDetails>
                  <DetailLabel>Conflicting Partners:</DetailLabel>
                  <CompanyList>
                    {company.competing_partners.map((partnerName, index) => (
                      <CompanyItem key={index}>
                        {partnerName}
                      </CompanyItem>
                    ))}
                  </CompanyList>
                </CompetitionDetails>
              ) : null}
            </>
          ) : (
            <p>This company does not appear to compete with any of your existing partners, making it a good candidate for a new partnership.</p>
          )}
        </CompetitionSection>
      </>
    );
  };

  const renderCompanyData = () => {
    console.log('Attempting to render CoreSignal data for:', company.name);

    try {
      // First, check if the company has an explicit enrichError flag
      if (company.enrichError) {
        console.log('Company has explicit enrichError flag:', company.name);
        return null;
      }

      // Check if CoreSignal data exists and is an object
      if (!company.coresignal_data || typeof company.coresignal_data !== 'object') {
        console.log('CoreSignal data missing or invalid for company:', company.name);
        return null;
      }

      // Make sure coresignal_data has actual content
      const hasCompanyDetails = company.coresignal_data.company_details &&
                               Object.keys(company.coresignal_data.company_details).length > 0;
      if (!hasCompanyDetails) {
        console.log('CoreSignal company_details is empty for company:', company.name);
        return null;
      }

      const {
        website, linkedin_url, size, employee_count,
        industry, location, name, logo
      } = company.coresignal_data.company_details;

      // Check if this appears to be mock/dummy data
      if (!website && !linkedin_url) {
        console.log('CoreSignal data missing crucial URLs, likely mock data:', company.name);
        return null;
      }

      console.log('Rendering validated CoreSignal data:', company.name);

      return (
        <LinkedInSection>
          {linkedin_url && (
            <LinkedInLink href={linkedin_url} target="_blank" rel="noopener noreferrer">
              <LinkedinLogo size={20} weight="fill" /> View on LinkedIn
            </LinkedInLink>
          )}

          {website && (
            <LinkedInLink href={website} target="_blank" rel="noopener noreferrer">
              <Globe size={20} weight="fill" /> Visit Website
            </LinkedInLink>
          )}

          <InfoGrid>
            {location && (
              <InfoItem>
                <MapPin size={20} weight="fill" />
                <InfoContent>
                  <InfoLabel>Location</InfoLabel>
                  <InfoValue>{location}</InfoValue>
                </InfoContent>
              </InfoItem>
            )}

            {industry && (
              <InfoItem>
                <Buildings size={20} weight="fill" />
                <InfoContent>
                  <InfoLabel>Industry</InfoLabel>
                  <InfoValue>{industry}</InfoValue>
                </InfoContent>
              </InfoItem>
            )}

            {size && (
              <InfoItem>
                <UsersThree size={20} weight="fill" />
                <InfoContent>
                  <InfoLabel>Company Size</InfoLabel>
                  <InfoValue>{size}</InfoValue>
                </InfoContent>
              </InfoItem>
            )}

            {employee_count > 0 && (
              <InfoItem>
                <Users size={20} weight="fill" />
                <InfoContent>
                  <InfoLabel>Employee Count</InfoLabel>
                  <InfoValue>{formatNumber(employee_count)}</InfoValue>
                </InfoContent>
              </InfoItem>
            )}
          </InfoGrid>

          {logo && (
            <LogoContainer>
              <CompanyLogo src={`data:image/jpeg;base64,${logo}`} alt={`${company.name} logo`} />
            </LogoContainer>
          )}
        </LinkedInSection>
      );
    } catch (error) {
      console.error('Error rendering CoreSignal data:', error);
      return null;
    }
  };

  // Keep this function as an alias for backward compatibility
  const renderLinkedInData = renderCompanyData;

  // Extract sports partnerships from Perplexity research data
  const extractSportsPartnerships = (content) => {
    if (!content || typeof content !== 'string') return null;

    try {
      // Look for sports partnerships in the content
      const sportsKeywords = ['sports', 'arena', 'stadium', 'team', 'league', 'athlete', 'player', 'tournament', 'championship', 'olympics', 'world cup', 'nba', 'nfl', 'mlb', 'nhl', 'mls', 'uefa', 'fifa'];

      // Find the partnerships section
      const partnershipsSectionRegex = /## Partnerships & Strategy|## Partnerships|## Strategic Partnerships/i;
      const partnershipsSectionMatch = content.match(partnershipsSectionRegex);

      if (!partnershipsSectionMatch) return null;

      const partnershipsSectionStart = partnershipsSectionMatch.index;
      const nextSectionMatch = content.slice(partnershipsSectionStart + 1).match(/## [A-Za-z]/i);
      const partnershipsSectionEnd = nextSectionMatch ? partnershipsSectionStart + nextSectionMatch.index + 1 : content.length;

      const partnershipsSection = content.slice(partnershipsSectionStart, partnershipsSectionEnd);

      // Look for paragraphs or bullet points containing sports keywords
      const paragraphs = partnershipsSection.split(/\n+/);
      const sportsPartnerships = paragraphs.filter(paragraph => {
        return sportsKeywords.some(keyword => paragraph.toLowerCase().includes(keyword.toLowerCase()));
      });

      if (sportsPartnerships.length === 0) return null;

      return sportsPartnerships.join('\n\n');
    } catch (error) {
      console.error('Error extracting sports partnerships:', error);
      return null;
    }
  };

  // Format the Perplexity response into sections
  const formatPerplexityResponse = (response) => {
    try {
      // Handle empty responses
      if (!response || typeof response !== 'string' || response.trim() === '') {
        console.log("Empty or invalid Perplexity response");
        return [{
          heading: 'Analysis',
          content: 'No detailed information available at this time. Please try again later.'
        }];
      }

      // First, try to find numbered or clear headings
      const headingRegex = /(?:^|\n)((?:\d+\.\s*|#+\s*)[A-Z][A-Za-z\s:&]+)(?:\n|$)/g;
      let match;
      let sections = [];
      let lastIndex = 0;
      let foundHeadings = false;

      // Clone the response for regex operations
      let responseText = response;

      // Find all heading matches
      while ((match = headingRegex.exec(responseText)) !== null) {
        foundHeadings = true;
        const headingText = match[1].trim().replace(/^\d+\.\s*|#+\s*/, '');
        const startPos = match.index + match[0].indexOf(match[1]);

        // If this isn't the first heading, add the previous section
        if (sections.length > 0) {
          const prevSection = sections[sections.length - 1];
          prevSection.content = responseText.substring(prevSection.startPos + prevSection.heading.length, startPos).trim();
        }

        sections.push({
          heading: headingText,
          startPos: startPos
        });

        lastIndex = startPos + headingText.length;
      }

      // Add the final section
      if (sections.length > 0) {
        const lastSection = sections[sections.length - 1];
        lastSection.content = responseText.substring(lastSection.startPos + lastSection.heading.length).trim();

        // Clean up the sections by removing the startPos property
        sections = sections.map(({ heading, content }) => ({ heading, content }));
      }

      // If no headings were found, fall back to paragraph-based sectioning
      if (!foundHeadings) {
        console.log("No clear headings found, using paragraph-based sectioning");

        // Split the response into paragraphs
        const paragraphs = response.split('\n\n').filter(p => p.trim().length > 0);

        if (paragraphs.length === 0) {
          return [{
            heading: 'Analysis',
            content: response
          }];
        }

        // Try to identify sections - paragraphs that might be headers
        let currentSection = null;

        paragraphs.forEach(paragraph => {
          const trimmedParagraph = paragraph.trim();
          // Check if this is a likely header (short, ends with colon, or has specific words)
          const isLikelyHeader =
            (trimmedParagraph.length < 50 &&
             (trimmedParagraph.endsWith(':') ||
              /^(overview|business model|revenue|competitors|leadership|market|growth|conclusion|summary)/i.test(trimmedParagraph)));

          if (isLikelyHeader) {
            // Start a new section
            currentSection = {
              heading: trimmedParagraph.replace(/:$/, ''),
              content: ''
            };
            sections.push(currentSection);
          } else if (currentSection) {
            // Add to existing section
            currentSection.content += (currentSection.content ? '\n\n' : '') + trimmedParagraph;
          } else {
            // No section yet, create first default one
            currentSection = {
              heading: 'Overview',
              content: trimmedParagraph
            };
            sections.push(currentSection);
          }
        });
      }

      // If we still couldn't identify any sections, return the whole thing as one section

      // If we couldn't identify any sections, return the whole thing as one section
      if (sections.length === 0) {
        return [{
          heading: 'Analysis',
          content: response
        }];
      }

      return sections;
    } catch (error) {
      console.error('Error formatting Perplexity response:', error);
      return [{
        heading: 'Error',
        content: 'There was a problem processing the research data. Please try again later.'
      }];
    }
  };

  // Format OpenAI response into sections
  const formatOpenAIResponse = (response) => {
    if (!response) return [];

    try {
      // First try to parse as JSON
      let jsonData;

      // Check if response is already a JSON object
      if (typeof response === 'object' && !Array.isArray(response)) {
        jsonData = response;
        console.log("Response is already a JSON object");
      } else if (typeof response === 'string') {
        try {
          // Sometimes the JSON might be embedded in markdown or have extra text
          // Try to extract JSON using regex
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonData = JSON.parse(jsonMatch[0]);
          } else {
            jsonData = JSON.parse(response);
          }
        } catch (jsonError) {
          console.log("Response is not valid JSON, falling back to markdown parsing", jsonError);
        }
      }

      // If we have JSON data, format it into sections
      if (jsonData) {
        console.log("JSON data parsed successfully:", jsonData);
        const sections = [];

        // Company Overview section
        if (jsonData.brand) {
          let overviewContent = `<p><strong>Description:</strong> ${jsonData.brand.description || 'Not available'}</p>`;
          overviewContent += `<p><strong>Headquarters:</strong> ${jsonData.brand.headquarters || 'Not available'}</p>`;
          overviewContent += `<p><strong>Founded:</strong> ${jsonData.brand.founded || 'Not available'}</p>`;

          if (jsonData.brand.employee_count) {
            overviewContent += `<p><strong>Employees:</strong> ${jsonData.brand.employee_count}</p>`;
          }

          if (jsonData.brand.annual_revenue) {
            overviewContent += `<p><strong>Annual Revenue:</strong> ${jsonData.brand.annual_revenue}</p>`;
          }

          if (jsonData.brand.mission_statement) {
            overviewContent += `<p><strong>Mission:</strong> ${jsonData.brand.mission_statement}</p>`;
          }

          // Products and services
          if (jsonData.brand.products_services && jsonData.brand.products_services.length > 0) {
            overviewContent += `<p><strong>Products & Services:</strong></p><ul>`;
            jsonData.brand.products_services.forEach(item => {
              overviewContent += `<li>${item}</li>`;
            });
            overviewContent += `</ul>`;
          }

          sections.push({
            heading: 'Company Overview',
            content: overviewContent
          });
        }

        // Leadership section
        if (jsonData.brand && jsonData.brand.leadership && jsonData.brand.leadership.length > 0) {
          let leadershipContent = `<div class="leadership-grid">`;
          jsonData.brand.leadership.forEach(leader => {
            leadershipContent += `<div class="leadership-card">`;
            leadershipContent += `<h4>${leader.name || 'Unknown'}</h4>`;
            leadershipContent += `<p>${leader.title || 'Unknown'}</p>`;
            if (leader.linkedin) {
              leadershipContent += `<a href="${leader.linkedin}" target="_blank" rel="noopener noreferrer" class="linkedin-link">LinkedIn Profile</a>`;
            }
            leadershipContent += `</div>`;
          });
          leadershipContent += `</div>`;

          // Add some CSS for the leadership grid
          leadershipContent = `
            <style>
              .leadership-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 16px;
                margin-top: 16px;
              }
              .leadership-card {
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                padding: 16px;
                background-color: #f9f9f9;
              }
              .leadership-card h4 {
                margin: 0 0 8px 0;
                color: #2563eb;
              }
              .leadership-card p {
                margin: 0 0 12px 0;
                font-size: 14px;
                color: #4b5563;
              }
              .linkedin-link {
                display: inline-block;
                font-size: 13px;
                color: #0077b5;
                text-decoration: none;
                padding: 4px 8px;
                border: 1px solid #0077b5;
                border-radius: 4px;
              }
              .linkedin-link:hover {
                background-color: #0077b5;
                color: white;
              }
            </style>
          ` + leadershipContent;

          sections.push({
            heading: 'Leadership Team',
            content: leadershipContent
          });
        }

        // Financial Insights section
        if (jsonData.brand && jsonData.brand.financial_insights) {
          const financial = jsonData.brand.financial_insights;
          let financialContent = `<div class="financial-insights">`;

          if (financial.annual_revenue) {
            financialContent += `<p><strong>Annual Revenue:</strong> ${financial.annual_revenue}</p>`;
          }

          if (financial.revenue_trend) {
            financialContent += `<p><strong>Revenue Trend:</strong> ${financial.revenue_trend}</p>`;
          }

          if (financial.market_cap) {
            financialContent += `<p><strong>Market Cap:</strong> ${financial.market_cap}</p>`;
          }

          if (financial.recent_investments) {
            financialContent += `<p><strong>Recent Investments:</strong> ${financial.recent_investments}</p>`;
          }

          if (financial.notable_financial_events) {
            financialContent += `<p><strong>Notable Financial Events:</strong> ${financial.notable_financial_events}</p>`;
          }

          financialContent += `</div>`;

          sections.push({
            heading: 'Financial Insights',
            content: financialContent
          });
        }

        // Key Competitors section
        if (jsonData.brand && jsonData.brand.key_competitors && jsonData.brand.key_competitors.length > 0) {
          let competitorsContent = `<ul class="competitors-list">`;
          jsonData.brand.key_competitors.forEach(competitor => {
            competitorsContent += `<li><strong>${competitor.name}</strong> - ${competitor.market_position || 'Competitor'}</li>`;
          });
          competitorsContent += `</ul>`;

          sections.push({
            heading: 'Key Competitors',
            content: competitorsContent
          });
        }

        // Current Marketing Campaigns
        if (jsonData.brand && jsonData.brand.current_marketing_campaigns && jsonData.brand.current_marketing_campaigns.length > 0) {
          let campaignsContent = `<div class="campaigns-container">`;
          jsonData.brand.current_marketing_campaigns.forEach(campaign => {
            campaignsContent += `<div class="campaign-card">`;
            campaignsContent += `<h4>${campaign.name || 'Unknown Campaign'}</h4>`;
            if (campaign.summary) {
              campaignsContent += `<p>${campaign.summary}</p>`;
            }
            if (campaign.start_date || campaign.channels) {
              campaignsContent += `<div class="campaign-details">`;
              if (campaign.start_date) {
                campaignsContent += `<span class="campaign-date">Started: ${campaign.start_date}</span>`;
              }
              if (campaign.channels && campaign.channels.length > 0) {
                campaignsContent += `<div class="campaign-channels">`;
                campaign.channels.forEach(channel => {
                  campaignsContent += `<span class="channel-tag">${channel}</span>`;
                });
                campaignsContent += `</div>`;
              }
              campaignsContent += `</div>`;
            }
            campaignsContent += `</div>`;
          });
          campaignsContent += `</div>`;

          // Add some CSS for the campaigns
          campaignsContent = `
            <style>
              .campaigns-container {
                display: flex;
                flex-direction: column;
                gap: 16px;
              }
              .campaign-card {
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                padding: 16px;
                background-color: #f9f9f9;
              }
              .campaign-card h4 {
                margin: 0 0 8px 0;
                color: #2563eb;
              }
              .campaign-details {
                margin-top: 8px;
                font-size: 13px;
                color: #64748b;
              }
              .campaign-date {
                display: block;
                margin-bottom: 4px;
              }
              .campaign-channels {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-top: 6px;
              }
              .channel-tag {
                background-color: #e2e8f0;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 12px;
              }
            </style>
          ` + campaignsContent;

          sections.push({
            heading: 'Current Marketing Campaigns',
            content: campaignsContent
          });
        }

        // Recent News section
        if (jsonData.brand && jsonData.brand.recent_news && jsonData.brand.recent_news.length > 0) {
          let newsContent = `<ul class="news-list">`;
          jsonData.brand.recent_news.forEach(news => {
            newsContent += `<li class="news-item">`;
            if (news.url) {
              newsContent += `<a href="${news.url}" target="_blank" rel="noopener noreferrer"><strong>${news.title || 'News Item'}</strong></a>`;
            } else {
              newsContent += `<strong>${news.title || 'News Item'}</strong>`;
            }
            if (news.date) {
              newsContent += ` <span class="news-date">(${news.date})</span>`;
            }
            newsContent += `</li>`;
          });
          newsContent += `</ul>`;

          // Add some CSS for the news list
          newsContent = `
            <style>
              .news-list {
                padding-left: 20px;
              }
              .news-item {
                margin-bottom: 12px;
              }
              .news-date {
                color: #64748b;
                font-size: 13px;
              }
            </style>
          ` + newsContent;

          sections.push({
            heading: 'Recent News',
            content: newsContent
          });
        }

        // Partnerships section
        if (jsonData.brand &&
            ((jsonData.brand.current_partnerships && jsonData.brand.current_partnerships.length > 0) ||
             (jsonData.brand.past_partnerships && jsonData.brand.past_partnerships.length > 0))) {

          let partnershipsContent = '';

          if (jsonData.brand.current_partnerships && jsonData.brand.current_partnerships.length > 0) {
            partnershipsContent += `<p><strong>Current Partnerships:</strong></p><ul>`;
            jsonData.brand.current_partnerships.forEach(partnership => {
              partnershipsContent += `<li><strong>${partnership.partner || 'Unknown'}</strong>: ${partnership.details || 'No details available'}</li>`;
            });
            partnershipsContent += `</ul>`;
          }

          if (jsonData.brand.past_partnerships && jsonData.brand.past_partnerships.length > 0) {
            partnershipsContent += `<p><strong>Past Partnerships:</strong></p><ul>`;
            jsonData.brand.past_partnerships.forEach(partnership => {
              partnershipsContent += `<li><strong>${partnership.partner || 'Unknown'}</strong>: ${partnership.details || 'No details available'}</li>`;
            });
            partnershipsContent += `</ul>`;
          }

          sections.push({
            heading: 'Partnerships',
            content: partnershipsContent
          });
        }

        // Key Takeaways section
        if (jsonData.key_takeaways && jsonData.key_takeaways.length > 0) {
          let takeawaysContent = `<ul class="takeaways-list">`;
          jsonData.key_takeaways.forEach(takeaway => {
            takeawaysContent += `<li class="takeaway-item">${takeaway}</li>`;
          });
          takeawaysContent += `</ul>`;

          // Add some CSS for the takeaways
          takeawaysContent = `
            <style>
              .takeaways-list {
                padding-left: 0;
                list-style-type: none;
              }
              .takeaway-item {
                position: relative;
                padding: 8px 12px 8px 32px;
                margin-bottom: 12px;
                background-color: #f0f9ff;
                border-radius: 8px;
                border-left: 4px solid #3b82f6;
                color: #000000;
              }
              .takeaway-item:before {
                content: '→';
                position: absolute;
                left: 12px;
                color: #3b82f6;
                font-weight: bold;
              }
            </style>
          ` + takeawaysContent;

          sections.push({
            heading: 'Key Takeaways',
            content: takeawaysContent
          });
        }

        // MLSE Partnership Fit section
        if (jsonData.alignment_with_mlse) {
          let fitContent = '';

          if (jsonData.alignment_with_mlse.values_alignment) {
            fitContent += `<p><strong>Values Alignment:</strong> ${jsonData.alignment_with_mlse.values_alignment}</p>`;
          }

          if (jsonData.alignment_with_mlse.target_audience_overlap) {
            fitContent += `<p><strong>Target Audience Overlap:</strong> ${jsonData.alignment_with_mlse.target_audience_overlap}</p>`;
          }

          if (jsonData.alignment_with_mlse.marketing_objectives_alignment) {
            fitContent += `<p><strong>Marketing Objectives Alignment:</strong> ${jsonData.alignment_with_mlse.marketing_objectives_alignment}</p>`;
          }

          sections.push({
            heading: 'MLSE Partnership Fit',
            content: fitContent
          });
        }

        // Recommended Partnership Opportunities section
        if (jsonData.recommended_partnership_opportunities && jsonData.recommended_partnership_opportunities.length > 0) {
          let opportunitiesContent = `<div class="opportunities-container">`;
          jsonData.recommended_partnership_opportunities.forEach(opportunity => {
            opportunitiesContent += `<div class="opportunity-card">`;
            opportunitiesContent += `<div class="opportunity-header">`;
            opportunitiesContent += `<h4>${opportunity.mlse_asset || 'Unknown Asset'}</h4>`;
            if (opportunity.fit_score) {
              opportunitiesContent += `<div class="fit-score-badge" style="background-color: ${getScoreColor(opportunity.fit_score)}">
                <span class="fit-score">${parseFloat(opportunity.fit_score).toFixed(1)}</span>
                <span class="fit-score-label">Fit Score</span>
              </div>`;
            }
            opportunitiesContent += `</div>`;
            if (opportunity.category) {
              opportunitiesContent += `<div class="category-tag">${opportunity.category}</div>`;
            }
            opportunitiesContent += `<p>${opportunity.opportunity_details || 'No details available'}</p>`;
            opportunitiesContent += `</div>`;
          });
          opportunitiesContent += `</div>`;

          // Add some CSS for the opportunities
          opportunitiesContent = `
            <style>
              .opportunities-container {
                display: flex;
                flex-direction: column;
                gap: 16px;
              }
              .opportunity-card {
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                padding: 16px;
                background-color: #f0f9ff;
              }
              .opportunity-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
              }
              .opportunity-card h4 {
                margin: 0;
                color: #0369a1;
              }
              .opportunity-card p {
                margin: 8px 0 0 0;
                color: #334155;
              }
              .fit-score-badge {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-width: 50px;
                height: 50px;
                border-radius: 50%;
                color: white;
                padding: 4px;
              }
              .fit-score {
                font-weight: bold;
                font-size: 14px;
              }
              .fit-score-label {
                font-size: 10px;
              }
              .category-tag {
                display: inline-block;
                font-size: 12px;
                background-color: #e0f2fe;
                color: #0369a1;
                padding: 3px 8px;
                border-radius: 12px;
                margin-bottom: 8px;
              }
            </style>
          ` + opportunitiesContent;

          sections.push({
            heading: 'Recommended Partnership Opportunities',
            content: opportunitiesContent
          });
        }

        // Social Media Links section
        if (jsonData.brand && jsonData.brand.social_media) {
          let socialContent = `<div class="social-media-container">`;
          const socialMedia = jsonData.brand.social_media;

          if (socialMedia.linkedin) {
            socialContent += `<a href="${socialMedia.linkedin}" target="_blank" rel="noopener noreferrer" class="social-link linkedin">LinkedIn</a>`;
          }

          if (socialMedia.twitter) {
            socialContent += `<a href="${socialMedia.twitter}" target="_blank" rel="noopener noreferrer" class="social-link twitter">Twitter/X</a>`;
          }

          if (socialMedia.facebook) {
            socialContent += `<a href="${socialMedia.facebook}" target="_blank" rel="noopener noreferrer" class="social-link facebook">Facebook</a>`;
          }

          if (socialMedia.instagram) {
            socialContent += `<a href="${socialMedia.instagram}" target="_blank" rel="noopener noreferrer" class="social-link instagram">Instagram</a>`;
          }

          if (socialMedia.tiktok) {
            socialContent += `<a href="${socialMedia.tiktok}" target="_blank" rel="noopener noreferrer" class="social-link tiktok">TikTok</a>`;
          }

          if (socialMedia.youtube) {
            socialContent += `<a href="${socialMedia.youtube}" target="_blank" rel="noopener noreferrer" class="social-link youtube">YouTube</a>`;
          }

          socialContent += `</div>`;

          // Add some CSS for the social links
          socialContent = `
            <style>
              .social-media-container {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                margin-top: 16px;
              }
              .social-link {
                display: inline-flex;
                align-items: center;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                text-decoration: none;
                color: white;
              }
              .social-link:hover {
                opacity: 0.9;
              }
              .linkedin {
                background-color: #0077b5;
              }
              .twitter {
                background-color: #1da1f2;
              }
              .facebook {
                background-color: #4267B2;
              }
              .instagram {
                background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
              }
              .tiktok {
                background-color: #000000;
              }
              .youtube {
                background-color: #FF0000;
              }
            </style>
          ` + socialContent;

          sections.push({
            heading: 'Social Media Links',
            content: socialContent
          });
        }

        // Summary section
        if (jsonData.summary) {
          let summaryContent = `<div class="summary-box">${jsonData.summary}</div>`;

          // Add some CSS for the summary
          summaryContent = `
            <style>
              .summary-box {
                background-color: #f0f9ff;
                border-left: 4px solid #2563eb;
                padding: 16px;
                border-radius: 0 8px 8px 0;
                font-style: italic;
                color: #334155;
              }
            </style>
          ` + summaryContent;

          sections.push({
            heading: 'Summary',
            content: summaryContent
          });
        }

        // If we have sections, return them
        if (sections.length > 0) {
          return sections;
        }
      }

      // Fallback to markdown parsing if JSON parsing fails or no JSON is found
      const sections = [];
      const lines = response.split('\n');
      let currentHeading = '';
      let currentContent = [];

      for (const line of lines) {
        if (line.startsWith('# ')) {
          // Main title, skip
          continue;
        } else if (line.startsWith('## ')) {
          // If we have a previous section, add it
          if (currentHeading) {
            sections.push({
              heading: currentHeading,
              content: currentContent.join('\n')
            });
          }

          // Start a new section
          currentHeading = line.replace('## ', '');
          currentContent = [];
        } else {
          // Add to current content
          currentContent.push(line);
        }
      }

      // Add the last section
      if (currentHeading) {
        sections.push({
          heading: currentHeading,
          content: currentContent.join('\n')
        });
      }

      // If no sections were found or parsing failed, create a default section
      if (sections.length === 0) {
        sections.push({
          heading: 'Research Results',
          content: response
        });
      }

      return sections;
    } catch (error) {
      console.error("Error formatting OpenAI response:", error);
      return [{
        heading: 'Research Results',
        content: response
      }];
    }
  };

  // Format section content for better display
  const formatSectionContent = (content) => {
    if (!content) return '';

    // Check if the content already has HTML formatting
    if (content.includes('<p>') || content.includes('<br>') || content.includes('<ul>')) {
      return content;
    }

    // Convert line breaks to paragraphs
    let formattedContent = content
      .split('\n\n')
      .map(paragraph => `<p>${paragraph.trim()}</p>`)
      .join('');

    // Convert single line breaks to <br> tags
    formattedContent = formattedContent.replace(/<p>(.*?)\n(.*?)<\/p>/g, '<p>$1<br>$2</p>');

    // Handle bullet points
    formattedContent = formattedContent.replace(/<p>(\s*[-•*]\s.*?)<\/p>/g, '<ul><li>$1</li></ul>');
    formattedContent = formattedContent.replace(/<\/ul>\s*<ul>/g, '');
    formattedContent = formattedContent.replace(/(?<=<li>.*?)<br>(?=\s*[-•*]\s)/g, '</li><li>');
    formattedContent = formattedContent.replace(/(?<=<li>)(\s*[-•*]\s)/g, '');

    // Handle bold text
    formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    return formattedContent;
  };

  // Create modal container variants for animation
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.175, 0.885, 0.32, 1.275],
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  // Handle toggling favorite status
  const handleToggleFavorite = () => {
    if (company) {
      toggleFavorite(company);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
          <ModalBackdrop
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          >
            {isLoading && (
              <LoadingContainer style={{ position: 'absolute', zIndex: 10 }}>
                <Spinner
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 0.8
                  }}
                >
                  {/* SpinnerGap icon hidden */}
                  <div></div>
                </Spinner>
              </LoadingContainer>
            )}
          <ModalContainer
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={e => e.stopPropagation()}
          >
            <CloseButton
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={24} weight="bold" />
            </CloseButton>

            <ModalHeader>
              <ModalCompanyHeader>
                <CompanyLogo>
                  {getLogoUrl(company) ? (
                    <img src={getLogoUrl(company)} alt={`${company.name} logo`} />
                  ) : (
                    getInitials(company.name)
                  )}
                </CompanyLogo>
                <CompanyDetails>
                  <CompanyName>
                    {company.name}
                  </CompanyName>
                  <CompanyDescription>
                    {company.description || company.linkedin_data?.description || 'No description available.'}
                  </CompanyDescription>
                </CompanyDetails>
                <HeaderScoreCircle
                  score={company.partnership_score}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  <CircularProgress score={company.partnership_score} />
                  <ScoreIndicator
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.2, 0.3, 0.2]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "easeInOut"
                    }}
                  />
                  <ScoreValue
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1
                    }}
                    transition={{ delay: 0.3, type: "spring" }}
                    whileHover={{ scale: 1.1 }}
                  >
                    {Math.round(company.partnership_score)}
                    <ScoreLabel>/10</ScoreLabel>
                  </ScoreValue>
                  <ScoreCategory score={company.partnership_score}>
                    {getScoreCategory(company.partnership_score)}
                  </ScoreCategory>
                </HeaderScoreCircle>
              </ModalCompanyHeader>
            </ModalHeader>

            {/* Company Module Buttons */}
            <ModuleButtonsContainer>
              {companyModules.map((module, index) => (
                <ModuleButton
                  key={module.id}
                  active={activeCompanyModule === module.id}
                  onClick={() => toggleCompanyModule(module.id)}
                >
                  {module.label}
                </ModuleButton>
              ))}
            </ModuleButtonsContainer>

            {/* Dynamic Company Module Display */}
            {activeCompanyModule && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                style={{ width: '95%', margin: '0 auto 2rem auto' }}
              >
                {renderCompanyModule()}
              </motion.div>
            )}

            <ModalBody>
              <ModalSection
                variants={sectionVariants}
              >
                <SectionTitle>
                  <Rocket size={20} weight="fill" />
                  Actions
                </SectionTitle>
                <ActionButtonsContainer>
                  {[
                    {
                      icon: <Star weight={isFavorite(company) ? "fill" : "regular"} />,
                      label: isFavorite(company) ? 'Unfavorite' : 'Favorite',
                      action: 'toggle-favorite',
                      variant: isFavorite(company) ? 'primary' : 'secondary'
                    },
                    { icon: <Brain weight="fill" />, label: 'Analysis', action: 'ai-analysis', variant: 'primary', isLoading: isAnalyzing && aiAnalysis?.type === 'analysis' },
                    { icon: <MagnifyingGlass weight="fill" />, label: 'Research', action: 'deep-research', variant: 'secondary', isLoading: isAnalyzing && aiAnalysis?.type === 'research' },
                    // Only show PDF export button if we have research data
                    ...(perplexityData || aiAnalysis ? [{
                      icon: <FilePdf weight="fill" />,
                      label: 'Export PDF',
                      action: 'export-pdf',
                      variant: 'secondary'
                    }] : []),
                  ].map((button, index) => (
                    <IconButtonContainer key={button.action} index={index}>
                      <IconButton
                        variant={button.variant}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => button.action === 'toggle-favorite' ? handleToggleFavorite() : handleAction(button.action)}
                        disabled={isAnalyzing || isPerplexityLoading}
                      >
                        {button.isLoading ? (
                          <div></div>
                        ) : button.icon}
                      </IconButton>
                      <IconLabel>{button.label}</IconLabel>
                    </IconButtonContainer>
                  ))}
                </ActionButtonsContainer>
              </ModalSection>

              {/* Compatibility Section - Now placed side by side with Actions */}
              <ModalSection variants={sectionVariants}>
                {renderCompetitionSection()}
              </ModalSection>

              {/* Perplexity AI Research Results Section */}
              {(showPerplexitySection || !company.competes_with_partners && !company.has_competition) && (isPerplexityLoading || perplexityData) && (
                <ModalSection
                  variants={sectionVariants}
                  style={{ gridColumn: '1 / -1', minHeight: '300px', width: '100%' }}
                >
                  <SectionTitle style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Rocket size={20} weight="fill" />
                      {isPerplexityLoading ? 'Perplexity AI Researching...' : 'Perplexity AI Research'}
                    </div>
                    {!isPerplexityLoading && perplexityData && (
                      <RefreshButton
                        onClick={handleRefreshResearch}
                        disabled={isPerplexityLoading || isRefreshing}
                      >
                        {isRefreshing ? (
                          <>
                            <SpinnerGap size={16} weight="bold" className="spin-animation" />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <ArrowsClockwise size={16} weight="bold" />
                            Refresh Data
                          </>
                        )}
                      </RefreshButton>
                    )}
                  </SectionTitle>

                  {isPerplexityLoading ? (
                    <AnalysisLoadingContainer>
                      <AnalysisLoadingAnimation />
                      <AnalysisLoadingText>
                        Perplexity AI is researching comprehensive details about {company.name}...
                      </AnalysisLoadingText>
                    </AnalysisLoadingContainer>
                  ) : (
                    <AnalysisResults>
                      {sportsPartnerships && (
                        <div className="sports-partnerships-highlight">
                          <h3 style={{ color: '#6366F1', marginBottom: '10px' }}>
                            <UsersThree size={20} weight="fill" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            Sports & Marketing Partnerships
                          </h3>
                          <div className="markdown-content" style={{
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            padding: '15px',
                            borderRadius: '8px',
                            borderLeft: '4px solid #6366F1',
                            marginBottom: '20px'
                          }}>
                            <EnhancedMarkdown content={sportsPartnerships} />
                          </div>
                        </div>
                      )}
                      {perplexityData && (
                        <div className="markdown-content">
                          <EnhancedMarkdown content={perplexityData} />
                        </div>
                      )}
                      {perplexityError && (
                        <ErrorContainer>
                          <ErrorIcon>
                            <XCircle size={32} weight="bold" />
                          </ErrorIcon>
                          <ErrorText>{perplexityError}</ErrorText>
                          <ErrorHint>
                            {perplexityError.includes('API') && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                                <RefreshButton
                                  onClick={handleRefreshResearch}
                                  disabled={isRefreshing}
                                >
                                  {isRefreshing ? (
                                    <>
                                      <SpinnerGap size={16} weight="bold" className="spin-animation" />
                                      Trying Again...
                                    </>
                                  ) : (
                                    <>
                                      <ArrowsClockwise size={16} weight="bold" />
                                      Try Again
                                    </>
                                  )}
                                </RefreshButton>
                                <RefreshButton
                                  onClick={() => handleAction('openai')}
                                  style={{ backgroundColor: '#4A6CF7' }}
                                >
                                  <MagnifyingGlass size={16} weight="bold" />
                                  Try Web Search Instead
                                </RefreshButton>
                              </div>
                            )}
                          </ErrorHint>
                        </ErrorContainer>
                      )}
                    </AnalysisResults>
                  )}
                </ModalSection>
              )}

              {/* AI Analysis or Deep Research Results Section */}
              {(isAnalyzing || aiAnalysis) && !isPerplexityLoading && !perplexityData && (
                <ModalSection
                  variants={sectionVariants}
                  style={{ gridColumn: '1 / -1', minHeight: '300px', width: '100%' }}
                >
                  <SectionTitle>
                    {aiAnalysis?.type === 'research' ? (
                      <MagnifyingGlass size={20} weight="fill" />
                    ) : (
                      <Brain size={20} weight="fill" />
                    )}
                    {isAnalyzing ? 'Generating Analysis...' : aiAnalysis?.title}
                  </SectionTitle>

                  {isAnalyzing ? (
                    <AnalysisLoadingContainer>
                      <AnalysisLoadingAnimation />
                      <AnalysisLoadingText>
                        {aiAnalysis?.type === 'research'
                          ? 'Researching company data, market information, and strategic fit'
                          : 'Analyzing company profile, compatibility, and partnership potential'}<TypingDots />
                      </AnalysisLoadingText>
                    </AnalysisLoadingContainer>
                  ) : (
                    <AnalysisResults>
                      <AnalysisHeader>
                        <AnalysisTitle>{aiAnalysis.title}</AnalysisTitle>
                        {!isAnalyzing && aiAnalysis?.sections?.length > 0 && (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <RefreshButton
                              onClick={handleRefreshResearch}
                              disabled={isAnalyzing || isRefreshing}
                            >
                              {isRefreshing ? (
                                <>
                                  <SpinnerGap size={20} weight="bold" className="spin-animation" />
                                  Refreshing...
                                </>
                              ) : (
                                <>
                                  <ArrowsClockwise size={20} weight="bold" />
                                  Refresh Data
                                </>
                              )}
                            </RefreshButton>
                            <RefreshButton
                              onClick={() => exportResearchAsPDF(company.name)}
                              disabled={isAnalyzing}
                              title="Export as PDF"
                            >
                              <FilePdf size={20} weight="bold" />
                              Export PDF
                            </RefreshButton>
                          </div>
                        )}
                      </AnalysisHeader>
                      {aiAnalysis.sections.map((section, index) => (
                        <AnalysisSection
                          key={index}
                          as={motion.div}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <AnalysisSectionHeader>
                            {section.heading}
                          </AnalysisSectionHeader>
                          <AnalysisSectionContent>
                            <EnhancedMarkdown content={section.content} />
                          </AnalysisSectionContent>
                        </AnalysisSection>
                      ))}
                      {aiAnalysis?.sections?.length > 0 && (
                        <AnalysisFooter>
                          {aiAnalysis.isCached ? (
                            <React.Fragment>
                              Cached research from {aiAnalysis.source || 'AI'}{' '}
                              {aiAnalysis.createdAt && `(created on ${new Date(aiAnalysis.createdAt).toLocaleDateString()})`}
                            </React.Fragment>
                          ) : (
                            `Powered by ${aiAnalysis.source || 'OpenAI'}`
                          )}
                        </AnalysisFooter>
                      )}
                    </AnalysisResults>
                  )}
                </ModalSection>
              )}

              {/* Perplexity Research Section has been combined with the section above */}

              {/* LinkedIn Data Section - Now a full column */}
              {/* Commented out LinkedIn data component
              {company.linkedin_data && company.linkedin_data.url && (() => {
                // Get LinkedIn data for validation
                const linkedInData = renderLinkedInData();

                // If renderLinkedInData returned null, don't show the section
                if (!linkedInData) {
                  return null;
                }

                return (
                  <ModalSection variants={sectionVariants} style={{ gridColumn: '1 / -1' }}>
                    <SectionTitle>
                      <LinkedinLogo size={20} weight="fill" />
                      LinkedIn Data
                    </SectionTitle>
                    {linkedInData}
                  </ModalSection>
                );
              })()}
              */}

              {/* LinkedIn Data Loading State */}
              {/* Commented out LinkedIn data loading state
              {isEnriching && (
                <ModalSection variants={sectionVariants} style={{ gridColumn: '1 / -1' }}>
                  <SectionTitle>
                    <LinkedinLogo size={20} weight="fill" />
                    LinkedIn Data
                  </SectionTitle>
                  <LoadingContainer>
                    <Spinner
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <SpinnerGap size={32} weight="bold" />
                    </Spinner>
                    <LoadingText>Loading LinkedIn data...</LoadingText>
                  </LoadingContainer>
                </ModalSection>
              )}
              */}

              {/* LinkedIn Data Error State */}
              {/* Commented out LinkedIn data error state
              {!isEnriching && (
                (!company.linkedin_data || !company.linkedin_data.url || company.enrichError)
              ) && (
                <ModalSection variants={sectionVariants} style={{ gridColumn: '1 / -1' }}>
                  <SectionTitle>
                    <LinkedinLogo size={20} weight="fill" />
                    LinkedIn Data
                  </SectionTitle>
                  <ErrorContainer>
                    <ErrorIcon>
                      <XCircle size={32} weight="bold" />
                    </ErrorIcon>
                    <ErrorText>LinkedIn data not available</ErrorText>
                    <ErrorHint>Try searching for another company with a LinkedIn presence.</ErrorHint>
                  </ErrorContainer>
                </ModalSection>
              )}
              */}

              {company.company_data && (
                <ModalSection variants={sectionVariants} style={{ gridColumn: '1 / -1' }}>
                  <SectionTitle>
                    <Buildings size={20} weight="fill" />
                    Company Details
                  </SectionTitle>
                  <CompetitionDetails>
                    {company.company_data.location && (
                      <>
                        <DetailLabel>Location:</DetailLabel>
                        <DetailValue>{company.company_data.location}</DetailValue>
                      </>
                    )}

                    {company.company_data.employees && (
                      <>
                        <DetailLabel>Employees:</DetailLabel>
                        <DetailValue>{company.company_data.employees}</DetailValue>
                      </>
                    )}

                    {company.company_data.founded && (
                      <>
                        <DetailLabel>Founded:</DetailLabel>
                        <DetailValue>{company.company_data.founded}</DetailValue>
                      </>
                    )}

                    {company.company_data.industry && (
                      <>
                        <DetailLabel>Industry:</DetailLabel>
                        <DetailValue>{company.company_data.industry}</DetailValue>
                      </>
                    )}
                  </CompetitionDetails>
                </ModalSection>
              )}
            </ModalBody>
          </ModalContainer>
        </ModalBackdrop>
      )}
    </AnimatePresence>
  );
};

export default CompanyModal;

// Add these styled components at the appropriate place in the file
const AnalysisLoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl};
  width: 100%;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const AnalysisLoadingAnimation = styled.div`
  @keyframes pulse {
    0% {
      transform: scale(0.85);
      opacity: 0.7;
    }
  50% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.85);
    opacity: 0.7;
  }
}

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  &:before, &:after {
    content: '';
    position: absolute;
    border-radius: 50%;
  }

  &:before {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.accent}, ${({ theme }) => theme.colors.accentSecondary || theme.colors.accent});
    animation: pulse 1.5s ease-in-out infinite;
  }

  &:after {
    top: 10px;
    left: 10px;
    right: 10px;
    bottom: 10px;
    background-color: ${({ theme }) => theme.colors.background.secondary};
    border: 3px solid transparent;
    border-top-color: ${({ theme }) => theme.colors.accent};
    border-radius: inherit;
    animation: spin 1s linear infinite;
  }
`;

const AnalysisLoadingText = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: center;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  max-width: 80%;
  line-height: 1.6;
`;

const TypingDots = styled.span`
  @keyframes blink {
    0% {
      opacity: 0.2;
    }
    20% {
      opacity: 1;
    }
    100% {
      opacity: 0.2;
    }
  }

  display: inline-block;

  &::after {
    content: '.';
    animation: blink 1.4s infinite both;
    animation-delay: 0s;
  }

  &::before {
    content: '..';
    animation: blink 1.4s infinite both;
    animation-delay: 0.2s;
  }
`;

const AnalysisResults = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md};
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.md};

  .markdown-content {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.9);

    h2 {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 2rem 0 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
    }

    h3 {
      font-size: 1.4rem;
      font-weight: 600;
      margin: 1.5rem 0 0.75rem;
      color: white;
    }

    p {
      margin: 0.75rem 0;
      font-size: 1rem;
    }

    ul, ol {
      margin: 1rem 0;
      padding-left: 1.5rem;
    }

    li {
      margin: 0.5rem 0;
    }

    strong {
      color: white;
      font-weight: 600;
    }

    blockquote {
      border-left: 4px solid rgba(99, 102, 241, 0.8);
      padding-left: 1rem;
      margin: 1.5rem 0;
      font-style: italic;
      background-color: rgba(99, 102, 241, 0.1);
      padding: 1rem;
      border-radius: 0.25rem;
    }

    code {
      font-family: 'Fira Code', monospace;
      background-color: rgba(0, 0, 0, 0.2);
      padding: 0.2rem 0.4rem;
      border-radius: 0.25rem;
      font-size: 0.9rem;
    }

    /* General table styling */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      overflow: hidden;
      border-radius: 0.5rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
    }

    th, td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      transition: background-color 0.2s ease;
    }

    th {
      background-color: rgba(0, 0, 0, 0.2);
      font-weight: 600;
      color: white;
    }

    tr:nth-child(even) {
      background-color: rgba(0, 0, 0, 0.1);
    }

    tr:hover {
      background-color: rgba(99, 102, 241, 0.1);
    }

    img {
      max-width: 100%;
      border-radius: 0.5rem;
      margin: 1.5rem 0;
    }

    a {
      color: #6366F1;
      text-decoration: none;
      transition: color 0.2s ease;

      &:hover {
        color: #818CF8;
        text-decoration: underline;
      }
    }
  }
`;

const AnalysisSection = styled.div`
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border-left: 5px solid ${({ theme }) => theme.colors.accent};
  transition: all 0.3s ease;
  width: 100%;
  overflow: visible;
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  position: relative;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to bottom,
      ${({ theme }) => `${theme.colors.background.primary}05`} 0%,
      ${({ theme }) => `${theme.colors.background.secondary}`} 100%
    );
    border-radius: ${({ theme }) => theme.borderRadius.md};
    opacity: 0.5;
    pointer-events: none;
  }

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
  }

  &:nth-child(odd) {
    border-left-color: ${({ theme }) => theme.colors.accent};
  }

  &:nth-child(even) {
    border-left-color: ${({ theme }) => theme.colors.accentSecondary || '#4A6CF7'};
  }

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.md};

    &:hover {
      transform: none;
    }
  }
`;

const AnalysisSectionHeader = styled.h4`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ children, theme }) => children === 'Key Takeaways' ? '#FFFFFF' : theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.md};
  }
`;

const AnalysisSectionContent = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.8;
  margin: 0;
  white-space: pre-line;

  p {
    margin-bottom: ${({ theme }) => theme.spacing.md};

    &:last-child {
      margin-bottom: 0;
    }
  }

  strong, b {
    color: ${({ theme }) => theme.colors.text.primary};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }

  ul, ol {
    margin-left: ${({ theme }) => theme.spacing.lg};
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }

  li {
    margin-bottom: ${({ theme }) => theme.spacing.xs};
  }

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;

const AnalysisFooter = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: center;
  font-style: italic;
`;

const AnalysisHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding-bottom: ${({ theme }) => theme.spacing.sm};
`;

const AnalysisTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const spinAnimation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  background-color: ${({ theme }) => theme.colors.accent};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  box-shadow: ${({ theme }) => theme.shadows.sm};

  svg {
    width: 20px;
    height: 20px;
    color: white;
  }

  .spin-animation {
    animation: ${spinAnimation} 1.5s linear infinite;
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.accentSecondary || '#4A6CF7'};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    padding: 8px 12px;
  }
`;

const CompetitionIndicator = styled.div`
  display: flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  gap: 0.5rem;
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
