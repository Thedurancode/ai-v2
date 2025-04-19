import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { m as motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import PropertySelector from './PropertySelector';

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
    padding: 1.5rem 1rem;
    border-radius: 1rem;
    margin: 1rem 0;
    max-width: 100%;
    width: 100%;
    border-radius: 0.75rem;
  }

  @media (max-width: 480px) {
    padding: 1.25rem 0.75rem;
    margin: 0.5rem 0;
    border-radius: 0.5rem;
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
    font-size: 1.25rem;
    margin-bottom: 1rem;
    gap: 0.5rem;
    text-align: center;
    justify-content: center;
  }
`;

const SearchForm = styled.form`
  display: flex;
  margin-bottom: 1.25rem;
  width: 100%;
  position: relative;

  @media (max-width: 768px) {
    margin-bottom: 1rem;
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

  @media (max-width: 768px) {
    flex-direction: column;
    border-radius: 0.75rem;
    overflow: hidden;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 1rem 1.5rem;
  padding-right: 3rem; /* Space for the clear button */
  background-color: transparent;
  color: #ffffff;
  font-size: 1.125rem;
  border: none;
  min-height: 3.5rem;
  width: 100%;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 0.75rem 1rem;
    padding-right: 2.5rem; /* Space for the clear button */
    min-height: 3.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  padding-right: 0.75rem;
  align-items: center;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;
    padding: 0.85rem;
    padding-right: 0.85rem;
    padding-left: 0.85rem;
    justify-content: center;
    gap: 0.85rem;
    flex-direction: row;
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 2rem;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 0 0.25rem;

  @media (max-width: 768px) {
    display: none;
  }
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

  @media (max-width: 768px) {
    width: 2.5rem;
    height: 2.5rem;
    min-width: 2.5rem;
    min-height: 2.5rem;
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

  @media (max-width: 768px) {
    flex-grow: 1;
    border-radius: 0.75rem;
    width: 100%;
    height: 3rem;
    max-width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 0 0.5rem;
  }
`;

const IconWrapper = styled(motion.span)`
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    transform: scale(0.9);
  }
`;

const SearchInfo = styled(motion.p)`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.125rem;
  margin-top: 1.25rem;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 0.875rem;
    margin-top: 0.75rem;
    text-align: center;
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

  @media (max-width: 768px) {
    display: none; /* Hide tooltips on mobile */
  }
`;

const ButtonWithTooltip = styled.div`
  position: relative;

  @media (max-width: 768px) {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    max-width: 100%;
    width: 100%;
  }
`;

const ButtonLabel = styled.span`
  display: none;
  margin-left: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;

  @media (max-width: 768px) {
    display: inline;
  }
`;

const ClearButton = styled(IconButton)`
  background: rgba(239, 68, 68, 0.15);
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 2rem;
  height: 2rem;
  min-width: 2rem;
  min-height: 2rem;
  color: rgba(255, 255, 255, 0.9);

  &:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.3);
    color: white;
    transform: translateY(-50%) scale(1.05);
  }

  &:active:not(:disabled) {
    background: rgba(239, 68, 68, 0.4);
    transform: translateY(-50%) scale(0.95);
  }

  @media (max-width: 768px) {
    right: 0.75rem;
    top: calc(50% - 0.5rem); /* Adjust vertical position on mobile */
    width: 1.75rem;
    height: 1.75rem;
    min-width: 1.75rem;
    min-height: 1.75rem;
    background: rgba(239, 68, 68, 0.25);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
`;

const SearchBox = ({ onSearch, onAiSearch, onClear, isSearching }) => {
  const [query, setQuery] = useState('');
  const [lastAction, setLastAction] = useState('');
  const [showSearchTooltip, setShowSearchTooltip] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [propertyPrompt, setPropertyPrompt] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus input on component mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;

    setLastAction('manual');
    // Combine the user query with the property-specific prompt if one is selected
    const enhancedQuery = propertyPrompt
      ? `${query.trim()} ${propertyPrompt}`
      : query.trim();
    onSearch(enhancedQuery);
  };

  const handleClear = () => {
    setQuery('');
    if (onClear) onClear();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handlePropertySelect = (property) => {
    setSelectedProperty(property.id);
    setPropertyPrompt(property.prompt);
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
          style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center' }}
        >
          🔍
        </motion.span>
        Partner search
      </SearchTitle>

      <SearchForm onSubmit={handleSubmit} role="search">
        <InputWrapper>
          <div style={{ position: 'relative', width: '100%' }}>
            <SearchInput
              ref={inputRef}
              type="search"
              placeholder="Enter industry, technology or market segment..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isSearching}
              aria-label="Search query"
            />
            {query && (
              <ClearButton
                type="button"
                onClick={handleClear}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Clear search"
              >
                <IconWrapper
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={20} weight="bold" />
                </IconWrapper>
              </ClearButton>
            )}
          </div>

          <ButtonsContainer>
            <ButtonWithTooltip
              onMouseEnter={() => setShowSearchTooltip(true)}
              onMouseLeave={() => setShowSearchTooltip(false)}
            >
              <SearchButton
                type="submit"
                disabled={!query.trim() || isSearching}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Submit search"
              >
                <IconWrapper
                  animate={isSearching && lastAction === 'manual' ? { rotate: 360 } : {}}
                  transition={{
                    repeat: isSearching && lastAction === 'manual' ? Infinity : 0,
                    duration: 1.5,
                    ease: "linear"
                  }}
                >
                  <MagnifyingGlass size={20} weight="bold" />
                </IconWrapper>
                <ButtonLabel>Search</ButtonLabel>
              </SearchButton>
              <AnimatePresence>
                {showSearchTooltip && (
                  <Tooltip
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                  >
                    Search
                  </Tooltip>
                )}
              </AnimatePresence>
            </ButtonWithTooltip>
          </ButtonsContainer>
        </InputWrapper>
      </SearchForm>

      <PropertySelector
        selectedProperty={selectedProperty}
        onSelectProperty={handlePropertySelect}
      />

      <AnimatePresence>
        {isSearching && (
          <SearchInfo
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {`Searching for companies related to "${query}"${selectedProperty !== 'all' ? ` with focus on ${selectedProperty.replace(/-/g, ' ')}` : ''}...`}
          </SearchInfo>
        )}
      </AnimatePresence>
    </SearchContainer>
  );
};

export default SearchBox;
