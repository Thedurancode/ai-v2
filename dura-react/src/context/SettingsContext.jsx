import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  // Initialize settings from localStorage or use defaults
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('app_settings');
    return savedSettings
      ? JSON.parse(savedSettings)
      : {
          scoringPrompt: null, // null means use the default prompt from the backend
          scoringCriteria: null, // null means use the default criteria from the backend
        };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings]);

  // Update a specific setting
  const updateSetting = (key, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [key]: value
    }));
  };

  // Reset settings to default
  const resetSettings = () => {
    const defaultSettings = {
      scoringPrompt: null,
      scoringCriteria: null,
    };
    setSettings(defaultSettings);
    localStorage.setItem('app_settings', JSON.stringify(defaultSettings));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        resetSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
