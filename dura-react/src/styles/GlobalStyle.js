import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    
    @media (max-width: ${props => props.theme.breakpoints.md}) {
      font-size: 15px;
    }
    
    @media (max-width: ${props => props.theme.breakpoints.sm}) {
      font-size: 14px;
    }
  }

  body {
    font-family: ${props => props.theme.fonts.primary};
    background-color: ${props => props.theme.colors.background.primary};
    color: ${props => props.theme.colors.text.primary};
    line-height: 1.6;
    min-height: 100vh;
    overflow-x: hidden;
    padding: 0;
    margin: 0;
    
    @media (max-width: ${props => props.theme.breakpoints.md}) {
      line-height: 1.5;
    }
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
`;
