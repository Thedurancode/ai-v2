import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { m as motion } from 'framer-motion';
import { signIn, signUp } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 150%;
    height: 150%;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0) 70%);
    top: -25%;
    left: -25%;
    z-index: -1;
  }

  &::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    background-image: url('https://www.ccab.com/wp-content/uploads/2023/02/MLSE-Logo_No-Box_Platinum.png');
    background-repeat: no-repeat;
    background-position: center;
    background-size: 300px;
    opacity: 0.03;
    z-index: -1;
  }
`;

const LoginBox = styled(motion.div)`
  width: 100%;
  max-width: 420px;
  padding: 2.5rem;
  background-color: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #3a86ff, #8338ec);
  }
`;

const Title = styled.h1`
  color: white;
  margin-bottom: 2rem;
  font-size: 2rem;
  text-align: center;
  font-weight: 600;
  letter-spacing: -0.5px;
  position: relative;
  display: inline-block;
  width: 100%;

  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, #3a86ff, #8338ec);
    border-radius: 3px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 1rem 1.25rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(15, 23, 42, 0.6);
  color: white;
  font-size: 1rem;
  width: 100%;
  transition: all 0.2s ease;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    border-color: #3a86ff;
    box-shadow: 0 0 0 2px rgba(58, 134, 255, 0.2);
    background-color: rgba(15, 23, 42, 0.8);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const Button = styled(motion.button)`
  padding: 1rem 1.25rem;
  border-radius: 8px;
  border: none;
  background: linear-gradient(90deg, #3a86ff, #8338ec);
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(58, 134, 255, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(58, 134, 255, 0.4);
  }

  &:active {
    transform: translateY(1px);
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent);
    transform: translateX(-100%);
  }

  &:hover::after {
    transform: translateX(100%);
    transition: transform 0.6s ease;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.p`
  color: #f87171;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  background-color: rgba(248, 113, 113, 0.1);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border-left: 3px solid #f87171;
`;

const SuccessMessage = styled.p`
  color: #34d399;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  background-color: rgba(52, 211, 153, 0.1);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border-left: 3px solid #34d399;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-left: 10px;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const SupabaseLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const { setUser, setSession } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Simple validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (isSignUp) {
        // Sign up with Supabase
        const { data, error } = await signUp(email, password);

        if (error) {
          console.error('Sign up error:', error);
          setError(error.message || 'Failed to sign up');
          return;
        }

        setSuccessMessage('Account created successfully! Please check your email for verification, then sign in.');
        setIsSignUp(false); // Switch back to sign in mode
      } else {
        // Sign in with Supabase
        const { data, error } = await signIn(email, password);

        if (error) {
          console.error('Login error:', error);
          setError(error.message || 'Failed to sign in');
          return;
        }

        if (data?.user && data?.session) {
          // Update auth context
          setUser(data.user);
          setSession(data.session);

          // Redirect to home page
          navigate('/');
        } else {
          setError('Something went wrong. Please try again.');
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccessMessage('');
  };

  return (
    <LoginContainer>
      <LoginBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Title>MLSE Partner Research</Title>
        <Form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
            disabled={isLoading}
          />
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Button
            type="submit"
            whileHover={{ scale: isLoading ? 1 : 1.03 }}
            whileTap={{ scale: isLoading ? 1 : 0.97 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                Signing In
                <LoadingSpinner />
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </Form>
      </LoginBox>
    </LoginContainer>
  );
};

export default SupabaseLoginPage;
