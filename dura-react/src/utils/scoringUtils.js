/**
 * Utility functions for handling scoring prompt and criteria customization
 */

/**
 * Get the custom scoring prompt if available, otherwise return null
 * @returns {string|null} The custom scoring prompt or null if not set
 */
export const getCustomScoringPrompt = () => {
  try {
    const settings = localStorage.getItem('app_settings');
    if (!settings) return null;

    const parsedSettings = JSON.parse(settings);
    return parsedSettings.scoringPrompt || null;
  } catch (error) {
    console.error('Error getting custom scoring prompt:', error);
    return null;
  }
};

/**
 * Get the custom scoring criteria if available, otherwise return null
 * @returns {Object|null} The custom scoring criteria or null if not set
 */
export const getCustomScoringCriteria = () => {
  try {
    const settings = localStorage.getItem('app_settings');
    if (!settings) return null;

    const parsedSettings = JSON.parse(settings);
    return parsedSettings.scoringCriteria || null;
  } catch (error) {
    console.error('Error getting custom scoring criteria:', error);
    return null;
  }
};

/**
 * Prepare API request data with custom scoring prompt and criteria if available
 * @param {Object} requestData - The original request data
 * @returns {Object} The modified request data with custom scoring prompt and criteria if available
 */
export const prepareRequestWithScoringPrompt = (requestData) => {
  const customPrompt = getCustomScoringPrompt();
  const customCriteria = getCustomScoringCriteria();

  let modifiedRequest = { ...requestData };

  if (customPrompt) {
    modifiedRequest.custom_scoring_prompt = customPrompt;
  }

  if (customCriteria) {
    modifiedRequest.custom_scoring_criteria = customCriteria;
  }

  return modifiedRequest;
};
