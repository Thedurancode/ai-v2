import React from 'react';
import styled, { keyframes } from 'styled-components';
import { m as motion } from 'framer-motion';

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const SkeletonWrapper = styled.div`
  background-color: ${props => props.theme?.colors?.background?.secondary || '#1e293b'}; /* Slightly lighter than primary background */
  border-radius: ${props => props.theme?.borderRadius?.md || '0.5rem'};
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to right, 
      transparent 0%, 
      ${props => props.theme?.colors?.background?.tertiary || '#334155'} 50%, 
      transparent 100%);
    animation: ${shimmer} 1.5s infinite linear;
    background-size: 2000px 100%; /* Make gradient wider than container */
  }
`;

const SkeletonLine = styled.div`
  background-color: ${props => props.theme?.colors?.background?.tertiary || '#334155'};
  border-radius: ${props => props.theme?.borderRadius?.sm || '0.25rem'};
  height: ${props => props.height || '1rem'};
  width: ${props => props.width || '100%'};
  margin-bottom: ${props => props.mb || '0.75rem'};
  opacity: 0.7; /* Make skeleton lines slightly transparent */
`;

const SkeletonCard = () => (
  <SkeletonWrapper>
    <SkeletonLine width="60%" height="1.2rem" mb="1rem" />
    <SkeletonLine width="90%" />
    <SkeletonLine width="80%" />
    <SkeletonLine width="70%" mb="0" />
  </SkeletonWrapper>
);

// A simple skeleton for the results area
const ResultsSkeleton = ({ count = 3 }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Skeleton for potential analysis section */}
      <SkeletonWrapper>
        <SkeletonLine width="40%" height="1.5rem" mb="1.5rem" />
        <SkeletonLine width="100%" />
        <SkeletonLine width="100%" />
        <SkeletonLine width="70%" mb="0" />
      </SkeletonWrapper>
      
      {/* Skeleton for company cards */}
      {[...Array(count)].map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </motion.div>
  );
};

export default ResultsSkeleton;