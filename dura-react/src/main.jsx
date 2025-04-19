import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LazyMotion, domAnimation } from 'framer-motion';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ResearchProvider } from './context/ResearchContext';
import { SettingsProvider } from './context/SettingsContext';

// Import axios configuration
import './utils/axiosConfig';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <FavoritesProvider>
          <ResearchProvider>
            <SettingsProvider>
              <LazyMotion features={domAnimation} strict>
                <App />
              </LazyMotion>
            </SettingsProvider>
          </ResearchProvider>
        </FavoritesProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);