import { AppColorMode } from '@/state/configs';

export type Theme = {
  [AppColorMode.GreenUp]: ThemeColorBase;
  [AppColorMode.RedUp]: ThemeColorBase;
};

export type ThemeColorBase = LayerColors &
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
  favorite: string;
};

type StatusColors = {
  success: string;
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
  positiveFaded: string;
  negativeFaded: string;
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
  switchThumbActiveBackground: string;
  toggleBackground: string;
  tooltipBackground: string;
};

type Filters = {
  hoverFilterBase: string;
  hoverFilterVariant: string;
  activeFilter: string;
};
