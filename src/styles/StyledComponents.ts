import styled, { css } from 'styled-components';
import { Theme } from './GlobalStyles';

// Define el tipado para styled-components
declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}

// Container styled with glassmorphic effect
export const GlassContainer = styled.div<{ $fullWidth?: boolean }>`
  background: rgba(25, 25, 25, 0.6);
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  box-shadow: 
    0 8px 32px 0 rgba(0, 0, 0, 0.37),
    0 0 10px 1px rgba(77, 254, 83, 0.05);
  padding: ${({ theme }) => theme.spacing.l};
  margin-bottom: ${({ theme }) => theme.spacing.l};
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  transition: transform ${({ theme }) => theme.transitions.medium},
    box-shadow ${({ theme }) => theme.transitions.medium},
    border ${({ theme }) => theme.transitions.medium};
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 12px 40px 0 rgba(0, 0, 0, 0.45),
      0 0 15px 2px rgba(77, 254, 83, 0.1);
    border: 1px solid rgba(77, 254, 83, 0.2);
  }

  /* Efecto extra para resaltar el glassmorphism */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: inherit;
    pointer-events: none;
    z-index: -1;
    background: linear-gradient(
      135deg,
      rgba(77, 254, 83, 0.05) 0%,
      transparent 50%,
      rgba(77, 254, 83, 0.05) 100%
    );
    opacity: 0;
    transition: opacity ${({ theme }) => theme.transitions.medium};
  }

  &:hover::before {
    opacity: 1;
  }
`;

// Card with glassmorphic effect
export const GlassCard = styled(GlassContainer)`
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;
  
  /* Efecto de brillo en el borde al hacer hover */
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 0%,
      rgba(77, 254, 83, 0.08) 30%,
      rgba(77, 254, 83, 0.12) 50%,
      rgba(77, 254, 83, 0.08) 70%,
      transparent 100%
    );
    opacity: 0;
    transform: rotate(45deg);
    transition: opacity ${({ theme }) => theme.transitions.slow},
                transform ${({ theme }) => theme.transitions.slow};
    z-index: -1;
  }

  &:hover::after {
    opacity: 1;
    transform: rotate(45deg) translate(10%, 10%);
  }
`;

// Section container
export const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

// Grid system
export const Grid = styled.div<{ columns?: number; gap?: keyof Theme['spacing'] }>`
  display: grid;
  grid-template-columns: repeat(${({ columns = 1 }) => columns}, 1fr);
  gap: ${({ theme, gap = 'l' }) => theme.spacing[gap]};

  @media (max-width: 1200px) {
    grid-template-columns: repeat(${({ columns = 1 }) => Math.min(columns, 3)}, 1fr);
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(${({ columns = 1 }) => Math.min(columns, 2)}, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

// Flex container
export const Flex = styled.div<{
  direction?: 'row' | 'column';
  justify?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  align?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  gap?: keyof Theme['spacing'];
  wrap?: boolean;
}>`
  display: flex;
  flex-direction: ${({ direction = 'row' }) => direction};
  justify-content: ${({ justify = 'flex-start' }) => justify};
  align-items: ${({ align = 'flex-start' }) => align};
  gap: ${({ theme, gap = 'm' }) => theme.spacing[gap]};
  flex-wrap: ${({ wrap = false }) => (wrap ? 'wrap' : 'nowrap')};
`;

// Button styles
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

const buttonVariants = {
  primary: css`
    background-color: ${({ theme }: { theme: Theme }) => theme.colors.primary};
    color: #000;
    border: none;

    &:hover:not(:disabled) {
      background-color: ${({ theme }: { theme: Theme }) => theme.colors.primaryLight};
    }

    &:active:not(:disabled) {
      background-color: ${({ theme }: { theme: Theme }) => theme.colors.primaryDark};
    }
  `,
  secondary: css`
    background-color: rgba(77, 254, 83, 0.15);
    color: ${({ theme }: { theme: Theme }) => theme.colors.primary};
    border: 1px solid ${({ theme }: { theme: Theme }) => theme.colors.primary};

    &:hover:not(:disabled) {
      background-color: rgba(77, 254, 83, 0.25);
    }

    &:active:not(:disabled) {
      background-color: rgba(77, 254, 83, 0.35);
    }
  `,
  ghost: css`
    background-color: transparent;
    color: ${({ theme }: { theme: Theme }) => theme.colors.text};
    border: 1px solid rgba(255, 255, 255, 0.1);

    &:hover:not(:disabled) {
      background-color: rgba(255, 255, 255, 0.05);
    }

    &:active:not(:disabled) {
      background-color: rgba(255, 255, 255, 0.1);
    }
  `,
  danger: css`
    background-color: ${({ theme }: { theme: Theme }) => theme.colors.error};
    color: white;
    border: none;

    &:hover:not(:disabled) {
      background-color: ${({ theme }: { theme: Theme }) => `${theme.colors.error}dd`};
    }

    &:active:not(:disabled) {
      background-color: ${({ theme }: { theme: Theme }) => `${theme.colors.error}bb`};
    }
  `,
};

const buttonSizes = {
  small: css`
    font-size: ${({ theme }: { theme: Theme }) => theme.fontSizes.small};
    padding: ${({ theme }: { theme: Theme }) => `${theme.spacing.xs} ${theme.spacing.m}`};
  `,
  medium: css`
    font-size: ${({ theme }: { theme: Theme }) => theme.fontSizes.regular};
    padding: ${({ theme }: { theme: Theme }) => `${theme.spacing.s} ${theme.spacing.l}`};
  `,
  large: css`
    font-size: ${({ theme }: { theme: Theme }) => theme.fontSizes.medium};
    padding: ${({ theme }: { theme: Theme }) => `${theme.spacing.m} ${theme.spacing.xl}`};
  `,
};

export const Button = styled.button<{
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.s};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};

  ${({ variant = 'primary' }) => buttonVariants[variant]}
  ${({ size = 'medium' }) => buttonSizes[size]}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

// Input element
export const Input = styled.input`
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.regular};
  padding: ${({ theme }) => `${theme.spacing.s} ${theme.spacing.m}`};
  width: 100%;
  transition: border-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(77, 254, 83, 0.2);
    outline: none;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

// Textarea element
export const TextArea = styled.textarea`
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.regular};
  padding: ${({ theme }) => `${theme.spacing.s} ${theme.spacing.m}`};
  min-height: 100px;
  width: 100%;
  resize: vertical;
  transition: border-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(77, 254, 83, 0.2);
    outline: none;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

// Select element
export const Select = styled.select`
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.regular};
  padding: ${({ theme }) => `${theme.spacing.s} ${theme.spacing.m}`};
  width: 100%;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23f5f5f5' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right ${({ theme }) => theme.spacing.m} center;
  transition: border-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(77, 254, 83, 0.2);
    outline: none;
  }

  option {
    background-color: ${({ theme }) => theme.colors.background};
  }
`;

// Form Group
export const FormGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.m};
`;

// Label
export const Label = styled.label`
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.text};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

// Helper Text
export const HelperText = styled.p<{ $error?: boolean }>`
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.fontSizes.small};
  color: ${({ theme, $error }) =>
    $error ? theme.colors.error : theme.colors.textMuted};
`;

// Badge
export const Badge = styled.span<{
  variant?: 'success' | 'error' | 'warning' | 'info' | 'default';
}>`
  display: inline-block;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.s}`};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: ${({ theme }) => theme.fontSizes.small};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  
  ${({ theme, variant = 'default' }) => {
    switch (variant) {
      case 'success':
        return css`
          background-color: rgba(77, 254, 83, 0.15);
          color: ${theme.colors.success};
        `;
      case 'error':
        return css`
          background-color: rgba(255, 107, 107, 0.15);
          color: ${theme.colors.error};
        `;
      case 'warning':
        return css`
          background-color: rgba(255, 209, 102, 0.15);
          color: ${theme.colors.warning};
        `;
      case 'info':
        return css`
          background-color: rgba(17, 138, 178, 0.15);
          color: ${theme.colors.info};
        `;
      default:
        return css`
          background-color: rgba(255, 255, 255, 0.1);
          color: ${theme.colors.text};
        `;
    }
  }}
`;

// Console-like component
export const Console = styled.pre`
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.small};
  line-height: 1.5;
  max-height: 400px;
  overflow: auto;
  padding: ${({ theme }) => theme.spacing.m};
  width: 100%;
`;

// Layout components
export const PageContainer = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.l};
  width: 100%;
`;

export const MainContent = styled.main`
  padding: ${({ theme }) => theme.spacing.l} 0;
`;

export const Header = styled.header`
  padding: ${({ theme }) => theme.spacing.m} 0;
  margin-bottom: ${({ theme }) => theme.spacing.l};
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

export const Heading = styled.h1`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.xxlarge};
  margin-bottom: ${({ theme }) => theme.spacing.s};
  font-weight: ${({ theme }) => theme.fontWeights.bold};

  span {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export const Subheading = styled.h2`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.medium};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  margin-bottom: ${({ theme }) => theme.spacing.l};
`;

// Separator
export const Separator = styled.hr`
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin: ${({ theme }) => theme.spacing.l} 0;
`;

// Tooltip styles
export const Tooltip = styled.div`
  position: relative;
  display: inline-block;

  &:hover::before,
  &:hover::after {
    display: block;
  }

  &::before {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.s}`};
    background-color: rgba(0, 0, 0, 0.8);
    color: ${({ theme }) => theme.colors.text};
    border-radius: ${({ theme }) => theme.borderRadius.small};
    font-size: ${({ theme }) => theme.fontSizes.small};
    white-space: nowrap;
    z-index: ${({ theme }) => theme.zIndices.tooltip};
    display: none;
    margin-bottom: ${({ theme }) => theme.spacing.xs};
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
    display: none;
    margin-bottom: -5px;
  }
`;

export const LinearProgress = styled.progress`
  width: 100%;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  
  /* Eliminar el borde y el fondo predeterminados en Firefox */
  border: none;
  background-color: rgba(255, 255, 255, 0.1);
  
  /* Estilo para el valor (la barra de progreso) */
  &::-webkit-progress-value {
    background-color: #4dfe53; /* Color principal */
    border-radius: 5px;
    transition: width 0.3s ease;
  }
  
  /* Estilo para la barra (el contenedor) en Chrome */
  &::-webkit-progress-bar {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
  }
  
  /* Estilo para Firefox */
  &::-moz-progress-bar {
    background-color: #4dfe53;
    border-radius: 5px;
    transition: width 0.3s ease;
  }
`;