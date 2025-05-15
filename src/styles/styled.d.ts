import { ThemeColorBase } from '@/constants/styles/colors';

declare module 'styled-components' {
  export interface DefaultTheme extends ThemeColorBase {}
}

declare module 'react' {
  interface CSSProperties extends Record<`--${string}`, string | number> {}
}
