import React from 'react';
import styled from 'styled-components';

const ErrorBoundaryContainer = styled.div`
  padding: 2rem;
  background-color: ${props => props.theme?.colors?.background?.secondary || '#1E1E1E'};
  border: 1px solid ${props => props.theme?.colors?.status?.error || '#F44336'};
  border-radius: ${props => props.theme?.borderRadius?.md || '0.5rem'};
  margin: 1rem 0;
  color: ${props => props.theme?.colors?.text?.primary || '#FFFFFF'};
`;

const ErrorTitle = styled.h3`
  color: ${props => props.theme?.colors?.status?.error || '#F44336'};
  margin-bottom: 0.5rem;
`;

const ErrorDetails = styled.pre`
  background-color: rgba(0, 0, 0, 0.2);
  padding: 0.5rem;
  border-radius: ${props => props.theme?.borderRadius?.sm || '0.25rem'};
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: ${props => props.theme?.colors?.text?.secondary || '#CCCCCC'};
  max-height: 200px;
  overflow-y: auto;
`;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
    // Optionally log to your logging service here
    // logErrorToMyService(error, errorInfo); 
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <ErrorBoundaryContainer>
          <ErrorTitle>Something went wrong.</ErrorTitle>
          <p>A part of the UI failed to render correctly. Please try refreshing the page.</p>
          {/* Optionally display error details in development or for internal tools */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <>
              <br />
              <ErrorDetails>
                {this.state.error.toString()}
                {this.state.errorInfo && <details><summary>Component Stack</summary>{this.state.errorInfo.componentStack}</details>}
              </ErrorDetails>
            </>
          )}
        </ErrorBoundaryContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;