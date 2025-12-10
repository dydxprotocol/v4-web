import { BrightnessFilterToken, ColorToken, OpacityToken } from '@/constants/styles/base';
import type { Theme, ThemeColorBase } from '@/constants/styles/colors';

import { AppColorMode, AppTheme } from '@/state/appUiConfigs';

import { generateFadedColorVariant } from '@/lib/styles';

const DarkThemeBase: () => ThemeColorBase = () => ({
  black: ColorToken.Black,
  white: ColorToken.White,
  green: ColorToken.Green1,
  red: ColorToken.Red0,

  whiteFaded: generateFadedColorVariant(ColorToken.White, OpacityToken.Opacity16),

  baseLayer: ColorToken.BONKPurple,
  layer0: ColorToken.BONKPurple1,
  layer1: ColorToken.BONKPurple,
  layer2: ColorToken.BONKPurple,
  layer3: ColorToken.BONKPurple,
  layer4: ColorToken.BONKPurple,
  layer5: ColorToken.BONKPurple,
  layer6: ColorToken.BONKPurple,
  layer7: ColorToken.BONKPurple2,

  borderDefault: 'transparent',
  borderFaded: generateFadedColorVariant(ColorToken.DarkGray14, OpacityToken.Opacity50),
  borderDestructive: generateFadedColorVariant(ColorToken.Red2, OpacityToken.Opacity20),
  borderButton: generateFadedColorVariant(ColorToken.White, OpacityToken.Opacity20), // maybe accent orange?

  textPrimary: ColorToken.White,
  textSecondary: ColorToken.MediumGray0,
  textTertiary: ColorToken.DarkGray0,
  textButton: ColorToken.Black, // maybe White?

  gradientBase0: ColorToken.DarkGray8, // maybe Yellow1?
  gradientBase1: ColorToken.DarkGray5, // maybe Orange0?

  accent: ColorToken.Orange0,
  accentFaded: generateFadedColorVariant(ColorToken.Orange0, OpacityToken.Opacity16),
  accentMoreFaded: generateFadedColorVariant(ColorToken.Orange0, OpacityToken.Opacity8),
  favorite: ColorToken.Yellow0,

  success: ColorToken.Green1,
  successBackground: ColorToken.Green4,
  warning: ColorToken.Yellow0,
  error: ColorToken.Red0,
  successFaded: generateFadedColorVariant(ColorToken.Green1, OpacityToken.Opacity16),
  warningFaded: generateFadedColorVariant(ColorToken.Yellow0, OpacityToken.Opacity16),
  errorFaded: generateFadedColorVariant(ColorToken.Red0, OpacityToken.Opacity16),

  positive: ColorToken.Green1,
  negative: ColorToken.Red0,
  positiveDark: ColorToken.Green6,
  negativeDark: ColorToken.Red3,
  positive20: generateFadedColorVariant(ColorToken.Green1, OpacityToken.Opacity20),
  negative20: generateFadedColorVariant(ColorToken.Red0, OpacityToken.Opacity20),
  positive50: generateFadedColorVariant(ColorToken.Green1, OpacityToken.Opacity50),
  negative50: generateFadedColorVariant(ColorToken.Red0, OpacityToken.Opacity50),
  positiveFaded: generateFadedColorVariant(ColorToken.Green1, OpacityToken.Opacity16),
  negativeFaded: generateFadedColorVariant(ColorToken.Red0, OpacityToken.Opacity16),

  riskLow: ColorToken.Green1,
  riskMedium: ColorToken.Yellow0,
  riskHigh: ColorToken.Red0,

  logoFill: ColorToken.White,
  profileYellow: ColorToken.Yellow1,
  profileRed: ColorToken.Red2,

  inputBackground: ColorToken.BONKPurple1,
  popoverBackground: ColorToken.DarkGray8,
  toggleBackground: ColorToken.DarkGray6,
  tooltipBackground: ColorToken.DarkGray6,

  hoverFilterBase: BrightnessFilterToken.Lighten10,
  hoverFilterVariant: BrightnessFilterToken.Darken10,
  activeFilter: BrightnessFilterToken.Darken5,
  overlayFilter: BrightnessFilterToken.Darken50,
});

const LightThemeBase: () => ThemeColorBase = () => ({
  black: ColorToken.Black,
  white: ColorToken.White,
  green: ColorToken.Green5,
  red: ColorToken.Red1,

  whiteFaded: generateFadedColorVariant(ColorToken.White, OpacityToken.Opacity16),

  baseLayer: '#FF5A0220',
  layer0: ColorToken.White,
  layer1: ColorToken.White,
  layer2: ColorToken.White,
  layer3: ColorToken.White,
  layer4: ColorToken.White,
  layer5: ColorToken.White,
  layer6: ColorToken.White,
  layer7: ColorToken.White,

  borderDefault: 'transparent',
  borderFaded: generateFadedColorVariant(ColorToken.LightGray1, OpacityToken.Opacity50),
  borderDestructive: generateFadedColorVariant(ColorToken.Red1, OpacityToken.Opacity20),
  borderButton: generateFadedColorVariant(ColorToken.Black, OpacityToken.Opacity20),

  textPrimary: ColorToken.DarkGray15,
  textSecondary: ColorToken.DarkGray6,
  textTertiary: ColorToken.DarkGray1,
  textButton: ColorToken.White,

  gradientBase0: ColorToken.LightGray7,
  gradientBase1: ColorToken.LightGray5,

  accent: ColorToken.Orange0,
  accentFaded: generateFadedColorVariant(ColorToken.Orange0, OpacityToken.Opacity16),
  accentMoreFaded: generateFadedColorVariant(ColorToken.Orange0, OpacityToken.Opacity8),
  favorite: ColorToken.Yellow0,

  success: ColorToken.Green5,
  successBackground: ColorToken.Green5,
  warning: ColorToken.Yellow0,
  error: ColorToken.Red1,
  successFaded: generateFadedColorVariant(ColorToken.Green5, OpacityToken.Opacity16),
  warningFaded: generateFadedColorVariant(ColorToken.Yellow0, OpacityToken.Opacity16),
  errorFaded: generateFadedColorVariant(ColorToken.Red1, OpacityToken.Opacity16),

  positive: ColorToken.Green5,
  negative: ColorToken.Red1,
  positiveDark: ColorToken.Green0,
  negativeDark: ColorToken.Red5,
  positive20: generateFadedColorVariant(ColorToken.Green5, OpacityToken.Opacity20),
  negative20: generateFadedColorVariant(ColorToken.Red1, OpacityToken.Opacity20),
  positive50: generateFadedColorVariant(ColorToken.Green5, OpacityToken.Opacity50),
  negative50: generateFadedColorVariant(ColorToken.Red1, OpacityToken.Opacity50),
  positiveFaded: generateFadedColorVariant(ColorToken.Green5, OpacityToken.Opacity16),
  negativeFaded: generateFadedColorVariant(ColorToken.Red1, OpacityToken.Opacity16),

  riskLow: ColorToken.Green5,
  riskMedium: ColorToken.Yellow0,
  riskHigh: ColorToken.Red1,

  logoFill: ColorToken.Black,
  profileYellow: ColorToken.Yellow1,
  profileRed: ColorToken.Red2,

  inputBackground: ColorToken.LightGray3,
  popoverBackground: ColorToken.LightGray9,
  toggleBackground: ColorToken.LightGray4,
  tooltipBackground: ColorToken.LightGray8,

  hoverFilterBase: BrightnessFilterToken.Darken5,
  hoverFilterVariant: BrightnessFilterToken.Lighten10,
  activeFilter: BrightnessFilterToken.Darken5,
  overlayFilter: BrightnessFilterToken.Darken50,
});

const generateTheme = (themeBase: () => ThemeColorBase): Theme => {
  const themeColors = themeBase();

  return {
    [AppColorMode.GreenUp]: themeColors,
    [AppColorMode.RedUp]: {
      ...themeColors,
      // #InvertDirectionalColors
      positive: themeColors.negative,
      negative: themeColors.positive,
      positiveDark: themeColors.negativeDark,
      negativeDark: themeColors.positiveDark,
      positiveFaded: themeColors.negativeFaded,
      negativeFaded: themeColors.positiveFaded,
    },
  };
};

export const Themes = {
  [AppTheme.Dark]: generateTheme(DarkThemeBase),
  [AppTheme.Light]: generateTheme(LightThemeBase),
};
