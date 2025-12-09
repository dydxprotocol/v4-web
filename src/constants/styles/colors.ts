import type { ThemeName } from 'public/tradingview/charting_library';

import { AppColorMode, AppTheme } from '@/state/appUiConfigs';

export const THEME_NAMES: Record<AppTheme, ThemeName> = {
  [AppTheme.Classic]: 'Classic',
  [AppTheme.Dark]: 'Dark',
  [AppTheme.Light]: 'Light',
};

export type Theme = {
  [AppColorMode.GreenUp]: ThemeColorBase;
  [AppColorMode.RedUp]: ThemeColorBase;
};

export type ThemeColorBase = BaseColors &
  LayerColors &
  BorderColors &
  TextColors &
  GradientColors &
  AccentColors &
  StatusColors &
  DirectionalColors &
  RiskColors &
  IconColors &
  ComponentColors &
  Filters;

type BaseColors = {
  black: string;
  white: string;
  green: string;
  red: string;

  redFaded: string;
  greenFaded: string;
  whiteFaded: string;
};

type LayerColors = {
  layer0: string;
  layer1: string;
  layer2: string;
  layer3: string;
  layer4: string;
  layer5: string;
  layer6: string;
  layer7: string;
};

type BorderColors = {
  borderDefault: string;
  borderDestructive: string;
  borderButton: string;
  borderFaded: string;
};

type TextColors = {
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;

  textButton: string;
};

type GradientColors = {
  gradientBase0: string;
  gradientBase1: string;
};

type AccentColors = {
  accent: string;
  accentFaded: string;
  accentMoreFaded: string;
  favorite: string;
};

type StatusColors = {
  success: string;
  successBackground: string;
  warning: string;
  error: string;
  successFaded: string;
  warningFaded: string;
  errorFaded: string;
};

/** ##InvertDirectionalColors
 * When adding colors here, make sure to update linked function to invert colors for AppColorMode. */
type DirectionalColors = {
  positive: string;
  negative: string;
  positiveDark: string;
  negativeDark: string;
  positiveFaded: string;
  negativeFaded: string;
  positive20: string;
  negative20: string;
  positive50: string;
  negative50: string;
};

type RiskColors = {
  riskLow: string;
  riskMedium: string;
  riskHigh: string;
};

type IconColors = {
  logoFill: string;
  profileYellow: string;
  profileRed: string;
};

type ComponentColors = {
  inputBackground: string;
  popoverBackground: string;
  toggleBackground: string;
  tooltipBackground: string;
};

type Filters = {
  hoverFilterBase: string;
  hoverFilterVariant: string;
  activeFilter: string;
  overlayFilter: string;
};
