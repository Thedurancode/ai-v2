import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle, ThemeProvider as StyledThemeProvider } from 'styled-components';
import { useTheme } from './context/ThemeContext';

// Pages
import HomePage from './pages/HomePage';
import FavoritesPage from './pages/FavoritesPage';
import CurrentPartnersPage from './pages/CurrentPartnersPage';
import PotentialPartnersPage from './pages/PotentialPartnersPage';
import SettingsPage from './pages/SettingsPage';
import SimpleLoginPage from './pages/SimpleLoginPage';
import Header from './components/Header';
import LoadingScreen from './components/LoadingScreen';

// Global styles
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    width: 100%;
    overflow-x: hidden;
  }

  body {
    font-family: ${props => props.theme.fonts.primary};
    background-color: ${props => props.theme.colors.background.primary};
    color: ${props => props.theme.colors.text.primary};
    line-height: 1.6;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* Hide scrollbars while keeping scrolling functionality */
  * {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }

  *::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  button, input {
    font-family: inherit;
  }

  @media (max-width: 480px) {
    html {
      font-size: 14px;
    }
  }
`;

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2.5rem;
  width: 100%;

  @media (max-width: 1200px) {
    max-width: 1200px;
    padding: 0 2rem;
  }

  @media (max-width: 768px) {
    padding: 0 1rem;
    max-width: 100%;
  }

  @media (max-width: 480px) {
    padding: 0 0.5rem;
    max-width: 100%;
  }
`;

// Auth guard component
const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsAuthenticated(isLoggedIn);
    setIsLoading(false);

    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [navigate]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? children : null;
};

const App = () => {
  const theme = useTheme();
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const toggleCompanyHistory = () => {
    setIsHistoryModalOpen(!isHistoryModalOpen);
  };

  return (
    <StyledThemeProvider theme={theme}>
      <GlobalStyle />
      <Routes>
        {/* Login route */}
        <Route path="/login" element={<SimpleLoginPage />} />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppContainer>
              <Header toggleCompanyHistory={toggleCompanyHistory} />
              <HomePage isHistoryModalOpen={isHistoryModalOpen} setIsHistoryModalOpen={setIsHistoryModalOpen} />
            </AppContainer>
          </ProtectedRoute>
        } />
        <Route path="/favorites" element={
          <ProtectedRoute>
            <AppContainer>
              <Header toggleCompanyHistory={toggleCompanyHistory} />
              <FavoritesPage />
            </AppContainer>
          </ProtectedRoute>
        } />
        <Route path="/current-partners" element={
          <ProtectedRoute>
            <AppContainer>
              <Header toggleCompanyHistory={toggleCompanyHistory} />
              <CurrentPartnersPage />
            </AppContainer>
          </ProtectedRoute>
        } />
        <Route path="/potential-partners" element={
          <ProtectedRoute>
            <AppContainer>
              <Header toggleCompanyHistory={toggleCompanyHistory} />
              <PotentialPartnersPage />
            </AppContainer>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <AppContainer>
              <Header toggleCompanyHistory={toggleCompanyHistory} />
              <SettingsPage />
            </AppContainer>
          </ProtectedRoute>
        } />

        {/* Redirect to login if not authenticated */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </StyledThemeProvider>
  );
};

export default App;