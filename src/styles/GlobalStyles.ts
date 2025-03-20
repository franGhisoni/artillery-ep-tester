import { createGlobalStyle, keyframes } from 'styled-components';

// Importamos explícitamente DefaultTheme para extenderlo
import 'styled-components';

// Keyframes para las animaciones de los elementos del fondo
const float = keyframes`
  0% {
    transform: translateY(0px) translateX(0px);
  }
  50% {
    transform: translateY(-20px) translateX(10px);
  }
  100% {
    transform: translateY(0px) translateX(0px);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 0.3;
  }
`;

// Nuevo keyframe para un movimiento más notorio
const moveAround = keyframes`
  0% {
    transform: translateX(0) translateY(0);
  }
  25% {
    transform: translateX(50px) translateY(-30px);
  }
  50% {
    transform: translateX(100px) translateY(0);
  }
  75% {
    transform: translateX(50px) translateY(30px);
  }
  100% {
    transform: translateX(0) translateY(0);
  }
`;

export const theme = {
  colors: {
    primary: '#4dfe53',
    primaryDark: '#3bcf42',
    primaryLight: '#7aff7f',
    background: '#121212',
    surface: 'rgba(30, 30, 30, 0.7)',
    surfaceLight: 'rgba(50, 50, 50, 0.7)',
    text: '#f5f5f5',
    textMuted: '#a0a0a0',
    error: '#ff6b6b',
    success: '#4dfe53',
    warning: '#ffd166',
    info: '#118ab2',
  },
  glass: {
    background: 'rgba(30, 30, 30, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    backdropFilter: 'blur(8px)',
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '16px',
    circle: '50%',
  },
  spacing: {
    xs: '4px',
    s: '8px',
    m: '16px',
    l: '24px',
    xl: '32px',
    xxl: '48px',
  },
  fonts: {
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
    heading: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', 'Roboto Mono', Menlo, monospace",
  },
  fontSizes: {
    small: '0.875rem',
    regular: '1rem',
    medium: '1.25rem',
    large: '1.5rem',
    xlarge: '2rem',
    xxlarge: '2.5rem',
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
  },
  transitions: {
    fast: '0.1s ease',
    medium: '0.2s ease',
    slow: '0.3s ease',
  },
  zIndices: {
    dropdown: 100,
    modal: 200,
    tooltip: 300,
  },
};

export type Theme = typeof theme;

// Extendemos DefaultTheme para styled-components
declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}

export const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    height: 100%;
    width: 100%;
  }

  body {
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: ${({ theme }) => theme.fontSizes.regular};
    line-height: 1.5;
    min-height: 100vh;
    overflow-x: hidden;
    position: relative;
  }

  /* Elementos animados de fondo */
  body::before,
  body::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
    pointer-events: none;
  }

  /* Fondo principal con gradientes más notorios */
  body::before {
    background-image: 
      radial-gradient(circle at 30% 20%, rgba(77, 254, 83, 0.3) 0%, transparent 500px),
      radial-gradient(circle at 70% 60%, rgba(77, 254, 83, 0.25) 0%, transparent 500px),
      radial-gradient(circle at 10% 90%, rgba(77, 254, 83, 0.2) 0%, transparent 300px);
  }
  
  /* Elementos animados */
  #root::before {
    content: '';
    position: fixed;
    width: 800px;
    height: 800px;
    background: radial-gradient(circle, rgba(77, 254, 83, 0.2) 0%, transparent 70%);
    border-radius: 50%;
    top: -200px;
    left: -100px;
    z-index: -1;
    animation: ${float} 15s ease-in-out infinite;
  }

  #root::after {
    content: '';
    position: fixed;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(77, 254, 83, 0.15) 0%, transparent 70%);
    border-radius: 50%;
    bottom: -100px;
    right: -50px;
    z-index: -1;
    animation: ${float} 20s ease-in-out infinite reverse;
  }

  /* Partículas adicionales */
  .bg-particle-1, .bg-particle-2, .bg-particle-3, .bg-particle-4 {
    position: fixed;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(77, 254, 83, 0.25) 0%, transparent 70%);
    z-index: -1;
  }

  .bg-particle-1 {
    width: 350px;
    height: 350px;
    top: 20%;
    left: 30%;
    animation: ${pulse} 8s ease-in-out infinite, ${moveAround} 40s linear infinite;
  }

  .bg-particle-2 {
    width: 250px;
    height: 250px;
    top: 60%;
    left: 10%;
    animation: ${pulse} 12s ease-in-out 2s infinite, ${moveAround} 50s linear infinite reverse;
  }

  .bg-particle-3 {
    width: 300px;
    height: 300px;
    top: 30%;
    right: 10%;
    animation: ${pulse} 10s ease-in-out 1s infinite, ${moveAround} 45s linear infinite;
  }
  
  .bg-particle-4 {
    width: 200px;
    height: 200px;
    bottom: 15%;
    right: 25%;
    animation: ${pulse} 9s ease-in-out 3s infinite, ${moveAround} 55s linear infinite reverse;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${({ theme }) => theme.fonts.heading};
    font-weight: ${({ theme }) => theme.fontWeights.semiBold};
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: ${({ theme }) => theme.spacing.m};
  }

  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    transition: color ${({ theme }) => theme.transitions.fast};

    &:hover {
      color: ${({ theme }) => theme.colors.primaryLight};
    }
  }

  button, select, input, textarea {
    font-family: ${({ theme }) => theme.fonts.body};
  }

  input, select, textarea, button {
    &:focus {
      outline: 2px solid ${({ theme }) => theme.colors.primary};
      outline-offset: 2px;
    }
  }

  code, pre {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.9em;
  }

  pre {
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    padding: ${({ theme }) => theme.spacing.m};
    overflow: auto;
  }

  #root {
    min-height: 100vh;
    position: relative;
  }

  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(77, 254, 83, 0.3);
    border-radius: 8px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(77, 254, 83, 0.5);
  }
`; 