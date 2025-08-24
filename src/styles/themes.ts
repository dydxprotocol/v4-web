import { BrightnessFilterToken, ColorToken, OpacityToken } from '@/constants/styles/base';
import type { Theme, ThemeColorBase } from '@/constants/styles/colors';

import { AppColorMode, AppTheme } from '@/state/appUiConfigs';

import { generateFadedColorVariant } from '@/lib/styles';

const StarboardThemeBase: () => ThemeColorBase = () => ({
  black: ColorToken.Black,
  white: ColorToken.White,
  green: ColorToken.Green1,
  red: ColorToken.Red0,

  whiteFaded: generateFadedColorVariant(ColorToken.White, OpacityToken.Opacity16),

  layer0: ColorToken.DarkVoid,
  layer1: ColorToken.GluonGrey,
  layer2: ColorToken.SlateGrey,
  layer3: ColorToken.DarkGray9,
  layer4: ColorToken.DarkGray6,
  layer5: ColorToken.DarkGray5,
  layer6: ColorToken.DarkGray4,
  layer7: ColorToken.DarkGray2,

  borderDefault: ColorToken.DarkGray4,
  borderFaded: generateFadedColorVariant(ColorToken.DarkGray9, OpacityToken.Opacity50),
  borderDestructive: generateFadedColorVariant(ColorToken.Red0, OpacityToken.Opacity20),
  borderButton: generateFadedColorVariant(ColorToken.White, OpacityToken.Opacity20),

  textPrimary: ColorToken.Snow,
  textSecondary: ColorToken.Snow,
  textTertiary: ColorToken.DustyGrey,
  // textButton: ColorToken.LightGray0,
  textButton: ColorToken.Black,

  gradientBase0: ColorToken.DarkGray8,
  gradientBase1: ColorToken.DarkGray5,

  accent: ColorToken.Orange0,
  accentFaded: generateFadedColorVariant(ColorToken.Orange0, OpacityToken.Opacity16),
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
  [AppTheme.Classic]: generateTheme(StarboardThemeBase),
  [AppTheme.Dark]: generateTheme(StarboardThemeBase),
  [AppTheme.Light]: generateTheme(StarboardThemeBase),
  // [AppTheme.Classic]: generateTheme(ClassicThemeBase),
  // [AppTheme.Dark]: generateTheme(DarkThemeBase),
  // [AppTheme.Light]: generateTheme(LightThemeBase),
};
