import { css } from 'styled-components';

import { type RiskLevels } from '@/constants/abacus';

import { AppTheme } from '@/state/configs';

const BaseElements = {
  [AppTheme.Classic]: {
    hue: 240,
    saturation: 20,
    lightness: 16,
  },
  [AppTheme.Dark]: {
    hue: 0,
    saturation: 0,
    lightness: 16,
  },
  [AppTheme.Light]: {
    hue: 234,
    saturation: 0,
    lightness: 86,
  },
};

const LayerColors = ({ theme }: { theme: AppTheme }) => {
  const { hue, saturation, lightness } = BaseElements[theme];

  return {
    layer0: `hsl(${hue}, ${saturation}%, ${lightness - 12}%)`,
    layer1: `hsl(${hue}, ${saturation}%, ${lightness - 8}%)`,
    layer2: `hsl(${hue}, ${saturation}%, ${lightness - 4}%)`,
    layer3: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    layer4: `hsl(${hue}, ${saturation}%, ${lightness + 4}%)`,
    layer5: `hsl(${hue}, ${saturation - 2}%, ${lightness + 7}%)`,
    layer6: `hsl(${hue}, ${saturation - 4}%, ${lightness + 10}%)`,
  };
};

const AccentColor = ({ theme }: { theme: AppTheme }) => {
  const purpleHue = {
    Classic: 240,
    Dark: 240,
    Light: 234,
  }[theme];

  return {
    accent: `hsl(${purpleHue}, 100%, 70%)`,
  };
};

export const Colors = {
  [AppTheme.Classic]: {
    ...LayerColors({ theme: AppTheme.Classic }),
    text0: 'hsl(245, 11%, 55%)',
    text1: 'hsl(244, 18%, 81%)',
    text2: 'hsl(240, 43%, 99%)',

    ...AccentColor({ theme: AppTheme.Classic }),
    green: 'hsl(159, 67%, 39%)',
    yellow: 'hsl(36, 100%, 64%)',
    red: 'hsl(360, 73%, 61%)',

    positive: 'hsl(159, 67%, 39%)',
    negative: 'hsl(360, 73%, 61%)',

    success: 'hsl(159, 67%, 39%)',
    warning: 'hsl(36, 100%, 64%)',
    error: 'hsl(360, 73%, 61%)',

    favorite: 'hsl(36, 100%, 64%)',
  },
  [AppTheme.Dark]: {
    ...LayerColors({ theme: AppTheme.Dark }),
    text0: 'hsl(0, 0%, 47%)',
    text1: 'hsl(0, 0%, 67%)',
    text2: 'hsl(0, 0%, 100%)',

    ...AccentColor({ theme: AppTheme.Dark }),
    green: 'hsl(159, 67%, 39%)',
    yellow: 'hsl(36, 100%, 64%)',
    red: 'hsl(360, 73%, 61%)',

    positive: 'hsl(159, 67%, 39%)',
    negative: 'hsl(360, 73%, 61%)',

    success: 'hsl(159, 67%, 39%)',
    warning: 'hsl(36, 100%, 64%)',
    error: 'hsl(360, 73%, 61%)',

    favorite: 'hsl(36, 100%, 64%)',
  },
  [AppTheme.Light]: {
    ...LayerColors({ theme: AppTheme.Light }),
    text0: 'hsl(0, 0%, 55%)',
    text1: 'hsl(0, 0%, 40%)',
    text2: 'hsl(0, 0%, 5%)',

    ...AccentColor({ theme: AppTheme.Light }),
    green: 'hsl(159, 67%, 39%)',
    yellow: 'hsl(36, 100%, 64%)',
    red: 'hsl(360, 73%, 61%)',

    positive: 'hsl(159, 67%, 39%)',
    negative: 'hsl(360, 73%, 61%)',

    success: 'hsl(159, 67%, 39%)',
    warning: 'hsl(36, 100%, 64%)',
    error: 'hsl(360, 73%, 61%)',

    favorite: 'hsl(36, 100%, 64%)',
  },
};

export const UsageColorFromRiskLevel = (riskLevel: RiskLevels) =>
  ({
    low: css`
      color: var(--color-risk-low);
    `,
    medium: css`
      color: var(--color-risk-medium);
    `,
    high: css`
      color: var(--color-risk-high);
    `,
  }[riskLevel.name]);
