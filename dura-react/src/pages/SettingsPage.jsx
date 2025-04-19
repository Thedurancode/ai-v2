import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { m as motion } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';
import { Gear, ArrowClockwise, Info } from '@phosphor-icons/react';
import { getScoringCriteria } from '../services/api';

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
    width: 20vw;
    height: 20vw;
    max-width: 300px;
    max-height: 300px;
    min-width: 150px;
    min-height: 150px;
    border-radius: 50%;
    background: rgba(99, 102, 241, 0.08);
    filter: blur(60px);
  }

  &::before {
    top: 10%;
    left: 10%;
    animation: float 15s ease-in-out infinite alternate;

    @media (max-width: ${props => props.theme.breakpoints.md}) {
      left: 5%;
    }
  }

  &::after {
    bottom: 10%;
    right: 10%;
    background: rgba(244, 63, 94, 0.08);
    animation: float 18s ease-in-out infinite alternate-reverse;

    @media (max-width: ${props => props.theme.breakpoints.md}) {
      right: 5%;
    }
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

const PageContainer = styled(motion.div)`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  color: ${({ theme }) => theme.colors.text.primary};
  position: relative;
  z-index: 1;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  margin-bottom: 2rem;
  color: ${({ theme }) => theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SettingsSection = styled.section`
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 200px;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.primary};
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled(motion.button)`
  padding: 0.75rem 1.5rem;
  background: ${({ theme, variant }) =>
    variant === 'primary' ? theme.colors.primary :
    variant === 'danger' ? theme.colors.status.error :
    'transparent'};
  color: white;
  border: ${({ theme, variant }) =>
    variant === 'outline' ? `1px solid ${theme.colors.border}` : 'none'};
  color: ${({ theme, variant }) =>
    variant === 'outline' ? theme.colors.text.primary : 'white'};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const InfoText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const InfoBox = styled.div`
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
`;

const LoadingText = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-style: italic;
  margin: 1rem 0;
`;

const SystemPromptContainer = styled.div`
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 0.9rem;
  max-height: 300px;
  overflow-y: auto;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const SettingsPage = () => {
  const { settings, updateSetting, resetSettings } = useSettings();
  const [scoringPrompt, setScoringPrompt] = useState('');
  const [customScoringCriteria, setCustomScoringCriteria] = useState(null);
  const [isModified, setIsModified] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scoringCriteria, setScoringCriteria] = useState(null);
  const [activeTab, setActiveTab] = useState('prompt'); // 'prompt' or 'criteria'

  // Fetch the current system prompt and scoring criteria
  useEffect(() => {
    const fetchScoringCriteria = async () => {
      try {
        setIsLoading(true);
        setError(null); // Reset any previous errors

        const data = await getScoringCriteria();

        if (data.scoring_prompt) {
          setSystemPrompt(data.scoring_prompt);
        } else if (data.scoring_criteria) {
          // If no explicit prompt is returned, create a readable version from the criteria
          try {
            const criteriaText = Object.entries(data.scoring_criteria)
              .map(([key, value]) => {
                return `${value.name || key} (Max: ${value.max_points} points)\n` +
                  (value.description ? `${value.description}\n` : '') +
                  (value.criteria ? value.criteria.map(c =>
                    `- ${c.points} points: ${c.description}`
                  ).join('\n') : '');
              }).join('\n\n');

            setSystemPrompt(`Scoring Criteria:\n\n${criteriaText}`);
          } catch (formatError) {
            console.error('Error formatting criteria:', formatError);
            // Fallback to a simple representation
            setSystemPrompt(JSON.stringify(data.scoring_criteria, null, 2));
          }
        } else {
          setSystemPrompt('No scoring criteria available. Using system default.');
        }

        setScoringCriteria(data.scoring_criteria);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching scoring criteria:', err);
        setError('Failed to load the current scoring criteria. Please try again later.');
        setIsLoading(false);

        // Set a fallback prompt so the UI doesn't look completely broken
        setSystemPrompt('Unable to load the current scoring criteria. The system will use its default scoring method.');
      }
    };

    fetchScoringCriteria();
  }, []);

  // Initialize form with current settings
  useEffect(() => {
    if (settings.scoringPrompt) {
      setScoringPrompt(settings.scoringPrompt);
    } else {
      // If no custom prompt is set, show a placeholder
      setScoringPrompt('');
    }

    if (settings.scoringCriteria) {
      setCustomScoringCriteria(settings.scoringCriteria);
    } else {
      // If no custom criteria is set, use the system one
      setCustomScoringCriteria(null);
    }

    setIsModified(false);
  }, [settings]);

  const handlePromptChange = (e) => {
    setScoringPrompt(e.target.value);
    setIsModified(true);
    setIsSaved(false);
  };

  const handleCriteriaChange = (criteriaJson) => {
    try {
      // If it's a string, try to parse it
      const parsedCriteria = typeof criteriaJson === 'string'
        ? JSON.parse(criteriaJson)
        : criteriaJson;

      setCustomScoringCriteria(parsedCriteria);
      setIsModified(true);
      setIsSaved(false);
    } catch (error) {
      console.error('Error parsing criteria JSON:', error);
      // Don't update if there's a parsing error
    }
  };

  const handleSave = () => {
    if (activeTab === 'prompt') {
      // If the prompt is empty, set it to null to use the default
      const valueToSave = scoringPrompt.trim() === '' ? null : scoringPrompt;
      updateSetting('scoringPrompt', valueToSave);
    } else if (activeTab === 'criteria') {
      // Save the custom criteria
      updateSetting('scoringCriteria', customScoringCriteria);
    }

    setIsModified(false);
    setIsSaved(true);

    // Reset the saved message after a delay
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  const handleReset = () => {
    if (activeTab === 'prompt') {
      // Reset prompt to default (null)
      updateSetting('scoringPrompt', null);
      setScoringPrompt('');
    } else if (activeTab === 'criteria') {
      // Reset criteria to default (null)
      updateSetting('scoringCriteria', null);
      setCustomScoringCriteria(null);
    }

    setIsModified(false);
  };

  const handleCriteriaEdit = (category, field, value) => {
    if (!customScoringCriteria) {
      // If no custom criteria exists yet, clone the system one
      setCustomScoringCriteria({...scoringCriteria});
      return;
    }

    const updatedCriteria = {...customScoringCriteria};

    if (!updatedCriteria[category]) {
      updatedCriteria[category] = {};
    }

    updatedCriteria[category][field] = value;
    setCustomScoringCriteria(updatedCriteria);
    setIsModified(true);
    setIsSaved(false);
  };

  return (
    <>
      <AnimatedBackground
        animate={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        }}
        transition={{ duration: 0.8 }}
      />
      <PageContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
      <PageTitle>
        <Gear size={32} weight="bold" />
        Settings
      </PageTitle>

      <SettingsSection>
        <SectionTitle>Scoring Settings</SectionTitle>

        {/* Tabs for switching between prompt and criteria */}
        <ButtonGroup style={{ marginBottom: '1.5rem' }}>
          <Button
            variant={activeTab === 'prompt' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('prompt')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Scoring Prompt
          </Button>

          <Button
            variant={activeTab === 'criteria' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('criteria')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Scoring Criteria
          </Button>
        </ButtonGroup>

        {activeTab === 'prompt' ? (
          <>
            <InfoBox>
              <Info size={24} weight="bold" style={{ minWidth: '24px', color: '#6366f1' }} />
              <div>
                <strong>Current System Prompt</strong>
                <p>This is the default scoring prompt used by the system. You can customize it below.</p>
              </div>
            </InfoBox>

            {isLoading ? (
              <LoadingText>Loading current scoring criteria...</LoadingText>
            ) : error ? (
              <InfoBox style={{ borderColor: '#F44336' }}>
                <Info size={24} weight="bold" style={{ minWidth: '24px', color: '#F44336' }} />
                <div>{error}</div>
              </InfoBox>
            ) : (
              <SystemPromptContainer>
                {systemPrompt}
              </SystemPromptContainer>
            )}

            <InfoText>
              Customize the prompt used for scoring companies. Leave empty to use the default system prompt shown above.
            </InfoText>

            <FormGroup>
              <Label htmlFor="scoringPrompt">Custom Scoring Prompt</Label>
              <TextArea
                id="scoringPrompt"
                value={scoringPrompt}
                onChange={handlePromptChange}
                placeholder="Enter your custom scoring prompt here. Leave empty to use the default system prompt."
              />
            </FormGroup>
          </>
        ) : (
          <>
            <InfoBox>
              <Info size={24} weight="bold" style={{ minWidth: '24px', color: '#6366f1' }} />
              <div>
                <strong>Scoring Criteria</strong>
                <p>These criteria are used to evaluate potential partners. You can customize them below.</p>
              </div>
            </InfoBox>

            {isLoading ? (
              <LoadingText>Loading current scoring criteria...</LoadingText>
            ) : error ? (
              <InfoBox style={{ borderColor: '#F44336' }}>
                <Info size={24} weight="bold" style={{ minWidth: '24px', color: '#F44336' }} />
                <div>{error}</div>
              </InfoBox>
            ) : (
              <>
                <SystemPromptContainer>
                  {JSON.stringify(scoringCriteria, null, 2)}
                </SystemPromptContainer>

                <InfoText>
                  Customize the scoring criteria used for evaluating companies. You can modify the weights and descriptions.
                </InfoText>

                <FormGroup>
                  <Label htmlFor="scoringCriteria">Custom Scoring Criteria (JSON format)</Label>
                  <TextArea
                    id="scoringCriteria"
                    value={customScoringCriteria ? JSON.stringify(customScoringCriteria, null, 2) : ''}
                    onChange={(e) => handleCriteriaChange(e.target.value)}
                    placeholder="Enter your custom scoring criteria in JSON format. Leave empty to use the default criteria."
                  />
                </FormGroup>
              </>
            )}
          </>
        )}

        <ButtonGroup>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!isModified}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Save Changes
          </Button>

          <Button
            variant="outline"
            onClick={handleReset}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <ArrowClockwise size={20} />
            Reset to Default
          </Button>
        </ButtonGroup>

        {isSaved && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              color: '#4CAF50',
              marginTop: '1rem',
              fontWeight: 500
            }}
          >
            Settings saved successfully!
          </motion.p>
        )}
      </SettingsSection>
    </PageContainer>
    </>
  );
};

export default SettingsPage;
