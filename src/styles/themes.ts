import { BrightnessFilterToken, ColorToken, OpacityToken } from '@/constants/styles/base';
import type { Theme, ThemeColorBase } from '@/constants/styles/colors';

import { AppColorMode, AppTheme } from '@/state/appUiConfigs';

import { generateFadedColorVariant } from '@/lib/styles';
import { testFlags } from '@/lib/testFlags';

const ClassicThemeBase: (uiRefreshEnabled: boolean) => ThemeColorBase = (
  uiRefreshEnabled: boolean
) => ({
  black: ColorToken.Black,
  white: ColorToken.White,
  green: uiRefreshEnabled ? ColorToken.Green3 : ColorToken.Green2,
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

  gradientBase0: ColorToken.DarkGray10,
  gradientBase1: ColorToken.GrayBlue2,

  accent: ColorToken.Purple1,
  accentFaded: generateFadedColorVariant(ColorToken.Purple1, OpacityToken.Opacity16),
  favorite: ColorToken.Yellow0,

  success: uiRefreshEnabled ? ColorToken.Green3 : ColorToken.Green2,
  warning: ColorToken.Yellow0,
  error: ColorToken.Red2,
  successBackground: uiRefreshEnabled ? ColorToken.Green3 : ColorToken.Green2,
  successFaded: generateFadedColorVariant(
    uiRefreshEnabled ? ColorToken.Green3 : ColorToken.Green2,
    OpacityToken.Opacity16
  ),
  warningFaded: generateFadedColorVariant(ColorToken.Yellow0, OpacityToken.Opacity16),
  errorFaded: generateFadedColorVariant(ColorToken.Red2, OpacityToken.Opacity16),

  positive: uiRefreshEnabled ? ColorToken.Green3 : ColorToken.Green2,
  negative: ColorToken.Red2,
  positiveDark: ColorToken.Green6,
  negativeDark: ColorToken.Red4,
  positiveFaded: generateFadedColorVariant(
    uiRefreshEnabled ? ColorToken.Green3 : ColorToken.Green2,
    OpacityToken.Opacity16
  ),
  negativeFaded: generateFadedColorVariant(ColorToken.Red2, OpacityToken.Opacity16),

  riskLow: uiRefreshEnabled ? ColorToken.Green3 : ColorToken.Green2,
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

const DarkThemeBase: (uiRefreshEnabled: boolean) => ThemeColorBase = (
  uiRefreshEnabled: boolean
) => ({
  black: ColorToken.Black,
  white: ColorToken.White,
  green: ColorToken.Green1,
  red: ColorToken.Red0,

  whiteFaded: generateFadedColorVariant(ColorToken.White, OpacityToken.Opacity16),

  layer0: ColorToken.Black,
  layer1: uiRefreshEnabled ? ColorToken.DarkGray14 : ColorToken.DarkGray12,
  layer2: uiRefreshEnabled ? ColorToken.DarkGray11 : ColorToken.DarkGray15,
  layer3: uiRefreshEnabled ? ColorToken.DarkGray9 : ColorToken.DarkGray11,
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

const LightThemeBase: (uiRefreshEnabled: boolean) => ThemeColorBase = (
  uiRefreshEnabled: boolean
) => ({
  black: ColorToken.Black,
  white: ColorToken.White,
  green: uiRefreshEnabled ? ColorToken.Green5 : ColorToken.Green3,
  red: ColorToken.Red1,

  whiteFaded: generateFadedColorVariant(ColorToken.White, OpacityToken.Opacity16),

  layer0: uiRefreshEnabled ? ColorToken.LightGray7 : ColorToken.White,
  layer1: uiRefreshEnabled ? ColorToken.LightGray5 : ColorToken.LightGray7,
  layer2: ColorToken.White,
  layer3: ColorToken.LightGray1,
  layer4: ColorToken.White,
  layer5: ColorToken.LightGray4,
  layer6: ColorToken.LightGray10,
  layer7: ColorToken.MediumGray1,

  borderDefault: ColorToken.LightGray11,
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
  favorite: ColorToken.Yellow0,

  success: uiRefreshEnabled ? ColorToken.Green5 : ColorToken.Green3,
  successBackground: uiRefreshEnabled ? ColorToken.Green5 : ColorToken.Green3,
  warning: ColorToken.Yellow0,
  error: ColorToken.Red1,
  successFaded: generateFadedColorVariant(
    uiRefreshEnabled ? ColorToken.Green5 : ColorToken.Green3,
    OpacityToken.Opacity16
  ),
  warningFaded: generateFadedColorVariant(ColorToken.Yellow0, OpacityToken.Opacity16),
  errorFaded: generateFadedColorVariant(ColorToken.Red1, OpacityToken.Opacity16),

  positive: uiRefreshEnabled ? ColorToken.Green5 : ColorToken.Green3,
  negative: ColorToken.Red1,
  positiveDark: ColorToken.Green0,
  negativeDark: ColorToken.Red5,
  positiveFaded: generateFadedColorVariant(
    uiRefreshEnabled ? ColorToken.Green5 : ColorToken.Green3,
    OpacityToken.Opacity16
  ),
  negativeFaded: generateFadedColorVariant(ColorToken.Red1, OpacityToken.Opacity16),

  riskLow: uiRefreshEnabled ? ColorToken.Green5 : ColorToken.Green3,
  riskMedium: ColorToken.Yellow0,
  riskHigh: ColorToken.Red1,

  logoFill: ColorToken.Black,
  profileYellow: ColorToken.Yellow1,
  profileRed: ColorToken.Red2,

  inputBackground: ColorToken.White,
  popoverBackground: ColorToken.LightGray9,
  toggleBackground: ColorToken.LightGray4,
  tooltipBackground: ColorToken.LightGray8,

  hoverFilterBase: BrightnessFilterToken.Darken5,
  hoverFilterVariant: BrightnessFilterToken.Lighten10,
  activeFilter: BrightnessFilterToken.Darken10,
  overlayFilter: BrightnessFilterToken.Darken10,
});

const generateTheme = (themeBase: (uiRefreshEnabled: boolean) => ThemeColorBase): Theme => {
  const { uiRefresh } = testFlags;
  const themeColors = themeBase(uiRefresh);

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
