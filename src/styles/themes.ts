import { BrightnessFilterToken, ColorToken, OpacityToken } from '@/constants/styles/base';
import type { Theme, ThemeColorBase } from '@/constants/styles/colors';

import { AppColorMode, AppTheme } from '@/state/configs';

import { generateFadedColorVariant } from '@/lib/styles';

const ClassicThemeBase: ThemeColorBase = {
  black: ColorToken.Black,
  white: ColorToken.White,
  green: ColorToken.Green1,
  red: ColorToken.Red2,

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
  borderDestructive: generateFadedColorVariant(ColorToken.Red2, OpacityToken.Opacity20),
  borderButton: generateFadedColorVariant(ColorToken.White, OpacityToken.Opacity20),

  textPrimary: ColorToken.LightGray2,
  textSecondary: ColorToken.GrayPurple1,
  textTertiary: ColorToken.GrayPurple2,
  textButton: ColorToken.LightGray2,

  gradientBase0: ColorToken.DarkGray9,
  gradientBase1: ColorToken.GrayBlue2,

  accent: ColorToken.Purple1,
  accentFaded: generateFadedColorVariant(ColorToken.Purple1, OpacityToken.Opacity16),
  favorite: ColorToken.Yellow0,

  success: ColorToken.Green1,
  warning: ColorToken.Yellow0,
  error: ColorToken.Red2,
  successFaded: generateFadedColorVariant(ColorToken.Green1, OpacityToken.Opacity16),
  warningFaded: generateFadedColorVariant(ColorToken.Yellow0, OpacityToken.Opacity16),
  errorFaded: generateFadedColorVariant(ColorToken.Red2, OpacityToken.Opacity16),

  positive: ColorToken.Green1,
  negative: ColorToken.Red2,
  positiveFaded: generateFadedColorVariant(ColorToken.Green1, OpacityToken.Opacity16),
  negativeFaded: generateFadedColorVariant(ColorToken.Red2, OpacityToken.Opacity16),

  riskLow: ColorToken.Green1,
  riskMedium: ColorToken.Yellow0,
  riskHigh: ColorToken.Red2,

  logoFill: ColorToken.White,
  profileYellow: ColorToken.Yellow1,
  profileRed: ColorToken.Red2,

  inputBackground: ColorToken.GrayBlue3,
  popoverBackground: generateFadedColorVariant(ColorToken.GrayBlue4, OpacityToken.Opacity90),
  toggleBackground: ColorToken.GrayBlue3,
  tooltipBackground: generateFadedColorVariant(ColorToken.GrayBlue3, OpacityToken.Opacity66),

  hoverFilterBase: BrightnessFilterToken.Lighten10,
  hoverFilterVariant: BrightnessFilterToken.Lighten10,
  activeFilter: BrightnessFilterToken.Darken10,
};

const DarkThemeBase: ThemeColorBase = {
  black: ColorToken.Black,
  white: ColorToken.White,
  green: ColorToken.Green0,
  red: ColorToken.Red0,

  whiteFaded: generateFadedColorVariant(ColorToken.White, OpacityToken.Opacity16),

  layer0: ColorToken.Black,
  layer1: ColorToken.DarkGray11,
  layer2: ColorToken.DarkGray13,
  layer3: ColorToken.DarkGray10,
  layer4: ColorToken.DarkGray6,
  layer5: ColorToken.DarkGray5,
  layer6: ColorToken.DarkGray4,
  layer7: ColorToken.DarkGray2,

  borderDefault: ColorToken.DarkGray4,
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
  favorite: ColorToken.Yellow0,

  success: ColorToken.Green0,
  warning: ColorToken.Yellow0,
  error: ColorToken.Red0,
  successFaded: generateFadedColorVariant(ColorToken.Green0, OpacityToken.Opacity16),
  warningFaded: generateFadedColorVariant(ColorToken.Yellow0, OpacityToken.Opacity16),
  errorFaded: generateFadedColorVariant(ColorToken.Red0, OpacityToken.Opacity16),

  positive: ColorToken.Green0,
  negative: ColorToken.Red0,
  positiveFaded: generateFadedColorVariant(ColorToken.Green0, OpacityToken.Opacity16),
  negativeFaded: generateFadedColorVariant(ColorToken.Red0, OpacityToken.Opacity16),

  riskLow: ColorToken.Green0,
  riskMedium: ColorToken.Yellow0,
  riskHigh: ColorToken.Red0,

  logoFill: ColorToken.White,
  profileYellow: ColorToken.Yellow1,
  profileRed: ColorToken.Red2,

  inputBackground: ColorToken.DarkGray6,
  popoverBackground: generateFadedColorVariant(ColorToken.DarkGray8, OpacityToken.Opacity90),
  toggleBackground: ColorToken.DarkGray6,
  tooltipBackground: generateFadedColorVariant(ColorToken.DarkGray6, OpacityToken.Opacity66),

  hoverFilterBase: BrightnessFilterToken.Lighten10,
  hoverFilterVariant: BrightnessFilterToken.Lighten10,
  activeFilter: BrightnessFilterToken.Darken10,
};

const LightThemeBase: ThemeColorBase = {
  black: ColorToken.Black,
  white: ColorToken.White,
  green: ColorToken.Green2,
  red: ColorToken.Red1,

  whiteFaded: generateFadedColorVariant(ColorToken.White, OpacityToken.Opacity16),

  layer0: ColorToken.White,
  layer1: ColorToken.LightGray6,
  layer2: ColorToken.White,
  layer3: ColorToken.LightGray1,
  layer4: ColorToken.White,
  layer5: ColorToken.LightGray4,
  layer6: ColorToken.LightGray9,
  layer7: ColorToken.MediumGray1,

  borderDefault: ColorToken.LightGray10,
  borderDestructive: generateFadedColorVariant(ColorToken.Red1, OpacityToken.Opacity20),
  borderButton: generateFadedColorVariant(ColorToken.Black, OpacityToken.Opacity20),

  textPrimary: ColorToken.DarkGray12,
  textSecondary: ColorToken.DarkGray3,
  textTertiary: ColorToken.DarkGray1,
  textButton: ColorToken.White,

  gradientBase0: ColorToken.LightGray8,
  gradientBase1: ColorToken.LightGray5,

  accent: ColorToken.Purple0,
  accentFaded: generateFadedColorVariant(ColorToken.Purple0, OpacityToken.Opacity16),
  favorite: ColorToken.Yellow0,

  success: ColorToken.Green2,
  warning: ColorToken.Yellow0,
  error: ColorToken.Red1,
  successFaded: generateFadedColorVariant(ColorToken.Green2, OpacityToken.Opacity16),
  warningFaded: generateFadedColorVariant(ColorToken.Yellow0, OpacityToken.Opacity16),
  errorFaded: generateFadedColorVariant(ColorToken.Red1, OpacityToken.Opacity16),

  positive: ColorToken.Green2,
  negative: ColorToken.Red1,
  positiveFaded: generateFadedColorVariant(ColorToken.Green2, OpacityToken.Opacity16),
  negativeFaded: generateFadedColorVariant(ColorToken.Red1, OpacityToken.Opacity16),

  riskLow: ColorToken.Green2,
  riskMedium: ColorToken.Yellow0,
  riskHigh: ColorToken.Red1,

  logoFill: ColorToken.Black,
  profileYellow: ColorToken.Yellow1,
  profileRed: ColorToken.Red2,

  inputBackground: ColorToken.White,
  popoverBackground: generateFadedColorVariant(ColorToken.LightGray8, OpacityToken.Opacity90),
  toggleBackground: ColorToken.LightGray4,
  tooltipBackground: generateFadedColorVariant(ColorToken.LightGray7, OpacityToken.Opacity66),

  hoverFilterBase: BrightnessFilterToken.Darken5,
  hoverFilterVariant: BrightnessFilterToken.Lighten10,
  activeFilter: BrightnessFilterToken.Darken10,
};

const generateTheme = (themeBase: ThemeColorBase): Theme => {
  return {
    [AppColorMode.GreenUp]: themeBase,
    [AppColorMode.RedUp]: {
      ...themeBase,
      // #InvertDirectionalColors
      positive: themeBase.negative,
      negative: themeBase.positive,
      positiveFaded: themeBase.negativeFaded,
      negativeFaded: themeBase.positiveFaded,
    },
  };
};

export const Themes = {
  [AppTheme.Classic]: generateTheme(ClassicThemeBase),
  [AppTheme.Dark]: generateTheme(DarkThemeBase),
  [AppTheme.Light]: generateTheme(LightThemeBase),
};
