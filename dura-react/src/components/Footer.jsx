import React from 'react';
import styled from 'styled-components';
import { m as motion } from 'framer-motion';

const FooterContainer = styled(motion.footer)`
  margin-top: auto;
  padding: ${({ theme }) => theme.spacing.xl} 0;
  text-align: center;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const FooterText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const Footer = () => {
  return (
    <FooterContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      <FooterText>
        &copy; {new Date().getFullYear()} MLSE Partner Research - Partnership Intelligence Platform
      </FooterText>
    </FooterContainer>
  );
};

export default Footer; 