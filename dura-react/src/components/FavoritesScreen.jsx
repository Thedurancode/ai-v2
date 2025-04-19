import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getFavorites } from '../utils/storageUtils';
import { Star, MagnifyingGlass, ArrowUp, ArrowDown, Export } from '@phosphor-icons/react';
import CompanyModal from './CompanyModal';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: 8px;
  padding: 0.5rem 1rem;
  width: 300px;
  margin-right: 1rem;

  input {
    background: none;
    border: none;
    color: ${({ theme }) => theme.colors.text.primary};
    margin-left: 0.5rem;
    width: 100%;
    &:focus {
      outline: none;
    }
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const CompanyCard = styled.div`
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
  }
`;

const CompanyName = styled.h3`
  margin: 0 0 0.5rem 0;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CompanyInfo = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.9rem;
`;

const Controls = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const SortButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${({ theme, $isActive }) => $isActive ? theme.colors.accent.primary : theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.accent.primary};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const FavoritesScreen = () => {
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    const favoritedCompanies = getFavorites() || [];
    setFavorites(favoritedCompanies.filter(company => company && company.name));
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedFavorites = favorites
    .filter(company => company && company.name && (
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (company.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    ))
    .sort((a, b) => {
      if (!a || !b) return 0;
      const aValue = a[sortBy] || '';
      const bValue = b[sortBy] || '';
      const modifier = sortOrder === 'asc' ? 1 : -1;
      
      return aValue.toString().localeCompare(bValue.toString()) * modifier;
    });

  const handleCompanyClick = (company) => {
    setSelectedCompany(company);
  };

  const handleCloseModal = () => {
    setSelectedCompany(null);
    loadFavorites(); // Refresh favorites list after modal closes
  };

  return (
    <Container>
      <Header>
        <Title>Favorite Companies</Title>
        <Controls>
          <SearchBar>
            <MagnifyingGlass size={20} />
            <input
              type="text"
              placeholder="Search favorites..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </SearchBar>
          <SortButton
            $isActive={sortBy === 'name'}
            onClick={() => handleSort('name')}
          >
            Name {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUp /> : <ArrowDown />)}
          </SortButton>
          <SortButton
            $isActive={sortBy === 'dateAdded'}
            onClick={() => handleSort('dateAdded')}
          >
            Date Added {sortBy === 'dateAdded' && (sortOrder === 'asc' ? <ArrowUp /> : <ArrowDown />)}
          </SortButton>
        </Controls>
      </Header>

      {filteredAndSortedFavorites.length > 0 ? (
        <Grid>
          {filteredAndSortedFavorites.map((company) => (
            <CompanyCard key={company.name} onClick={() => handleCompanyClick(company)}>
              <CompanyName>{company.name}</CompanyName>
              <CompanyInfo>{company.description || 'No description available'}</CompanyInfo>
            </CompanyCard>
          ))}
        </Grid>
      ) : (
        <EmptyState>
          <Star size={48} />
          <p>No favorite companies yet. Star a company to add it to your favorites.</p>
        </EmptyState>
      )}

      {selectedCompany && (
        <CompanyModal
          isOpen={!!selectedCompany}
          onClose={handleCloseModal}
          company={selectedCompany}
        />
      )}
    </Container>
  );
};

export default FavoritesScreen; 