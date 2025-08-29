import { BrightnessFilterToken, ColorToken, OpacityToken } from '@/constants/styles/base';
import type { Theme, ThemeColorBase } from '@/constants/styles/colors';

import { AppColorMode, AppTheme } from '@/state/appUiConfigs';

import { generateFadedColorVariant } from '@/lib/styles';

const ClassicThemeBase: () => ThemeColorBase = () => ({
  black: ColorToken.Black,
  white: ColorToken.White,
  green: ColorToken.Green3,
  red: ColorToken.Red2,

  redFaded: generateFadedColorVariant(ColorToken.Red2, OpacityToken.Opacity16),
  greenFaded: generateFadedColorVariant(ColorToken.Green3, OpacityToken.Opacity16),
  whiteFaded: generateFadedColorVariant(ColorToken.White, OpacityToken.Opacity16),

  layer0: ColorToken.GrayBlue7,
  layer1: ColorToken.GrayBlue6,
  layer2: ColorToken.GrayBlue5,
  layer3: ColorToken.GrayBlue4,
  layer4: ColorToken.GrayBlue3,
  layer5: ColorToken.GrayBlue2,
  layer6: ColorToken.GrayBlue1,
  layer7: ColorToken.GrayBlue0,

  borderDefault: ColorToken.GrayBlue2,
  borderFaded: generateFadedColorVariant(ColorToken.GrayBlue4, OpacityToken.Opacity50),
  borderDestructive: generateFadedColorVariant(ColorToken.Red2, OpacityToken.Opacity20),
  borderButton: generateFadedColorVariant(ColorToken.White, OpacityToken.Opacity20),

  textPrimary: ColorToken.LightGray2,
  textSecondary: ColorToken.GrayPurple1,
  textTertiary: ColorToken.GrayPurple2,
  textButton: ColorToken.LightGray2,

  gradientBase0: ColorToken.DarkGray10,
  gradientBase1: ColorToken.GrayBlue2,

  accent: ColorToken.Purple1,
  accentFaded: generateFadedColorVariant(ColorToken.Purple1, OpacityToken.Opacity16),
  accentMoreFaded: generateFadedColorVariant(ColorToken.Purple1, OpacityToken.Opacity8),
  favorite: ColorToken.Yellow0,

  success: ColorToken.Green3,
  warning: ColorToken.Yellow0,
  error: ColorToken.Red2,
  successBackground: ColorToken.Green3,
  successFaded: generateFadedColorVariant(ColorToken.Green3, OpacityToken.Opacity16),
  warningFaded: generateFadedColorVariant(ColorToken.Yellow0, OpacityToken.Opacity16),
  errorFaded: generateFadedColorVariant(ColorToken.Red2, OpacityToken.Opacity16),

  positive: ColorToken.Green3,
  negative: ColorToken.Red2,
  positiveDark: ColorToken.Green6,
  negativeDark: ColorToken.Red4,
  positive20: generateFadedColorVariant(ColorToken.Green3, OpacityToken.Opacity20),
  negative20: generateFadedColorVariant(ColorToken.Red2, OpacityToken.Opacity20),
  positive50: generateFadedColorVariant(ColorToken.Green3, OpacityToken.Opacity50),
  negative50: generateFadedColorVariant(ColorToken.Red2, OpacityToken.Opacity50),
  positiveFaded: generateFadedColorVariant(ColorToken.Green3, OpacityToken.Opacity16),
  negativeFaded: generateFadedColorVariant(ColorToken.Red2, OpacityToken.Opacity16),

  riskLow: ColorToken.Green3,
  riskMedium: ColorToken.Yellow0,
  riskHigh: ColorToken.Red2,

  logoFill: ColorToken.White,
  profileYellow: ColorToken.Yellow1,
  profileRed: ColorToken.Red2,

  inputBackground: ColorToken.GrayBlue3,
  popoverBackground: ColorToken.GrayBlue4,
  toggleBackground: ColorToken.GrayBlue3,
  tooltipBackground: ColorToken.GrayBlue3,

  hoverFilterBase: BrightnessFilterToken.Lighten10,
  hoverFilterVariant: BrightnessFilterToken.Lighten10,
  activeFilter: BrightnessFilterToken.Darken10,
  overlayFilter: BrightnessFilterToken.Darken30,
});

const DarkThemeBase: () => ThemeColorBase = () => ({
  black: ColorToken.Black,
  white: ColorToken.White,
  green: ColorToken.Green1,
  red: ColorToken.Red0,

  redFaded: generateFadedColorVariant(ColorToken.Red0, OpacityToken.Opacity16),
  greenFaded: generateFadedColorVariant(ColorToken.Green1, OpacityToken.Opacity16),
  whiteFaded: generateFadedColorVariant(ColorToken.White, OpacityToken.Opacity16),

  layer0: ColorToken.Black,
  layer1: ColorToken.DarkGray14,
  layer2: ColorToken.DarkGray11,
  layer3: ColorToken.DarkGray9,
  layer4: ColorToken.DarkGray6,
  layer5: ColorToken.DarkGray5,
  layer6: ColorToken.DarkGray4,
  layer7: ColorToken.DarkGray2,

  borderDefault: ColorToken.DarkGray4,
  borderFaded: generateFadedColorVariant(ColorToken.DarkGray9, OpacityToken.Opacity50),
  borderDestructive: generateFadedColorVariant(ColorToken.Red0, OpacityToken.Opacity20),
  borderButton: generateFadedColorVariant(ColorToken.White, OpacityToken.Opacity20),

  textPrimary: ColorToken.LightGray0,
  textSecondary: ColorToken.MediumGray0,
  textTertiary: ColorToken.DarkGray0,
  textButton: ColorToken.LightGray0,

  gradientBase0: ColorToken.DarkGray8,
  gradientBase1: ColorToken.DarkGray5,

  accent: ColorToken.Purple0,
  accentFaded: generateFadedColorVariant(ColorToken.Purple0, OpacityToken.Opacity16),
  accentMoreFaded: generateFadedColorVariant(ColorToken.Purple0, OpacityToken.Opacity8),
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

  inputBackground: ColorToken.DarkGray6,
  popoverBackground: ColorToken.DarkGray8,
  toggleBackground: ColorToken.DarkGray6,
  tooltipBackground: ColorToken.DarkGray6,

  hoverFilterBase: BrightnessFilterToken.Lighten10,
  hoverFilterVariant: BrightnessFilterToken.Lighten10,
  activeFilter: BrightnessFilterToken.Darken10,
  overlayFilter: BrightnessFilterToken.Darken30,
});

const LightThemeBase: () => ThemeColorBase = () => ({
  black: ColorToken.Black,
  white: ColorToken.White,
  green: ColorToken.Green5,
  red: ColorToken.Red1,

  redFaded: generateFadedColorVariant(ColorToken.Red1, OpacityToken.Opacity16),
  greenFaded: generateFadedColorVariant(ColorToken.Green5, OpacityToken.Opacity16),
  whiteFaded: generateFadedColorVariant(ColorToken.White, OpacityToken.Opacity16),

  layer0: ColorToken.LightGray7,
  layer1: ColorToken.LightGray5,
  layer2: ColorToken.White,
  layer3: ColorToken.LightGray1,
  layer4: ColorToken.LightGray3,
  layer5: ColorToken.LightGray4,
  layer6: ColorToken.LightGray10,
  layer7: ColorToken.MediumGray1,

  borderDefault: ColorToken.LightGray11,
  borderFaded: generateFadedColorVariant(ColorToken.LightGray1, OpacityToken.Opacity50),
  borderDestructive: generateFadedColorVariant(ColorToken.Red1, OpacityToken.Opacity20),
  borderButton: generateFadedColorVariant(ColorToken.Black, OpacityToken.Opacity20),

  textPrimary: ColorToken.DarkGray13,
  textSecondary: ColorToken.DarkGray3,
  textTertiary: ColorToken.DarkGray1,
  textButton: ColorToken.White,

  gradientBase0: ColorToken.LightGray9,
  gradientBase1: ColorToken.LightGray6,

  accent: ColorToken.Purple0,
  accentFaded: generateFadedColorVariant(ColorToken.Purple0, OpacityToken.Opacity16),
  accentMoreFaded: generateFadedColorVariant(ColorToken.Purple0, OpacityToken.Opacity8),
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
  activeFilter: BrightnessFilterToken.Darken10,
  overlayFilter: BrightnessFilterToken.Darken10,
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
  [AppTheme.Classic]: generateTheme(ClassicThemeBase),
  [AppTheme.Dark]: generateTheme(DarkThemeBase),
  [AppTheme.Light]: generateTheme(LightThemeBase),
};
