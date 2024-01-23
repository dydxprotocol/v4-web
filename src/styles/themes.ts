import { AppTheme } from '@/state/configs';
import { ThemeColors } from '@/constants/styles/colors';
import { ColorToken } from '@/constants/styles/base';

const ClassicTheme: ThemeColors = {
  layer0: ColorToken.GrayBlue7,
  layer1: ColorToken.GrayBlue6,
  layer2: ColorToken.GrayBlue5,
  layer3: ColorToken.GrayBlue4,
  layer4: ColorToken.GrayBlue3,
  layer5: ColorToken.GrayBlue2,
  layer6: ColorToken.GrayBlue1,
  layer7: ColorToken.GrayBlue0,

  borderDefault: ColorToken.GrayBlue2,
  borderDestructive: ColorToken.Red2,
  borderButton: ColorToken.White,

  textPrimary: ColorToken.LightGray2,
  textSecondary: ColorToken.GrayPurple1,
  textTertiary: ColorToken.GrayPurple2,

  accent: ColorToken.Purple1,
  favorite: ColorToken.Yellow0,

  success: ColorToken.Green1,
  warning: ColorToken.Yellow0,
  error: ColorToken.Red2,

  positive: ColorToken.Green1,
  negative: ColorToken.Red2,

  riskLow: ColorToken.Green1,
  riskMedium: ColorToken.Yellow0,
  riskHigh: ColorToken.Red2,

  inputBackground: ColorToken.GrayBlue3,
  toggleBackground: ColorToken.GrayBlue3,
  logoFill: ColorToken.White,
};

const DarkTheme: ThemeColors = {
  layer0: ColorToken.Black,
  layer1: ColorToken.DarkGray11,
  layer2: ColorToken.DarkGray13,
  layer3: ColorToken.DarkGray10,
  layer4: ColorToken.DarkGray6,
  layer5: ColorToken.DarkGray5,
  layer6: ColorToken.DarkGray4,
  layer7: ColorToken.DarkGray2,

  borderDefault: ColorToken.DarkGray4,
  borderDestructive: ColorToken.Red0,
  borderButton: ColorToken.White,

  textPrimary: ColorToken.LightGray0,
  textSecondary: ColorToken.MediumGray0,
  textTertiary: ColorToken.DarkGray0,

  accent: ColorToken.Purple0,
  favorite: ColorToken.Yellow0,

  success: ColorToken.Green0,
  warning: ColorToken.Yellow0,
  error: ColorToken.Red0,

  positive: ColorToken.Green0,
  negative: ColorToken.Red0,

  riskLow: ColorToken.Green0,
  riskMedium: ColorToken.Yellow0,
  riskHigh: ColorToken.Red0,

  inputBackground: ColorToken.DarkGray6,
  toggleBackground: ColorToken.DarkGray6,
  logoFill: ColorToken.White,
};

const LightTheme: ThemeColors = {
  layer0: ColorToken.White,
  layer1: ColorToken.LightGray6,
  layer2: ColorToken.White,
  layer3: ColorToken.LightGray1,
  layer4: ColorToken.White,
  layer5: ColorToken.LightGray4,
  layer6: ColorToken.LightGray9,
  layer7: ColorToken.MediumGray1,

  borderDefault: ColorToken.LightGray10,
  borderDestructive: ColorToken.Red1,
  borderButton: ColorToken.Black,

  textPrimary: ColorToken.DarkGray12,
  textSecondary: ColorToken.DarkGray3,
  textTertiary: ColorToken.DarkGray1,

  accent: ColorToken.Purple0,
  favorite: ColorToken.Yellow0,

  success: ColorToken.Green2,
  warning: ColorToken.Yellow0,
  error: ColorToken.Red1,

  positive: ColorToken.Green2,
  negative: ColorToken.Red1,

  riskLow: ColorToken.Green2,
  riskMedium: ColorToken.Yellow0,
  riskHigh: ColorToken.Red1,

  inputBackground: ColorToken.White,
  toggleBackground: ColorToken.LightGray4,
  logoFill: ColorToken.Black,
};

export const Themes = {
  [AppTheme.Classic]: ClassicTheme,
  [AppTheme.Dark]: DarkTheme,
  [AppTheme.Light]: LightTheme,
};
