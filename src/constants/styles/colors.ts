export type ThemeColors = LayerColors &
  BorderColors &
  TextColors &
  AccentColors &
  StatusColors &
  DirectionalColors &
  RiskColors &
  ComponentColors;

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
};

type AccentColors = {
  accent: string;
  favorite: string;
};

type StatusColors = {
  success: string;
  warning: string;
  error: string;
};

type DirectionalColors = {
  positive: string;
  negative: string;
};

type RiskColors = {
  riskLow: string;
  riskMedium: string;
  riskHigh: string;
};

type ComponentColors = {
  toggleBackground: string;
  inputBackground: string;
  logoFill: string;
};
