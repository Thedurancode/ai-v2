import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { m as motion } from 'framer-motion';
import { MagnifyingGlass, Buildings, Calendar, CaretDown, Check, SquaresFour, ArrowUp, ArrowDown, List, CaretLeft, CaretRight, Brain } from '@phosphor-icons/react';
import CompanyModal from '../components/CompanyModal';
import { getPotentialPartners } from '../services/api';

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
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  color: ${({ theme }) => theme.colors.text.primary};
  position: relative;
  z-index: 1;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 1.5rem 1rem;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: 1rem 0.75rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
  background-color: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
    padding: 1.25rem;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: 1rem;
    border-radius: 0.75rem;
  }
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 1.5rem;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: 1.25rem;
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
`;

const SelectContainer = styled.div`
  position: relative;
  width: 280px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 100%;
  }
`;

const SelectButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background-color: rgba(15, 23, 42, 0.7);
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  cursor: pointer;
  outline: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  text-align: left;
  font-weight: 500;
  backdrop-filter: blur(8px);

  &:hover {
    background-color: rgba(30, 41, 59, 0.8);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:focus {
    border-color: rgba(99, 102, 241, 0.5);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const DropdownIcon = styled(CaretDown)`
  margin-left: 12px;
  transition: transform 0.3s ease;
  ${({ isOpen }) => isOpen && 'transform: rotate(180deg);'}
  opacity: ${({ isOpen }) => isOpen ? '1' : '0.7'};
  color: ${({ isOpen, theme }) => isOpen ? theme.colors.accent || '#6366f1' : 'inherit'};
`;

const DropdownMenu = styled(motion.div)`
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  width: 100%;
  background-color: rgba(15, 23, 42, 0.95);
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
  z-index: 100; /* Increased z-index to ensure it's above other elements */
  overflow: hidden;
  backdrop-filter: blur(12px);
  max-height: 300px; /* Increased max height */
  overflow-y: auto;

  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.3);
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(99, 102, 241, 0.5);
    border-radius: 6px;
  }
`;

const DropdownItem = styled.div`
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.15s ease;
  color: ${({ theme, isActive }) => isActive ? theme.colors.accent || '#6366f1' : theme.colors.text.primary};
  background-color: ${({ isActive }) => isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent'};
  font-weight: ${({ isActive }) => isActive ? '600' : '400'};
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: rgba(99, 102, 241, 0.15);
    transform: translateX(2px);
  }

  &:active {
    background-color: rgba(99, 102, 241, 0.2);
  }
`;

const CheckIcon = styled(Check)`
  margin-right: 8px;
  color: ${({ theme }) => theme.colors.accent || '#6366f1'};
`;


const SearchInput = styled.div`
  position: relative;
  width: 250px;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 100%;
  }

  input {
    width: 100%;
    background-color: rgba(15, 23, 42, 0.7);
    color: ${({ theme }) => theme.colors.text.primary};
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    padding: 0.5rem 1rem 0.5rem 2.5rem;
    font-size: 0.9rem;
    outline: none;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;

    &:focus {
      border-color: rgba(99, 102, 241, 0.5);
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25);
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

const DateInput = styled.div`
  position: relative;

  input {
    background-color: rgba(15, 23, 42, 0.7);
    color: ${({ theme }) => theme.colors.text.primary};
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    padding: 0.5rem 1rem 0.5rem 2.5rem;
    font-size: 0.9rem;
    outline: none;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;

    &:focus {
      border-color: rgba(99, 102, 241, 0.5);
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.25);
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

const FiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  background-color: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    padding: 1rem;
    border-radius: 0.75rem;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  label {
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const ViewToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    margin-left: 0;
    width: 100%;
    justify-content: center;
    margin-top: 0.5rem;
  }
`;

const ViewToggleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 0.5rem;
  background-color: ${({ active }) =>
    active ? 'rgba(99, 102, 241, 0.8)' : 'rgba(15, 23, 42, 0.7)'
  };
  color: ${({ active }) =>
    active ? 'white' : 'rgba(255, 255, 255, 0.9)'
  };
  border: 1px solid ${({ active }) =>
    active ? 'rgba(99, 102, 241, 0.8)' : 'rgba(255, 255, 255, 0.1)'
  };
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: ${({ active }) =>
      active ? 'rgba(99, 102, 241, 0.9)' : 'rgba(30, 41, 59, 0.8)'
    };
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
  background-color: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-wrap: wrap;
    padding: 0.5rem;
  }
`;

const PageButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  border-radius: 0.5rem;
  background-color: ${({ active }) =>
    active ? 'rgba(99, 102, 241, 0.8)' : 'rgba(15, 23, 42, 0.7)'
  };
  color: ${({ active }) =>
    active ? 'white' : 'rgba(255, 255, 255, 0.9)'
  };
  border: 1px solid ${({ active }) =>
    active ? 'rgba(99, 102, 241, 0.8)' : 'rgba(255, 255, 255, 0.1)'
  };
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ disabled }) => disabled ? 0.5 : 1};
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  padding: 0 0.5rem;
  font-size: 0.875rem;
  font-weight: ${({ active }) => active ? '600' : '400'};

  &:hover {
    background-color: ${({ active, disabled }) =>
      disabled ? (active ? 'rgba(99, 102, 241, 0.8)' : 'rgba(15, 23, 42, 0.7)') :
      (active ? 'rgba(99, 102, 241, 0.9)' : 'rgba(30, 41, 59, 0.8)')
    };
    transform: ${({ disabled }) => disabled ? 'none' : 'translateY(-1px)'};
    box-shadow: ${({ disabled }) => disabled ? '0 2px 5px rgba(0, 0, 0, 0.1)' : '0 4px 8px rgba(0, 0, 0, 0.15)'};
  }

  &:active {
    transform: ${({ disabled }) => disabled ? 'none' : 'translateY(0)'};
    box-shadow: ${({ disabled }) => disabled ? '0 2px 5px rgba(0, 0, 0, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.1)'};
  }
`;

const PageInfo = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 100%;
    text-align: center;
    margin: 0.5rem 0;
    order: -1;
  }
`;

const PartnersGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const PartnersList = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: 0.75rem;
  }
`;

const PartnerCard = styled(motion.div)`
  background-color: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.2), 0 10px 15px -6px rgba(0, 0, 0, 0.15);
    border-color: rgba(99, 102, 241, 0.3);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    border-radius: 0.75rem;
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

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    padding: 1rem;
    align-items: flex-start;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    border-radius: 0.75rem;
    flex-direction: column;
    padding: 1rem;
    align-items: center;
    text-align: center;
  }
`;

const PartnerHeader = styled.div`
  padding: 1rem;
  background-color: rgba(15, 23, 42, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: 0.75rem;
  }
`;

const LogoContainer = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 1rem;
  background-color: rgba(30, 41, 59, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-right: 1rem;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.accent || '#6366f1'};
  font-weight: 600;
  font-size: 1.125rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
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

const PartnerName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: 1rem;
  }
`;

const PartnerBody = styled.div`
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: 0.75rem;
  }
`;

const Industry = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.accent || '#6366f1'};
  margin-bottom: 0.75rem;
  font-weight: 500;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: 0.8125rem;
  }
`;

const Description = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.5;
  margin-bottom: 1rem;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ScoreContainer = styled.div`
  margin-top: auto;
`;

const ScoreLabel = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 0.5rem;
`;

const ScoreBar = styled.div`
  height: 8px;
  background-color: rgba(30, 41, 59, 0.8);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.1);
`;

const ScoreFill = styled.div`
  height: 100%;
  width: ${({ score }) => `${score * 10}%`};
  background: linear-gradient(to right, #6366f1, #818cf8);
  border-radius: 4px;
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.5);
`;

const ScoreValue = styled.div`
  font-size: 0.85rem;
  color: ${({ theme, score }) => {
    if (score >= 8) return theme.colors.status.success;
    if (score >= 5) return theme.colors.status.warning;
    return theme.colors.status.error;
  }};
  font-weight: 500;
`;

const DateAdded = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ListItemInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    margin-left: 0;
    margin-top: 0.75rem;
    text-align: center;
    align-items: center;
  }
`;

const ListItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const ListItemName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 0.5rem 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: 1rem;
  }
`;

const ListItemMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    gap: 0.75rem;
    flex-wrap: wrap;
  }
`;

// Used in list view for industry display
const ListItemIndustry = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.accent || '#6366f1'};
  font-weight: 500;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: 0.8125rem;
  }
`;

const ListItemDate = styled.div`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ListItemDescription = styled.p`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: 0.8125rem;
    -webkit-line-clamp: 3;
    max-width: 100%;
    text-align: center;
  }
`;

const ListItemScore = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-left: 1.25rem;
  gap: 0.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin-left: 0;
    margin-top: 0.5rem;
  }
`;

const ScoreCircle = styled(motion.div)`
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
    if (score >= 8) return `background: linear-gradient(135deg, #03dac6 0%, #00b8a9 100%);`;
    if (score >= 6) return `background: linear-gradient(135deg, #C8102E 0%, #e72b3e 100%);`;
    if (score >= 4) return `background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%);`;
    return `background: linear-gradient(135deg, #F44336 0%, #e53935 100%);`;
  }}
`;

const CompatibilityStatus = styled(motion.div)`
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

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: 0.25rem 0.5rem;
    font-size: 0.7rem;
  }

`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background-color: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 1rem;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: 2rem 1rem;
    border-radius: 0.75rem;
  }
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
  border-top-color: rgba(99, 102, 241, 0.8);
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
`;

const SortButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${({ active }) =>
    active ? 'rgba(99, 102, 241, 0.8)' : 'rgba(15, 23, 42, 0.7)'
  };
  color: ${({ active }) =>
    active ? 'white' : 'rgba(255, 255, 255, 0.9)'
  };
  border: 1px solid ${({ active }) =>
    active ? 'rgba(99, 102, 241, 0.8)' : 'rgba(255, 255, 255, 0.1)'
  };
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  font-weight: ${({ active }) => active ? '600' : '400'};

  &:hover {
    background-color: ${({ active }) =>
      active ? 'rgba(99, 102, 241, 0.9)' : 'rgba(30, 41, 59, 0.8)'
    };
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const PotentialPartnersPage = () => {
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [currentPage, setCurrentPage] = useState(1);
  const partnersPerPage = 25;
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  useEffect(() => {
    fetchPartners();
  }, [dateFrom, dateTo, sortBy, sortOrder]);

  const fetchPartners = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      params.sort_by = sortBy;
      params.sort_order = sortOrder;

      console.log('Fetching potential partners with params:', params);

      try {
        const response = await getPotentialPartners(params);
        console.log('API response:', response);

        if (response && response.partners) {
          const partnersData = response.partners || [];
          console.log('Partners data:', partnersData);
          setPartners(partnersData);
          setFilteredPartners(partnersData);

          // Extract unique industries
          const uniqueIndustries = [...new Set(partnersData.map(p => p.industry).filter(Boolean))];
          setIndustries(uniqueIndustries);
        } else {
          console.error('Failed response:', response);
          setError('Failed to load potential partners. Please try again later.');
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        setError('Failed to load potential partners. Please try again later.');
      }
    } catch (err) {
      console.error('Failed to load potential partners:', err);
      setError('Failed to load potential partners. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Filter partners based on search term and industry
    let filtered = [...partners];

    if (selectedIndustry) {
      filtered = filtered.filter(partner =>
        partner.industry && partner.industry.toLowerCase() === selectedIndustry.toLowerCase()
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(partner =>
        (partner.name && partner.name.toLowerCase().includes(term)) ||
        (partner.description && partner.description.toLowerCase().includes(term))
      );
    }

    setFilteredPartners(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, selectedIndustry, partners]);

  // Get current partners for pagination
  const indexOfLastPartner = currentPage * partnersPerPage;
  const indexOfFirstPartner = indexOfLastPartner - partnersPerPage;
  const currentPartners = filteredPartners.slice(indexOfFirstPartner, indexOfLastPartner);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Toggle view mode
  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };

  // Calculate total pages
  const totalPages = Math.ceil(filteredPartners.length / partnersPerPage);

  // Handle partner click to open company modal
  const handlePartnerClick = (partner) => {
    // Format the partner data to match what CompanyModal expects
    const companyData = {
      ...partner,
      name: partner.name,
      description: partner.description,
      partnership_score: partner.score || partner.partnership_score || 0,
      logo: getLogoUrl(partner),
      industry: partner.industry
    };

    setSelectedPartner(companyData);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleIndustryChange = (e) => {
    setSelectedIndustry(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDateFromChange = (e) => {
    setDateFrom(e.target.value);
  };

  const handleDateToChange = (e) => {
    setDateTo(e.target.value);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to descending
      setSortBy(field);
      setSortOrder('desc');
    }
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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Get score category text
  const getScoreCategory = (score) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Average';
    return 'Low';
  };

  // Get score color based on score value
  const getScoreColor = (score) => {
    if (score >= 8) return 'rgba(16, 185, 129, 0.8)'; // Green
    if (score >= 6) return 'rgba(99, 102, 241, 0.8)'; // Blue/Purple
    if (score >= 4) return 'rgba(245, 158, 11, 0.8)'; // Yellow/Orange
    return 'rgba(239, 68, 68, 0.8)'; // Red
  };

  if (loading && partners.length === 0) {
    return (
      <PageContainer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Header>
          <Title>Potential Partners</Title>
        </Header>
        <LoadingContainer>
          <Spinner
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </LoadingContainer>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Header>
          <Title>Potential Partners</Title>
        </Header>
        <EmptyState>
          <EmptyStateText>{error}</EmptyStateText>
        </EmptyState>
      </PageContainer>
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
        <Title>
          <MagnifyingGlass size={24} weight="bold" />
          Potential Partners
        </Title>
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
          <SelectContainer ref={dropdownRef}>
            <SelectButton onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              {selectedIndustry || 'All Searches'}
              <DropdownIcon size={16} isOpen={isDropdownOpen} />
            </SelectButton>
            {isDropdownOpen && (
              <DropdownMenu
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <DropdownItem
                  isActive={selectedIndustry === ''}
                  onClick={() => {
                    handleIndustryChange({ target: { value: '' } });
                    setIsDropdownOpen(false);
                  }}
                >
                  {selectedIndustry === '' && <CheckIcon size={16} />}
                  All Searches
                </DropdownItem>
                {industries.map((industry) => (
                  <DropdownItem
                    key={industry}
                    isActive={selectedIndustry === industry}
                    onClick={() => {
                      handleIndustryChange({ target: { value: industry } });
                      setIsDropdownOpen(false);
                    }}
                  >
                    {selectedIndustry === industry && <CheckIcon size={16} />}
                    {industry}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            )}
          </SelectContainer>
        </ControlsContainer>
      </Header>

      <FiltersContainer>
        <FilterGroup>
          <label>From:</label>
          <DateInput>
            <Calendar size={18} />
            <input
              type="date"
              value={dateFrom}
              onChange={handleDateFromChange}
            />
          </DateInput>
        </FilterGroup>
        <FilterGroup>
          <label>To:</label>
          <DateInput>
            <Calendar size={18} />
            <input
              type="date"
              value={dateTo}
              onChange={handleDateToChange}
            />
          </DateInput>
        </FilterGroup>
        <FilterGroup>
          <SortButton
            active={sortBy === 'created_at'}
            onClick={() => handleSort('created_at')}
          >
            Date Added
            {sortBy === 'created_at' && (
              sortOrder === 'desc' ? <ArrowDown size={16} /> : <ArrowUp size={16} />
            )}
          </SortButton>
          <SortButton
            active={sortBy === 'score'}
            onClick={() => handleSort('score')}
          >
            Score
            {sortBy === 'score' && (
              sortOrder === 'desc' ? <ArrowDown size={16} /> : <ArrowUp size={16} />
            )}
          </SortButton>
          <SortButton
            active={sortBy === 'name'}
            onClick={() => handleSort('name')}
          >
            Name
            {sortBy === 'name' && (
              sortOrder === 'desc' ? <ArrowDown size={16} /> : <ArrowUp size={16} />
            )}
          </SortButton>
        </FilterGroup>
        <ViewToggleContainer>
          <ViewToggleButton
            active={viewMode === 'list'}
            onClick={() => toggleViewMode('list')}
            title="List View"
          >
            <List size={20} weight={viewMode === 'list' ? 'bold' : 'regular'} />
          </ViewToggleButton>
          <ViewToggleButton
            active={viewMode === 'grid'}
            onClick={() => toggleViewMode('grid')}
            title="Grid View"
          >
            <SquaresFour size={20} weight={viewMode === 'grid' ? 'bold' : 'regular'} />
          </ViewToggleButton>
        </ViewToggleContainer>
      </FiltersContainer>

      {loading && (
        <LoadingContainer>
          <Spinner
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </LoadingContainer>
      )}

      {!loading && filteredPartners.length === 0 ? (
        <EmptyState>
          <Buildings size={48} weight="bold" color="rgba(99, 102, 241, 0.7)" />
          <EmptyStateText>
            {searchTerm || selectedIndustry || dateFrom || dateTo
              ? "No potential partners found matching your search criteria."
              : "No potential partners found. Start searching for companies to build your partner database."}
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
              {currentPartners.map((partner) => (
                <PartnerCard
                  key={partner.id || partner.name}
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
                  whileHover={{
                    y: -8,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePartnerClick(partner)}
                >
                  <PartnerHeader>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <LogoContainer>
                        {getLogoUrl(partner) ? (
                          <img src={getLogoUrl(partner)} alt={`${partner.name} logo`} />
                        ) : (
                          <Buildings size={20} weight="bold" />
                        )}
                      </LogoContainer>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PartnerName>{partner.name}</PartnerName>
                        {partner.has_research && (
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '0.1rem 0.4rem',
                            background: 'rgba(99, 102, 241, 0.2)',
                            borderRadius: '0.25rem',
                            color: 'rgba(255, 255, 255, 0.9)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <Brain size={12} />
                            Researched
                          </span>
                        )}
                      </div>
                    </div>
                    <ScoreValue score={partner.score || partner.partnership_score || 0} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      fontWeight: '700',
                      fontSize: '0.875rem',
                      padding: '0 8px',
                      backgroundColor: getScoreColor(partner.score || partner.partnership_score || 0),
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                    }}>
                      {(partner.score || partner.partnership_score || 0).toFixed(1)}
                    </ScoreValue>
                  </PartnerHeader>
                  <PartnerBody>
                    <Industry>{partner.industry || 'Search term'}</Industry>
                    <Description>{partner.description || 'No description available.'}</Description>
                    <ScoreContainer>
                      <ScoreLabel>Partnership Potential</ScoreLabel>
                      <ScoreBar>
                        <ScoreFill score={partner.score || partner.partnership_score || 0} />
                      </ScoreBar>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <ScoreValue score={partner.score || partner.partnership_score || 0}>
                          {getScoreCategory(partner.score || partner.partnership_score || 0)}
                        </ScoreValue>
                        <DateAdded>
                          <Calendar size={14} />
                          {formatDate(partner.created_at)}
                        </DateAdded>
                      </div>
                    </ScoreContainer>
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
              {currentPartners.map((partner) => (
                <PartnerListItem
                  key={partner.id || partner.name}
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
                  whileHover={{
                    y: -2,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handlePartnerClick(partner)}
                >
                  <LogoContainer>
                    {getLogoUrl(partner) ? (
                      <img src={getLogoUrl(partner)} alt={`${partner.name} logo`} />
                    ) : (
                      <Buildings size={20} weight="bold" />
                    )}
                  </LogoContainer>
                  <ListItemInfo>
                    <ListItemHeader>
                      <ListItemName>
                        {partner.name}
                        {partner.has_research && (
                          <span style={{
                            fontSize: '0.7rem',
                            marginLeft: '0.5rem',
                            padding: '0.1rem 0.4rem',
                            background: 'rgba(99, 102, 241, 0.2)',
                            borderRadius: '0.25rem',
                            color: 'rgba(255, 255, 255, 0.9)',
                            verticalAlign: 'middle'
                          }}>
                            <Brain size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                            Researched
                          </span>
                        )}
                      </ListItemName>
                      <ListItemMeta>
                        {/* Industry hidden in list view per request */}
                        <ListItemDate>
                          <Calendar size={14} />
                          {formatDate(partner.created_at)}
                        </ListItemDate>
                      </ListItemMeta>
                    </ListItemHeader>
                    <ListItemDescription>
                      {partner.description || 'No description available.'}
                    </ListItemDescription>
                  </ListItemInfo>
                  <ListItemScore>
                    <ScoreCircle
                      score={partner.score || partner.partnership_score || 0}
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      {Math.round(partner.score || partner.partnership_score || 0)}
                    </ScoreCircle>
                    <CompatibilityStatus
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      Compatible
                    </CompatibilityStatus>
                  </ListItemScore>
                </PartnerListItem>
              ))}
            </PartnersList>
          )}

          {/* Pagination */}
          {filteredPartners.length > 0 && (
            <PaginationContainer>
              <PageButton
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
              >
                First
              </PageButton>
              <PageButton
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <CaretLeft size={16} weight="bold" />
              </PageButton>

              <PageInfo>
                Page {currentPage} of {totalPages} ({filteredPartners.length} partners)
              </PageInfo>

              <PageButton
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <CaretRight size={16} weight="bold" />
              </PageButton>
              <PageButton
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </PageButton>
            </PaginationContainer>
          )}
        </>
      )}

      {/* Company Detail Modal */}
      {selectedPartner && (
        <CompanyModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          company={selectedPartner}
        />
      )}
    </PageContainer>
    </>
  );
};

export default PotentialPartnersPage;
