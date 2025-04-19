import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const ClerkProviderWithNavigate = ({ children }) => {
  const navigate = useNavigate();
  
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    console.error('Missing Clerk publishable key');
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: 'white',
        backgroundColor: '#121212',
        flexDirection: 'column',
        padding: '2rem'
      }}>
        <h1>Configuration Error</h1>
        <p>Clerk publishable key is missing.</p>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      navigate={(to) => navigate(to)}
    >
      {children}
    </ClerkProvider>
  );
};

export default ClerkProviderWithNavigate;
