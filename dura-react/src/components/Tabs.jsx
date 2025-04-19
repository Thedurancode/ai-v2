import React, { useState } from 'react';
import styled from 'styled-components';
import { m as motion } from 'framer-motion';

const TabsContainer = styled.div`
  width: 100%;
`;

const TabButtons = styled.div`
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const TabButton = styled(motion.button)`
  background: none;
  border: none;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all ${({ theme }) => theme.transitions.normal};
  position: relative;
  
  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  ${({ isActive, theme }) => isActive && `
    color: ${theme.colors.accent};
    font-weight: ${theme.fontWeights.medium};
  `}
`;

const TabIndicator = styled(motion.div)`
  height: 2px;
  background-color: ${({ theme }) => theme.colors.accent};
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
`;

const TabContent = styled.div`
  width: 100%;
`;

const TabPaneContainer = styled(motion.div)`
  padding: ${({ theme }) => theme.spacing.md} 0;
`;

const Tabs = ({ children, defaultTab }) => {
  // Find tab names from children
  const tabNames = React.Children.map(children, child => child.props.label);
  const [activeTab, setActiveTab] = useState(defaultTab || tabNames[0]);

  // Tab animations
  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3
      }
    },
    exit: { 
      opacity: 0, 
      y: 10,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <TabsContainer>
      <TabButtons>
        {tabNames.map((tabName) => (
          <TabButton
            key={tabName}
            isActive={activeTab === tabName}
            onClick={() => setActiveTab(tabName)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {tabName}
            {activeTab === tabName && (
              <TabIndicator
                layoutId="tab-indicator"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </TabButton>
        ))}
      </TabButtons>
      
      <TabContent>
        {React.Children.map(children, (child) => {
          // Check if this is the active tab
          const isActive = child.props.label === activeTab;
          
          // Return the child with additional props
          return (
            <TabPaneContainer
              initial="hidden"
              animate={isActive ? "visible" : "hidden"}
              exit="exit"
              variants={tabVariants}
              style={{ display: isActive ? 'block' : 'none' }}
            >
              {child}
            </TabPaneContainer>
          );
        })}
      </TabContent>
    </TabsContainer>
  );
};

// Tab Pane component
export const TabPane = ({ children }) => {
  return <>{children}</>;
};

export default Tabs; 