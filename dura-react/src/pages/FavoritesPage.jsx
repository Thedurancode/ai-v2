import React, { useState } from 'react';
import styled from 'styled-components';
import { useFavorites } from '../context/FavoritesContext';
import CompanyModal from '../components/CompanyModal';
import { m as motion } from 'framer-motion';

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
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: rgba(99, 102, 241, 0.08);
    filter: blur(60px);
  }

  &::before {
    top: 10%;
    left: 20%;
    animation: float 15s ease-in-out infinite alternate;
  }

  &::after {
    bottom: 15%;
    right: 20%;
    background: rgba(244, 63, 94, 0.08);
    animation: float 18s ease-in-out infinite alternate-reverse;
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

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  position: relative;
  z-index: 1;
`;

const Title = styled.h1`
  color: ${props => props.theme?.colors?.text?.primary || '#FFFFFF'};
  margin-bottom: 2rem;
  font-size: 2rem;
`;

const EmptyState = styled(motion.div)`
  text-align: center;
  padding: 3rem;
  color: ${props => props.theme?.colors?.text?.secondary || '#CCCCCC'};
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  max-width: 500px;
  margin: 4rem auto;
`;

const EmptyStateTitle = styled.h2`
  color: ${props => props.theme?.colors?.text?.primary || '#FFFFFF'};
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const EmptyStateText = styled.p`
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const EmptyStateIcon = styled(motion.div)`
  font-size: 3rem;
  margin-bottom: 1.5rem;
  color: #F59E0B;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
`;

const CompanyCard = styled(motion.div)`
  background: ${props => props.theme?.colors?.background?.secondary || '#1E1E1E'};
  border-radius: ${props => props.theme?.borderRadius?.lg || '0.75rem'};
  padding: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-4px);
  }
`;

const CompanyName = styled.h3`
  color: ${props => props.theme?.colors?.text?.primary || '#FFFFFF'};
  margin-bottom: 0.5rem;
`;

const CompanyDescription = styled.p`
  color: ${props => props.theme?.colors?.text?.secondary || '#CCCCCC'};
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const FavoriteButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.isFavorite ? '#F59E0B' : '#6B7280'};
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.2s ease;

  &:hover {
    color: #F59E0B;
  }
`;

const FavoritesPage = () => {
  const { favorites, toggleFavorite } = useFavorites();
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectCompany = (company) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCompany(null);
  };

  return (
    <>
      <AnimatedBackground 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <PageContainer>
        <Title
          as={motion.h1}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Favorite Companies
        </Title>
        {favorites.length === 0 ? (
          <EmptyState
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <EmptyStateIcon
              animate={{ 
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.1, 1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              ⭐
            </EmptyStateIcon>
            <EmptyStateTitle>No favorite companies yet</EmptyStateTitle>
            <EmptyStateText>
              Start adding companies to your favorites by clicking the star icon in the company details.
              Your favorite companies will appear here for quick access!
            </EmptyStateText>
          </EmptyState>
        ) : (
          <Grid
            as={motion.div}
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {favorites.map((company, index) => (
              <CompanyCard
                key={company.id}
                onClick={() => handleSelectCompany(company)}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { 
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
              >
                <CompanyName>{company.name}</CompanyName>
                <CompanyDescription>
                  {company.description?.slice(0, 150)}...
                </CompanyDescription>
                <FavoriteButton
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(company);
                  }}
                  isFavorite={true}
                >
                  ★ Remove from Favorites
                </FavoriteButton>
              </CompanyCard>
            ))}
          </Grid>
        )}
        {selectedCompany && (
          <CompanyModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            company={selectedCompany}
          />
        )}
      </PageContainer>
    </>
  );
};

export default FavoritesPage; 