import React from 'react';
import styled from 'styled-components';
import { m as motion } from 'framer-motion';

// Define styled components for the property selector
const PropertySelectorContainer = styled(motion.div)`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  justify-content: center;
  width: 100%;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    gap: 0.5rem;
    margin-top: 0.75rem;
    max-width: 100%;
  }
`;

const PropertyOption = styled(motion.button)`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: ${props => props.isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(30, 41, 59, 0.7)'};
  border: 1px solid ${props => props.isSelected ? 'rgba(99, 102, 241, 0.7)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 0.75rem;
  padding: 0.5rem 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.isSelected ? '0 0 10px rgba(99, 102, 241, 0.3)' : 'none'};
  flex: 1;
  max-width: 110px;

  &:hover {
    background-color: ${props => props.isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(30, 41, 59, 0.9)'};
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.4rem;
    max-width: 70px;
  }
`;

const PropertyLogo = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.bgcolor || 'rgba(255, 255, 255, 0.1)'};
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    margin-bottom: 0.3rem;
  }
`;

const PropertyName = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  display: block;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 0.7rem;
  }
`;

// Define the properties with their logos and colors
const properties = [
  {
    id: 'all',
    name: 'All',
    logo: 'https://cdn-icons-png.flaticon.com/512/3388/3388823.png',
    bgcolor: '#333333',
    prompt: ''
  },
  {
    id: 'maple-leafs',
    name: 'Maple Leafs',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b6/Toronto_Maple_Leafs_2016_logo.svg/1200px-Toronto_Maple_Leafs_2016_logo.svg.png',
    bgcolor: '#00205B',
    prompt: 'Focus on hockey and Toronto Maple Leafs partnerships.'
  },
  {
    id: 'raptors',
    name: 'Raptors',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/36/Toronto_Raptors_logo.svg/1200px-Toronto_Raptors_logo.svg.png',
    bgcolor: '#CE1141',
    prompt: 'Focus on basketball and Toronto Raptors partnerships.'
  }
];

const PropertySelector = ({ selectedProperty, onSelectProperty }) => {
  return (
    <PropertySelectorContainer
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {properties.map((property) => (
        <PropertyOption
          key={property.id}
          isSelected={selectedProperty === property.id}
          onClick={() => onSelectProperty(property)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PropertyLogo bgcolor={property.bgcolor}>
            <img src={property.logo} alt={`${property.name} logo`} />
          </PropertyLogo>
          <PropertyName>{property.name}</PropertyName>
        </PropertyOption>
      ))}
    </PropertySelectorContainer>
  );
};

export default PropertySelector;
