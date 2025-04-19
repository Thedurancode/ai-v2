import React from 'react';
import styled from 'styled-components';
import { m as motion } from 'framer-motion';
import { CheckCircle, XCircle, Buildings } from '@phosphor-icons/react';

const Card = styled(motion.div)`
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
  width: 100%;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.2), 0 10px 15px -6px rgba(0, 0, 0, 0.15);
    border-color: rgba(99, 102, 241, 0.3);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    border-radius: 0.75rem;
    transform: none;
  }
`;

const CardHeader = styled.div`
  padding: 1rem;
  background-color: rgba(15, 23, 42, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: 0.75rem;
  }
`;

const LogoAndName = styled.div`
  display: flex;
  align-items: center;
`;

const CompanyLogo = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  background-color: rgba(30, 41, 59, 0.8);
  margin-right: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 600;
  font-size: 0.875rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 36px;
    height: 36px;
    margin-right: 0.5rem;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }
`;

const CompanyName = styled.h3`
  font-size: 1rem;
  margin: 0;
  color: #ffffff;
  font-weight: 600;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: 0.875rem;
  }
`;

const StatusIndicators = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const CompetitionIndicator = styled.div`
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.6875rem;
  gap: 0.25rem;
  font-weight: 500;
  white-space: nowrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: 0.2rem 0.4rem;
    font-size: 0.625rem;
  }
  
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

const CardBody = styled.div`
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: 0.75rem;
  }
`;

const CompanyDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.6;
`;

const ScoreContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  width: 100%;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const ScoreCircle = styled(motion.div)`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  color: white;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 40px;
    height: 40px;
    font-size: 0.875rem;
  }
  
  ${({ score, theme }) => {
    if (score >= 8) return `background: linear-gradient(135deg, ${theme.colors.scoring?.excellent || theme.colors.status.excellent} 0%, #00b8a9 100%);`;
    if (score >= 6) return `background: linear-gradient(135deg, ${theme.colors.scoring?.good || theme.colors.status.good} 0%, #e72b3e 100%);`;
    if (score >= 4) return `background: linear-gradient(135deg, ${theme.colors.scoring?.average || theme.colors.status.average} 0%, #ffb300 100%);`;
    return `background: linear-gradient(135deg, ${theme.colors.scoring?.poor || theme.colors.status.poor} 0%, #e53935 100%);`;
  }}
`;

const ScoreInfo = styled.div`
  flex: 1;
  margin-left: 1rem;
`;

const ScoreLabel = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.25rem;
`;

const ScoreValue = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
`;

const CompanyCard = ({ company, onClick }) => {
  // Handle missing logo by getting initials
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get the best available logo and description
  const getLogoUrl = () => {
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

  const getDescription = () => {
    if (company.linkedin_data?.description) return company.linkedin_data.description;
    if (company.description) return company.description;
    return 'No description available.';
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    },
    hover: {
      y: -5,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  return (
    <Card
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onClick={onClick}
      layoutId={`company-card-${company.id}`}
    >
      <CardHeader>
        <LogoAndName>
          <CompanyLogo>
            {getLogoUrl() ? (
              <img src={getLogoUrl()} alt={`${company.name} logo`} />
            ) : (
              <Buildings size={24} weight="bold" />
            )}
          </CompanyLogo>
          <CompanyName>{company.name}</CompanyName>
        </LogoAndName>
        <StatusIndicators>
          <CompetitionIndicator $hasCompetition={company.has_competition}>
            {company.has_competition ? (
              <>
                <XCircle size={16} weight="fill" />
                Conflicts
              </>
            ) : (
              <>
                <CheckCircle size={16} weight="fill" />
                Compatible
              </>
            )}
          </CompetitionIndicator>
        </StatusIndicators>
      </CardHeader>
      <CardBody>
        <CompanyDescription>
          {getDescription()}
        </CompanyDescription>
        <ScoreContainer>
          <ScoreCircle 
            score={company.partnership_score}
            whileHover={{ scale: 1.05 }}
          >
            {Math.round(company.partnership_score)}
          </ScoreCircle>
          <ScoreInfo>
            <ScoreLabel>Partnership Score</ScoreLabel>
            <ScoreValue>{Math.round(company.partnership_score)}/10</ScoreValue>
          </ScoreInfo>
        </ScoreContainer>
      </CardBody>
    </Card>
  );
};

export default CompanyCard;
