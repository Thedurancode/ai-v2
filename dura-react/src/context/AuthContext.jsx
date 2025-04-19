import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase, getCurrentUser, setupAuthListener } from '../services/supabase';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current session
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user || null);

        // Set up auth state change listener
        const { data: authListener } = setupAuthListener((event, session) => {
          console.log(`Supabase auth event: ${event}`, session);
          setSession(session);
          setUser(session?.user || null);
        });

        setLoading(false);
        return () => {
          authListener?.subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setError(error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Auth context value
  const value = {
    user,
    session,
    loading,
    error,
    isAuthenticated,
    setUser,
    setSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
