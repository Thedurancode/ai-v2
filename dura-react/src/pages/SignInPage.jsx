import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import styled from 'styled-components';
import { m as motion } from 'framer-motion';

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

const SignInPage = () => {
  try {
    return (
      <LoginContainer>
        <LoginBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Title>MLSE Partner Research</Title>
          <SignIn
            routing="path"
            path="/sign-in"
            redirectUrl="/"
            onError={(error) => console.error('Clerk SignIn error:', error)}
            appearance={{
              elements: {
                rootBox: {
                  width: '100%'
                },
                card: {
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                  width: '100%'
                },
                headerTitle: {
                  fontSize: '1.5rem',
                  color: 'white'
                },
                headerSubtitle: {
                  color: 'rgba(255, 255, 255, 0.7)'
                },
                formButtonPrimary: {
                  backgroundColor: '#3a86ff',
                  '&:hover': {
                    backgroundColor: '#2a76ef'
                  }
                },
                formFieldInput: {
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white'
                },
                footerActionLink: {
                  color: '#3a86ff'
                }
              }
            }}
          />
        </LoginBox>
      </LoginContainer>
    );
  } catch (error) {
    console.error('SignInPage render error:', error);
    return (
      <LoginContainer>
        <LoginBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Title>Authentication Error</Title>
          <div style={{ color: 'white', textAlign: 'center' }}>
            <p>Please check your network connection and refresh the page.</p>
            <p style={{ marginTop: '1rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              Error details: {error.message}
            </p>
          </div>
        </LoginBox>
      </LoginContainer>
    );
  }
};

export default SignInPage;
