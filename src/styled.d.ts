import 'styled-components';
import { Theme } from './styles/GlobalStyles';

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
} 