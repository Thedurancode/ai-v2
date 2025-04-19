import React, { useState } from 'react';
import styled from 'styled-components';
import { m as motion } from 'framer-motion';
import { MagnifyingGlass, Robot } from '@phosphor-icons/react';

const SearchContainer = styled(motion.div)`
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

const SearchTitle = styled(motion.h2)`
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 1.75rem;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    flex-direction: row;
    align-items: center;
  }
`;

const SearchForm = styled.form`
  display: flex;
  margin-bottom: 1.25rem;
  width: 100%;
  position: relative;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  border-radius: 1rem;
  background-color: rgba(15, 23, 42, 0.7);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  &:focus-within {
    border-color: rgba(99, 102, 241, 0.7);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 1.25rem 1.75rem;
  background-color: transparent;
  color: #ffffff;
  font-size: 1.125rem;
  border: none;
  min-height: 3.75rem;
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  padding-right: 0.75rem;
`;

const Divider = styled.div`
  width: 1px;
  height: 2rem;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 0 0.25rem;
`;

const IconButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  background: none;
  color: white;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SearchButton = styled(IconButton)`
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(99, 102, 241, 0.3);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const AiButton = styled(IconButton)`
  background: rgba(255, 255, 255, 0.08);
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const IconWrapper = styled(motion.span)`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SearchInfo = styled(motion.p)`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.125rem;
  margin-top: 1.25rem;
  line-height: 1.5;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    margin-top: 1rem;
  }
`;

const Tooltip = styled(motion.span)`
  position: absolute;
  bottom: -35px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.9);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  white-space: nowrap;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  pointer-events: none;
  z-index: 10;
`;

const ButtonWithTooltip = styled.div`
  position: relative;
`;

const SearchBox = ({ onSearch, onAiSearch, onClear, isSearching }) => {
  const [query, setQuery] = useState('');
  const [lastAction, setLastAction] = useState('');
  const [showSearchTooltip, setShowSearchTooltip] = useState(false);
  const [showAITooltip, setShowAITooltip] = useState(false);
  const [showClearTooltip, setShowClearTooltip] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;
    
    setLastAction('manual');
    onSearch(query.trim());
  };

  const handleAiSearch = () => {
    if (isSearching) return;
    setLastAction('ai');
    setQuery(''); // Clear query input
    onAiSearch();
  };

  return (
    <SearchContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <SearchTitle
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.span
          animate={{ rotate: [0, 10, 0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
          style={{ fontSize: '1.8rem' }}
        >
          🔍
        </motion.span>
        Find Partnership Opportunities
      </SearchTitle>
      
      <SearchForm onSubmit={handleSubmit}>
        <InputWrapper>
          <SearchInput
            type="text"
            placeholder="Enter industry, technology or market segment..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isSearching}
          />
          
          <ButtonsContainer>
            {query && (
              <ButtonWithTooltip
                onMouseEnter={() => setShowClearTooltip(true)}
                onMouseLeave={() => setShowClearTooltip(false)}
              >
                <IconButton 
                  type="button"
                  onClick={() => {
                    setQuery('');
                    onClear?.();
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <IconWrapper>
                    ✕
                  </IconWrapper>
                </IconButton>
                {showClearTooltip && (
                  <Tooltip
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                  >
                    Clear search
                  </Tooltip>
                )}
              </ButtonWithTooltip>
            )}
            <Divider />
            
            <ButtonWithTooltip
              onMouseEnter={() => setShowSearchTooltip(true)}
              onMouseLeave={() => setShowSearchTooltip(false)}
            >
              <SearchButton 
                type="submit"
                disabled={!query.trim() || isSearching}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <IconWrapper
                  animate={isSearching ? { rotate: 360 } : {}}
                  transition={{ 
                    repeat: isSearching ? Infinity : 0,
                    duration: 1.5, 
                    ease: "linear" 
                  }}
                >
                  <MagnifyingGlass size={22} weight="bold" />
                </IconWrapper>
              </SearchButton>
              {showSearchTooltip && (
                <Tooltip
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                >
                  Search
                </Tooltip>
              )}
            </ButtonWithTooltip>
            
            <ButtonWithTooltip
              onMouseEnter={() => setShowAITooltip(true)}
              onMouseLeave={() => setShowAITooltip(false)}
            >
              <AiButton 
                type="button"
                onClick={handleAiSearch}
                disabled={isSearching}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <IconWrapper
                  animate={isSearching && lastAction === 'ai' ? 
                    { scale: [1, 1.2, 1] } : {}}
                  transition={{ 
                    repeat: (isSearching && lastAction === 'ai') ? Infinity : 0,
                    duration: 1.5 
                  }}
                >
                  <Robot size={22} weight="bold" />
                </IconWrapper>
              </AiButton>
              {showAITooltip && (
                <Tooltip
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                >
                  AI Search
                </Tooltip>
              )}
            </ButtonWithTooltip>
          </ButtonsContainer>
        </InputWrapper>
      </SearchForm>
      
      {isSearching && (
        <SearchInfo
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {lastAction === 'ai' ? 
            "AI is searching for the best partnership opportunities across multiple industries..." : 
            `Searching for companies related to "${query}"...`}
        </SearchInfo>
      )}
    </SearchContainer>
  );
};

export default SearchBox;
