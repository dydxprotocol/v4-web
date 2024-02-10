import { ThemeColorBase } from '@/constants/styles/colors';

declare module 'styled-components' {
  export interface DefaultTheme extends ThemeColorBase {}
}
