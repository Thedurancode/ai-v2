import React from 'react';
import styled from 'styled-components';
import { m as motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const LoaderContainer = styled(motion.div)`
  background-color: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 1rem;
  padding: 2.5rem;
  margin: 2rem auto;
  text-align: center;
  max-width: 850px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const LoaderTitle = styled(motion.h3)`
  color: #ffffff;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const LoaderBar = styled.div`
  width: 100%;
  height: 0.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
  margin: 1.5rem 0;
  overflow: hidden;
  position: relative;
`;

const ProgressBar = styled(motion.div)`
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 9999px;
  width: ${props => props.progress || 0}%;
  box-shadow: 0 0 15px rgba(79, 70, 229, 0.5);
`;

const Message = styled(motion.p)`
  color: rgba(255, 255, 255, 0.9);
  margin: 1.25rem 0;
  font-size: 1.125rem;
  max-width: 80%;
  line-height: 1.5;
`;

const AgentsContainer = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-around;
  margin-top: 2rem;
  flex-wrap: wrap;
  gap: 1.5rem;
`;

const AgentCard = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 120px;
  position: relative;
`;

const AgentIconContainer = styled(motion.div)`
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
  border: 2px solid rgba(255, 255, 255, ${props => props.active ? '0.3' : '0.05'});
  position: relative;
  overflow: hidden;
  box-shadow: ${props => props.active ? '0 0 20px rgba(79, 70, 229, 0.6)' : 'none'};
  transition: all 0.5s ease;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.active ? 'linear-gradient(45deg, #3b82f6, #8b5cf6)' : 'transparent'};
    opacity: ${props => props.active ? '0.15' : '0'};
  }
`;

const AnimatedRing = styled(motion.div)`
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border: 3px solid transparent;
  border-radius: 50%;
  border-top-color: ${props => props.theme?.colors?.accent || '#8b5cf6'};
  border-right-color: ${props => props.theme?.colors?.accent || '#8b5cf6'};
  display: ${props => props.active ? 'block' : 'none'};
`;

const AgentIcon = styled.div`
  font-size: 2rem;
  z-index: 2;
`;

const AgentLabel = styled(motion.span)`
  font-size: 0.9rem;
  color: ${props => props.active 
    ? '#ffffff'
    : props.completed
      ? 'rgba(255, 255, 255, 0.7)'
      : 'rgba(255, 255, 255, 0.4)'};
  text-align: center;
  font-weight: ${props => props.active ? '500' : '400'};
`;

const CompletedBadge = styled(motion.div)`
  position: absolute;
  top: 0;
  right: 0;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.7rem;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
`;

const steps = [
  { key: 'searching', label: 'Agent 1: Search', icon: '🔍' },
  { key: 'processing', label: 'Agent 2: Process', icon: '⚙️' },
  { key: 'analyzing', label: 'Agent 3: Analyze', icon: '🧠' },
  { key: 'enriching', label: 'Agent 4: Enrich', icon: '✨' }
];

const spinTransition = {
  loop: Infinity,
  duration: 3,
  ease: "linear"
};

const Loader = ({ status }) => {
  const theme = useTheme();
  
  // Get current step index
  const getStepIndex = (currentStep) => {
    const stepMap = {
      'searching': 'searching',
      'processing': 'processing',
      'analyzing': 'analyzing',
      'enriching': 'enriching',
      'complete': 'enriching'
    };
    
    const mappedStep = stepMap[currentStep] || currentStep;
    const index = steps.findIndex(step => step.key === mappedStep);
    return index >= 0 ? index : 0;
  };
  
  const currentStepIndex = getStepIndex(status.current_step);
  const progress = status.progress || Math.min(Math.max((currentStepIndex / (steps.length - 1)) * 100, 5), 100);
  
  return (
    <LoaderContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <LoaderTitle
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.span
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >✨</motion.span>
        AI Agents Working...
      </LoaderTitle>
      
      <Message
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {status.message || `Finding companies in ${status.query || 'your industry'}...`}
      </Message>
      
      <LoaderBar>
        <ProgressBar 
          progress={progress}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8 }}
        />
      </LoaderBar>
      
      <AgentsContainer>
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex || (status.completed && index === currentStepIndex);
          
          return (
            <AgentCard
              key={step.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index + 0.4 }}
            >
              <AgentIconContainer active={isActive}>
                {isActive && (
                  <AnimatedRing
                    active={isActive}
                    animate={{ rotate: 360 }}
                    transition={spinTransition}
                  />
                )}
                
                <AgentIcon>
                  <motion.span
                    animate={isActive ? { 
                      scale: [1, 1.15, 1],
                    } : {}}
                    transition={{ 
                      duration: 1.5, 
                      repeat: isActive ? Infinity : 0,
                      repeatType: "reverse" 
                    }}
                  >
                    {step.icon}
                  </motion.span>
                </AgentIcon>
                
                {isCompleted && (
                  <CompletedBadge
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    ✓
                  </CompletedBadge>
                )}
              </AgentIconContainer>
              
              <AgentLabel 
                active={isActive}
                completed={isCompleted}
                animate={isActive ? { 
                  color: "#ffffff",
                  fontWeight: 500
                } : {}}
              >
                {step.label}
              </AgentLabel>
            </AgentCard>
          );
        })}
      </AgentsContainer>
    </LoaderContainer>
  );
};

export default Loader; 