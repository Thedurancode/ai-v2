import React, { useEffect, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Buildings, CheckCircle, XCircle, Globe, MapPin, Users, CalendarBlank, Briefcase, CurrencyDollar, Star, LinkedinLogo, SpinnerGap, Brain, MagnifyingGlass, Lightbulb, Rocket, ArrowsClockwise, FilePdf, VideoCamera } from '@phosphor-icons/react';
import { generatePdfReport } from '../utils/pdfUtils';
import { getPerplexityResearch, getDeepSeekResearch, checkApiHealth } from '../services/api';

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
  top: 1.5rem;
  right: 1.5rem;
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
  
  &::after {
    content: '';
    position: absolute;
    top: -10px;
    right: -10px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    border: 3px solid ${({ score }) => {
      if (score >= 8) return '#10B981';
      if (score >= 6) return '#F59E0B';
      if (score >= 4) return '#6366F1';
      return '#EF4444';
    }};
  }

  @media (max-width: 768px) {
    width: 90px;
    height: 90px;
    font-size: 2.5rem;
    position: absolute;
    top: 10px;
    right: 10px;
    
    &::after {
      width: 25px;
      height: 25px;
      top: -5px;
      right: -5px;
    }
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
        borderRadius: '50%'
      }}
    >
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 100 100"
        style={{
          position: 'absolute',
          transform: 'rotate(-90deg)'
        }}
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(255, 255, 255, 0.8)"
          strokeWidth="8"
          strokeDasharray="283"
          strokeDashoffset={283 - (283 * score / 10)}
          strokeLinecap="round"
        />
      </svg>
    </motion.div>
  );
};

const CompanyModal = ({ isOpen, onClose, company }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [perplexityData, setPerplexityData] = useState(null);
  const [isPerplexityLoading, setIsPerplexityLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const handleAction = async (action, options = {}) => {
    console.log(`Action triggered: ${action} for company: ${company?.name}`);
    
    if (action === 'perplexity') {
      // Use Perplexity API for deep research
      setIsPerplexityLoading(true);
      setPerplexityData(null); // Clear previous data
      
      try {
        // First check if the API is healthy
        console.log("Checking API health before making Perplexity request...");
        const healthCheck = await checkApiHealth();
        console.log("API health check result:", healthCheck);
        
        if (!healthCheck.perplexity_api) {
          throw new Error(`Perplexity API is not available: ${healthCheck.perplexity_error || 'Unknown error'}`);
        }
        
        console.log("Starting Perplexity API request");
        const researchData = await getPerplexityResearch(company);
        console.log("Perplexity API request successful, data length:", researchData?.length || 0);
        setPerplexityData(researchData);
        console.log("Perplexity data set in state");
      } catch (error) {
        console.error("Error fetching Perplexity research:", error);
        console.error("Error message:", error.message);
        
        // Show user-friendly error alert
        const errorMessage = error.message || "Unknown error occurred";
        alert(`Perplexity research failed: ${errorMessage}. Falling back to web search.`);
        
        // If API fails, fallback to opening the website
        const companyName = company?.name || '';
        const industry = company?.linkedin_data?.industry || '';
        const query = encodeURIComponent(`Comprehensive business intelligence report on ${companyName}${industry ? ` in the ${industry} industry` : ''}: business model, revenue streams, market position, major competitors, strategic partnerships, recent developments, growth potential, and investment outlook.`);
        window.open(`https://www.perplexity.ai/search?q=${query}`, '_blank');
      } finally {
        setIsPerplexityLoading(false);
      }
    } else if (action === 'pdf-download') {
      // Handle PDF download action
      console.log("PDF download triggered for:", company.name);
      alert(`Generating PDF report for ${company.name}...`);
      // Implement PDF generation and download functionality
      
    } else if (action === 'video-content') {
      // Handle Video content action
      console.log("Video content triggered for:", company.name);
      alert(`Loading video content for ${company.name}...`);
      // Implement video content display functionality
      
    } else if (action === 'ai-analysis') {
      // Perform in-place AI analysis
      setIsAnalyzing(true);
      setAiAnalysis(null); // Clear previous analysis
      
      // Simulate AI analysis loading (would be replaced with actual API call)
      setTimeout(() => {
        const analysis = generateAIAnalysis(company);
        console.log("Generated AI analysis:", analysis);
        setAiAnalysis(analysis);
        setIsAnalyzing(false);
      }, 2000);
    } else if (action === 'deep-research') {
      // Trigger deep research using DeepSeek API
      setIsAnalyzing(true);
      setAiAnalysis(null); // Clear previous analysis
      
      try {
        console.log("Starting DeepSeek research request for:", company.name);
        
        // Check if we should force refresh
        const requestOptions = { ...company };
        if (options.forceRefresh) {
          requestOptions.forceRefresh = true;
          console.log("Force refresh requested for research");
        }
        
        // Using DeepSeek API instead of local mock data
        const result = await getDeepSeekResearch(requestOptions);
        
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
            const freshResult = await getDeepSeekResearch({
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
          console.log("DeepSeek research successful, data length:", deepSeekData.length);
          
          // Format the DeepSeek response for display
          const sections = formatDeepSeekResponse(deepSeekData);
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
        } else {
          console.error("DeepSeek returned invalid or too short research data", deepSeekData);
          throw new Error("Invalid research data");
        }
      } catch (error) {
        console.error("Error with research:", error.message);
        
        // Fallback to local data if the API fails
        console.log("Using fallback local research data");
        const research = generateDeepResearch(company);
        setAiAnalysis(research);
      } finally {
        setIsAnalyzing(false);
      }
    } else if (action === 'score') {
      // Trigger AI-powered partnership score generation
      setIsAnalyzing(true);
      setAiAnalysis(null); // Clear previous analysis
      
      // Simulate AI analysis loading (would be replaced with actual API call)
      setTimeout(() => {
        const analysis = generateAIAnalysis(company);
        console.log("Generated AI analysis:", analysis);
        setAiAnalysis(analysis);
        setIsAnalyzing(false);
      }, 2000);
    }
  };
  
  // Generate AI analysis content based on company data
  const generateAIAnalysis = (company) => {
    const companyName = company?.name || '';
    const industry = company?.linkedin_data?.industry || 'this industry';
    const size = company?.linkedin_data?.company_size || 'unknown size';
    
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
          content: `As a ${size} company in ${industry}, ${companyName} ${company.partnership_score >= 7 ? 'holds a significant position' : 'is positioned as a challenger'} in their market segment. ${company.linkedin_data?.followers_count ? `Their LinkedIn following of ${company.linkedin_data.followers_count.toLocaleString()} indicates strong market presence.` : ''} ${company.linkedin_data?.specialties ? `Core competencies include ${company.linkedin_data.specialties.slice(0, 3).join(', ')}, positioning them well within the competitive landscape.` : ''} Their current trajectory suggests ${company.partnership_score >= 7 ? 'continued growth and market expansion' : company.partnership_score >= 5 ? 'stable performance with moderate growth potential' : 'potential market challenges that may require careful monitoring'}.`
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
    const industry = company?.linkedin_data?.industry || 'this industry';
    
    return {
      title: `Deep Research: ${companyName}`,
      type: 'research',
      sections: [
        {
          heading: 'Company Overview',
          content: `${companyName} is ${company.linkedin_data?.description || company.description || `a company operating in ${industry}`}. ${company.linkedin_data?.founded ? `Founded in ${company.linkedin_data.founded}, they` : 'They'} ${company.linkedin_data?.headquarters ? `are headquartered in ${typeof company.linkedin_data.headquarters === 'string' ? company.linkedin_data.headquarters : JSON.stringify(company.linkedin_data.headquarters)}` : 'operate globally'}. ${company.linkedin_data?.company_size ? `With a workforce of approximately ${typeof company.linkedin_data.company_size === 'number' ? company.linkedin_data.company_size.toLocaleString() : company.linkedin_data.company_size}, they have established a ${company.partnership_score >= 7 ? 'significant' : company.partnership_score >= 5 ? 'notable' : 'developing'} presence in their market.` : ''} ${company.linkedin_data?.company_type ? `As a ${company.linkedin_data.company_type.toLowerCase()} company, their organizational structure and operational approach align with industry standards.` : ''}`
        },
        {
          heading: 'Market Analysis',
          content: `In ${industry}, ${companyName} competes with several major players. Their partnership compatibility score of ${company.partnership_score}/10 suggests ${company.partnership_score >= 7 ? 'strong alignment' : company.partnership_score >= 5 ? 'potential alignment' : 'possible challenges'} with our strategic goals. ${company.linkedin_data?.specialties ? `They specialize in ${company.linkedin_data.specialties.join(', ')}, which ${company.partnership_score >= 7 ? 'complements our offerings' : company.partnership_score >= 5 ? 'partially aligns with our focus areas' : 'represents a distinct approach from our core business'}.` : ''} Market trends in this sector indicate ${company.partnership_score >= 7 ? 'growth opportunities through strategic partnerships' : company.partnership_score >= 5 ? 'selective partnership opportunities with careful positioning' : 'challenging conditions requiring precise partnership parameters'}. Current industry consolidation patterns suggest this is ${company.partnership_score >= 7 ? 'an optimal time' : company.partnership_score >= 5 ? 'a reasonable time' : 'a cautious time'} to pursue this partnership.`
        },
        {
          heading: 'Strategic Opportunities',
          content: `Potential collaboration areas with ${companyName} include co-marketing initiatives, product integrations, and market expansion opportunities. ${company.has_competition ? 'Note that there may be conflicts with existing partnerships that should be carefully managed.' : 'No major conflicts with existing partnerships were identified.'} Based on their ${company.linkedin_data?.specialties ? `focus on ${company.linkedin_data.specialties.slice(0, 2).join(' and ')}` : 'market position'}, we see particular value in ${company.partnership_score >= 7 ? 'comprehensive integration across product lines and marketing channels' : company.partnership_score >= 5 ? 'targeted collaborations in specific market segments' : 'limited, well-defined collaborative initiatives'}. Their ${company.linkedin_data?.followers_count ? `social following of ${company.linkedin_data.followers_count.toLocaleString()} users` : 'market presence'} offers ${company.partnership_score >= 7 ? 'significant audience reach' : company.partnership_score >= 5 ? 'moderate audience expansion' : 'some additional market visibility'} for joint initiatives.`
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
  
  useEffect(() => {
    if (isOpen && company) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 800); // Brief loading state
      console.log('Modal opened with company:', company.name);
      console.log('Has LinkedIn data?', !!company.linkedin_data);
      
      // Set enrichment state based on company flags
      if (company.enrichError) {
        // If we have an explicit error flag, show error state
        setIsEnriching(false);
      } else if (company.linkedin_data) {
        // If we have LinkedIn data, we're not enriching
        setIsEnriching(false);
      } else if (company.isEnriching !== undefined) {
        // If company has an explicit isEnriching flag, use that
        setIsEnriching(company.isEnriching);
      } else {
        // Otherwise assume we're enriching if there's no LinkedIn data
        setIsEnriching(true);
        
        // Set a timeout to prevent infinite spinner
        const timer = setTimeout(() => {
          setIsEnriching(false);
        }, 10000); // Stop showing spinner after 10 seconds max
        
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, company]);
  
  // Update isEnriching when LinkedIn data becomes available
  useEffect(() => {
    if (company && company.linkedin_data) {
      setIsEnriching(false);
    }
  }, [company?.linkedin_data]);

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

  const renderLinkedInData = () => {
    console.log('Attempting to render LinkedIn data for:', company.name);
    
    try {
      // First, check if the company has an explicit enrichError flag
      if (company.enrichError) {
        console.log('Company has explicit enrichError flag:', company.name);
        return null;
      }
      
      // Check if LinkedIn data exists and is an object
      if (!company.linkedin_data || typeof company.linkedin_data !== 'object') {
        console.log('LinkedIn data missing or invalid for company:', company.name);
        return null;
      }
      
      // Make sure linkedin_data has actual content
      const hasLinkedInData = Object.keys(company.linkedin_data).length > 0;
      if (!hasLinkedInData) {
        console.log('LinkedIn data is empty for company:', company.name);
        return null;
      }
      
      const { 
        url, headquarters, company_size, founded, 
        industry, specialties, followers_count, funding_data,
        tagline, company_type, website, locations
      } = company.linkedin_data;
      
      // Check if this appears to be mock/dummy data
      // Real LinkedIn data should have a LinkedIn URL and several other fields
      // The most reliable indicator is the LinkedIn URL
      if (!url) {
        console.log('LinkedIn data missing URL, likely mock data:', company.name);
        return null;
      }
      
      // Additional check - if the data has a URL but is missing most other fields,
      // it's probably still mock data
      const missingFields = [
        !headquarters, 
        !company_size, 
        !founded, 
        !industry, 
        !specialties || !specialties.length,
        !website
      ].filter(Boolean).length;
      
      // If more than 4 fields are missing, consider it suspicious
      if (missingFields > 4) {
        console.log('LinkedIn data missing too many fields, likely mock data:', company.name);
        return null;
      }
      
      console.log('Rendering validated LinkedIn data:', company.name);
      
      // Format headquarters if available
      const formatHeadquarters = () => {
        if (!headquarters) return "N/A";
        
        if (typeof headquarters === 'string') return headquarters;
        
        const parts = [];
        if (headquarters.city) parts.push(headquarters.city);
        if (headquarters.geographicArea) parts.push(headquarters.geographicArea);
        if (headquarters.country) parts.push(headquarters.country);
        
        return parts.length > 0 ? parts.join(", ") : "N/A";
      };
      
      // Format funding info if available
      const renderFundingInfo = () => {
        if (!funding_data || !funding_data.lastFundingRound) return null;
        
        const { lastFundingRound } = funding_data;
        if (!lastFundingRound || typeof lastFundingRound !== 'object') return null;
        
        const { moneyRaised, fundingType, announcedOn, leadInvestors, numOtherInvestors } = lastFundingRound;
        
        // Check if we have any meaningful data to display
        const hasValidData = moneyRaised || fundingType || announcedOn || 
                            (leadInvestors && leadInvestors.length > 0);
        if (!hasValidData) return null;
        
        // Format funding type
        const formattedType = fundingType?.replace(/_/g, ' ');
        
        // Format date
        let formattedDate = null;
        if (announcedOn && typeof announcedOn === 'object') {
          try {
            const dateMonth = typeof announcedOn.month === 'object' 
              ? JSON.stringify(announcedOn.month) : announcedOn.month || '';
            const dateDay = typeof announcedOn.day === 'object' 
              ? JSON.stringify(announcedOn.day) : announcedOn.day || '';
            const dateYear = typeof announcedOn.year === 'object' 
              ? JSON.stringify(announcedOn.year) : announcedOn.year || '';
            
            if (dateMonth && dateDay && dateYear) {
              formattedDate = `${dateMonth}/${dateDay}/${dateYear}`;
            }
          } catch (error) {
            console.error('Error formatting date:', error);
          }
        }
        
        // Format money raised
        let formattedMoneyRaised = "";
        if (moneyRaised) {
          if (typeof moneyRaised === 'object' && moneyRaised.amount) {
            formattedMoneyRaised = formatCurrency(moneyRaised.amount, moneyRaised.currencyCode || 'USD');
          } else if (typeof moneyRaised === 'number') {
            formattedMoneyRaised = formatCurrency(moneyRaised, 'USD');
          } else if (typeof moneyRaised === 'string' && moneyRaised.trim() !== '') {
            formattedMoneyRaised = formatCurrency(moneyRaised, 'USD');
          }
        }
        
        return (
          <FundingInfo>
            <FundingHeader>
              <FundingTitle>
                <CurrencyDollar size={20} weight="fill" />
                {formattedType || "Funding Round"}
              </FundingTitle>
              {formattedMoneyRaised && (
                <FundingAmount>
                  {formattedMoneyRaised}
                </FundingAmount>
              )}
            </FundingHeader>
            
            {formattedDate && (
              <FundingDetails>Announced on {formattedDate}</FundingDetails>
            )}
            
            {leadInvestors && leadInvestors.length > 0 && (
              <FundingInvestors>
                <strong>Lead Investors:</strong> {leadInvestors.map(inv => {
                  // Handle both string names and object names
                  if (typeof inv === 'string') return inv;
                  if (typeof inv === 'object' && inv !== null && inv.name) return inv.name;
                  return JSON.stringify(inv);
                }).join(", ")}
                {numOtherInvestors > 0 && ` and ${numOtherInvestors} others`}
              </FundingInvestors>
            )}
          </FundingInfo>
        );
      };
      
      // Helper function to safely render values that might be objects
      const safeRender = (value) => {
        if (value === null || value === undefined) return "N/A";
        if (typeof value === 'object') {
          // Special handling for date-like objects with year/month/day
          if (value.year !== undefined || value.month !== undefined || value.day !== undefined) {
            const year = typeof value.year === 'object' ? JSON.stringify(value.year) : value.year || '';
            const month = typeof value.month === 'object' ? JSON.stringify(value.month) : value.month || '';
            const day = typeof value.day === 'object' ? JSON.stringify(value.day) : value.day || '';
            return `${month}/${day}/${year}`;
          }
          return JSON.stringify(value);
        }
        return value;
      };
      
      return (
        <LinkedInSection>
          {url && (
            <LinkedInLink href={url} target="_blank" rel="noopener noreferrer">
              <LinkedinLogo size={20} weight="fill" /> View on LinkedIn
            </LinkedInLink>
          )}
          
          {tagline && <CompanyTagline>"{safeRender(tagline)}"</CompanyTagline>}
          
          {followers_count > 0 && (
            <FollowerCount>
              <Users size={16} weight="fill" />
              {formatNumber(followers_count)} followers on LinkedIn
            </FollowerCount>
          )}
          
          <InfoGrid>
            {headquarters && (
              <InfoItem>
                <MapPin size={20} weight="fill" />
                <InfoContent>
                  <InfoLabel>Headquarters</InfoLabel>
                  <InfoValue>{formatHeadquarters()}</InfoValue>
                </InfoContent>
              </InfoItem>
            )}
            
            {company_size && (
              <InfoItem>
                <Users size={20} weight="fill" />
                <InfoContent>
                  <InfoLabel>Company Size</InfoLabel>
                  <InfoValue>{typeof company_size === 'number' ? formatNumber(company_size) : safeRender(company_size)}</InfoValue>
                </InfoContent>
              </InfoItem>
            )}
            
            {founded && (
              <InfoItem>
                <CalendarBlank size={20} weight="fill" />
                <InfoContent>
                  <InfoLabel>Founded</InfoLabel>
                  <InfoValue>{safeRender(founded)}</InfoValue>
                </InfoContent>
              </InfoItem>
            )}
            
            {industry && (
              <InfoItem>
                <Briefcase size={20} weight="fill" />
                <InfoContent>
                  <InfoLabel>Industry</InfoLabel>
                  <InfoValue>{safeRender(industry)}</InfoValue>
                </InfoContent>
              </InfoItem>
            )}
            
            {company_type && (
              <InfoItem>
                <Buildings size={20} weight="fill" />
                <InfoContent>
                  <InfoLabel>Company Type</InfoLabel>
                  <InfoValue>{safeRender(company_type)}</InfoValue>
                </InfoContent>
              </InfoItem>
            )}
            
            {website && (
              <InfoItem>
                <Globe size={20} weight="fill" />
                <InfoContent>
                  <InfoLabel>Website</InfoLabel>
                  <InfoValue>
                    <a href={website.startsWith('http') ? website : `https://${website}`} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       style={{ color: 'inherit', textDecoration: 'underline' }}>
                      {website.replace(/^https?:\/\//i, '')}
                    </a>
                  </InfoValue>
                </InfoContent>
              </InfoItem>
            )}
          </InfoGrid>
          
          {specialties && specialties.length > 0 && (
            <>
              <SectionSubtitle>
                <Star size={16} weight="fill" />
                Specialties
              </SectionSubtitle>
              <SpecialtiesList>
                {specialties.map((specialty, index) => (
                  <SpecialtyTag key={index}>{safeRender(specialty)}</SpecialtyTag>
                ))}
              </SpecialtiesList>
            </>
          )}
          
          {locations && locations.length > 0 && (
            <>
              <SectionSubtitle>
                <MapPin size={16} weight="fill" />
                Locations
              </SectionSubtitle>
              <LocationsList>
                {locations.slice(0, 5).map((location, index) => (
                  <LocationItem key={index}>
                    <MapPin size={16} weight="fill" />
                    {safeRender(location)}
                  </LocationItem>
                ))}
                {locations.length > 5 && (
                  <LocationItem style={{ color: 'var(--text-secondary)' }}>
                    + {locations.length - 5} more locations
                  </LocationItem>
                )}
              </LocationsList>
            </>
          )}
          
          {funding_data && renderFundingInfo()}
        </LinkedInSection>
      );
    } catch (error) {
      console.error('Error rendering LinkedIn data:', error);
      return (
        <ErrorContainer>
          <ErrorIcon>
            <XCircle size={32} weight="bold" />
          </ErrorIcon>
          <ErrorText>Error displaying LinkedIn data</ErrorText>
          <ErrorHint>There was a problem rendering the data. Please try again.</ErrorHint>
        </ErrorContainer>
      );
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

  // Format DeepSeek response into sections
  const formatDeepSeekResponse = (response) => {
    if (!response) return [];
    
    try {
      // Split the markdown response by headings
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
      console.error("Error formatting DeepSeek response:", error);
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

  const handleRefreshResearch = async () => {
    // Force regeneration of research by clearing the cache flag
    try {
      setIsAnalyzing(true);
      console.log(`Refreshing research for ${company.name}`);
      
      // First try to delete the cached research entry
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5018'}/company-research/${encodeURIComponent(company.name)}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          console.log(`Successfully deleted cached research for ${company.name}`);
          // Now trigger research again with a clean slate
          await handleAction('deep-research');
        } else {
          console.error("Failed to delete cached research");
          // If deleting fails, we'll force a refresh with the forceRefresh flag
          await handleAction('deep-research', { forceRefresh: true });
        }
      } catch (error) {
        console.error("Error deleting cached research:", error);
        // If an error occurs, still try to refresh with the forceRefresh flag
        await handleAction('deep-research', { forceRefresh: true });
      }
    } catch (error) {
      console.error("Error refreshing research:", error);
      setIsAnalyzing(false);
    }
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
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <SpinnerGap size={32} weight="bold" />
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
                    {isEnriching && (
                      <EnrichmentStatus isLoading={true}>
                        <SpinnerGap size={16} weight="bold" />
                        <span>Loading data...</span>
                      </EnrichmentStatus>
                    )}
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
                    { icon: <Brain weight="fill" />, label: 'Analysis', action: 'ai-analysis', variant: 'primary', isLoading: isAnalyzing && aiAnalysis?.type === 'analysis' },
                    { icon: <MagnifyingGlass weight="fill" />, label: 'Research', action: 'deep-research', variant: 'secondary', isLoading: isAnalyzing && aiAnalysis?.type === 'research' },
                    { icon: <Rocket weight="fill" />, label: 'Perplexity', action: 'perplexity', variant: 'primary', isLoading: isPerplexityLoading },
                    { icon: <FilePdf weight="fill" />, label: 'PDF', action: 'pdf-download', variant: 'secondary' },
                    { icon: <VideoCamera weight="fill" />, label: 'Video', action: 'video-content', variant: 'primary' }
                  ].map((button, index) => (
                    <IconButtonContainer key={button.action} index={index}>
                      <IconButton 
                        variant={button.variant}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAction(button.action)}
                        disabled={isAnalyzing || isPerplexityLoading}
                      >
                        {button.isLoading ? (
                          <SpinnerGap weight="fill" className="spinning" />
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
              {(isPerplexityLoading || perplexityData) && (
                <ModalSection
                  variants={sectionVariants}
                  style={{ gridColumn: '1 / -1', minHeight: '300px', width: '100%' }}
                >
                  <SectionTitle>
                    <Rocket size={20} weight="fill" />
                    {isPerplexityLoading ? 'Perplexity AI Researching...' : 'Perplexity AI Research'}
                  </SectionTitle>
                  
                  {isPerplexityLoading ? (
                    <AnalysisLoadingContainer>
                      <AnalysisLoadingAnimation>
                        <motion.div
                          animate={{ scale: 1.1 }}
                          transition={{ 
                            repeat: Infinity, 
                            repeatType: "reverse",
                            duration: 0.8
                          }}
                        >
                          <Rocket size={40} weight="bold" />
                        </motion.div>
                        <TypingDots>
                          <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          ></motion.span>
                          <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                          ></motion.span>
                          <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                          ></motion.span>
                        </TypingDots>
                      </AnalysisLoadingAnimation>
                      <AnalysisLoadingText>
                        Perplexity AI is researching comprehensive details about {company.name}, including leadership team, financials, and market position...
                      </AnalysisLoadingText>
                    </AnalysisLoadingContainer>
                  ) : (
                    <AnalysisResults>
                      {formatPerplexityResponse(perplexityData)?.map((section, index) => (
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
                            {formatSectionContent(section.content)}
                          </AnalysisSectionContent>
                        </AnalysisSection>
                      ))}
                      <AnalysisFooter>
                        Data sourced via Perplexity AI. Last updated: {new Date().toLocaleDateString()}
                      </AnalysisFooter>
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
                          <RefreshButton 
                            onClick={handleRefreshResearch}
                            disabled={isAnalyzing}
                          >
                            <ArrowsClockwise size={16} weight="bold" />
                            Refresh Data
                          </RefreshButton>
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
                          <AnalysisSectionContent dangerouslySetInnerHTML={{ __html: formatSectionContent(section.content) }} />
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
                            `Powered by ${aiAnalysis.source || 'DeepSeek AI'}`
                          )}
                        </AnalysisFooter>
                      )}
                    </AnalysisResults>
                  )}
                </ModalSection>
              )}
              
              {/* LinkedIn Data Section - Now a full column */}
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
              
              {/* LinkedIn Data Loading State */}
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
              
              {/* LinkedIn Data Error State */}
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
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.accent}, ${({ theme }) => theme.colors.accentSecondary || '#4A6CF7'});
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
    border-radius: 50%;
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
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  
  &:before {
    content: '•';
    color: ${({ theme }) => theme.colors.accent};
    margin-right: ${({ theme }) => theme.spacing.sm};
    font-size: 1.5em;
    line-height: 0;
  }
  
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

const RefreshButton = styled.button`
  background-color: transparent;
  color: ${({ theme }) => theme.colors.accent};
  border: 1px solid ${({ theme }) => theme.colors.accent};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => `${theme.colors.accent}10`};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
