import { darkTheme, FunkitConfig, lightTheme } from '@funkit/connect';

export const funkitConfig = {
  appName: 'dYdX',
  appLogoSrc: '/logos/dydx-x.png',
  appBackgroundColor: '#0F0F0F',
  loginConfig: {
    web2: true,
    web3: true,
  },
  apiKey: import.meta.env.VITE_FUNKIT_API_KEY,
} as FunkitConfig;

const ACCENT_COLOR = 'var(--color-accent)';
const ACCENT_COLOR_WASH = 'rgb(114,122,255)'; // dydx uses brightness
const OFF_BACKGROUND_DARK = 'var(--color-layer-4)';
const OFF_BACKGROUND_LIGHT = 'var(--color-layer-1)';

const defaultCustomColors = {
  primaryText: 'var(--color-text-2)',
  secondaryText: 'var(--color-text-1)',
  tertiaryText: 'var(--color-text-0)',
  modalBackground: 'var(--color-layer-3)',
  buttonBackground: ACCENT_COLOR,
  buttonText: 'var(--color-text-button)',
  buttonBackgroundHover: ACCENT_COLOR_WASH,
  dydxSwitchActiveBackground: 'var(--color-layer-2)',
  buttonTextDisabled: 'var(--color-text-0)',
};

export const funkitTheme = {
  darkMode: darkTheme({
    customFontFamily: 'inherit',
    accentColor: ACCENT_COLOR,
    customColors: {
      ...defaultCustomColors,
      buttonBackgroundDisabled: OFF_BACKGROUND_DARK,
      inputBackground: OFF_BACKGROUND_DARK,
      offBackground: OFF_BACKGROUND_DARK,
    },
  }),
  lightMode: lightTheme({
    customFontFamily: 'inherit',
    accentColor: ACCENT_COLOR,
    customColors: {
      ...defaultCustomColors,
      buttonBackgroundDisabled: OFF_BACKGROUND_LIGHT,
      offBackground: OFF_BACKGROUND_LIGHT,
      inputBackground: OFF_BACKGROUND_LIGHT,
    },
  }),
};
