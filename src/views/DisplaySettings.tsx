import { Indicator, Item, Root } from '@radix-ui/react-radio-group';
import styled, { css } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';
import { Themes } from '@/styles/themes';

import { Icon, IconName } from '@/components/Icon';
import { HorizontalSeparatorFiller } from '@/components/Separator';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import {
  AppColorMode,
  AppTheme,
  AppThemeSystemSetting,
  setAppColorMode,
  setAppThemeSetting,
  type AppThemeSetting,
} from '@/state/configs';
import { getAppColorMode, getAppThemeSetting } from '@/state/configsSelectors';

import { testFlags } from '@/lib/testFlags';

export const DisplaySettings = ({ className }: { className?: string }) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();

  const currentThemeSetting: AppThemeSetting = useAppSelector(getAppThemeSetting);
  const currentColorMode: AppColorMode = useAppSelector(getAppColorMode);

  const sectionHeader = (heading: string) => {
    return (
      <header tw="inlineRow">
        {heading}
        <HorizontalSeparatorFiller />
      </header>
    );
  };

  const themePanels = () => {
    const { uiRefresh } = testFlags;
    return (
      <$AppThemeRoot value={currentThemeSetting}>
        {(uiRefresh
          ? [
              {
                themeSetting: AppTheme.Dark,
                label: STRING_KEYS.DARK,
              },
              {
                themeSetting: AppTheme.Light,
                label: STRING_KEYS.LIGHT,
              },
              {
                themeSetting: AppTheme.Classic,
                label: STRING_KEYS.CLASSIC_DARK,
              },
              {
                themeSetting: AppThemeSystemSetting.System,
                label: STRING_KEYS.SYSTEM,
              },
            ]
          : [
              {
                themeSetting: AppTheme.Classic,
                label: STRING_KEYS.CLASSIC_DARK,
              },
              {
                themeSetting: AppThemeSystemSetting.System,
                label: STRING_KEYS.SYSTEM,
              },
              {
                themeSetting: AppTheme.Dark,
                label: STRING_KEYS.DARK,
              },
              {
                themeSetting: AppTheme.Light,
                label: STRING_KEYS.LIGHT,
              },
            ]
        ).map(({ themeSetting, label }) => {
          const theme =
            themeSetting === AppThemeSystemSetting.System
              ? globalThis.matchMedia('(prefers-color-scheme: dark)').matches
                ? AppTheme.Dark
                : AppTheme.Light
              : themeSetting;

          const backgroundColor = Themes[theme][currentColorMode].layer2;
          const gridColor = Themes[theme][currentColorMode].borderDefault;
          const textColor = Themes[theme][currentColorMode].textPrimary;

          return (
            <$AppThemeItem
              key={themeSetting}
              value={themeSetting}
              backgroundcolor={backgroundColor}
              gridcolor={gridColor}
              onClick={() => {
                dispatch(setAppThemeSetting(themeSetting));
              }}
            >
              <$AppThemeHeader textcolor={textColor}>
                {stringGetter({ key: label })}
              </$AppThemeHeader>
              <img src="/chart-bars.svg" tw="z-[1] h-auto w-full" />
              <$CheckIndicator>
                <Icon iconName={IconName.Check} size="0.5rem" />
              </$CheckIndicator>
            </$AppThemeItem>
          );
        })}
      </$AppThemeRoot>
    );
  };

  const colorModeOptions = () => {
    return (
      <$ColorPreferenceRoot value={currentColorMode}>
        {[
          {
            colorMode: AppColorMode.GreenUp,
            label: STRING_KEYS.GREEN_IS_UP,
          },
          {
            colorMode: AppColorMode.RedUp,
            label: STRING_KEYS.RED_IS_UP,
          },
        ].map(({ colorMode, label }) => (
          <$ColorPreferenceItem
            key={colorMode}
            value={colorMode}
            onClick={() => {
              dispatch(setAppColorMode(colorMode));
            }}
          >
            <div tw="inlineRow gap-[1ch]">
              <$ArrowIconContainer>
                <$ArrowIcon
                  iconName={IconName.Arrow}
                  direction="up"
                  color={colorMode === AppColorMode.GreenUp ? 'green' : 'red'}
                  size="0.875em"
                />
                <$ArrowIcon
                  iconName={IconName.Arrow}
                  direction="down"
                  color={colorMode === AppColorMode.GreenUp ? 'red' : 'green'}
                  size="0.875em"
                />
              </$ArrowIconContainer>
              {stringGetter({ key: label })}
            </div>
            <$DotIndicator $selected={currentColorMode === colorMode} />
          </$ColorPreferenceItem>
        ))}
      </$ColorPreferenceRoot>
    );
  };

  return (
    <div className={className}>
      <$Section>
        {sectionHeader(stringGetter({ key: STRING_KEYS.THEME }))}
        {themePanels()}
      </$Section>
      <$Section>
        {sectionHeader(stringGetter({ key: STRING_KEYS.DIRECTION_COLOR_PREFERENCE }))}
        {colorModeOptions()}
      </$Section>
    </div>
  );
};
const gridStyle = css`
  display: grid;
  gap: 1.5rem;
`;

const $Section = styled.div`
  ${gridStyle}
  padding: 1rem 0;
`;
const $AppThemeRoot = styled(Root)`
  ${gridStyle}
  grid-template-columns: 1fr 1fr;
`;

const $ColorPreferenceRoot = styled(Root)`
  ${gridStyle}
  grid-template-columns: 1fr;
`;

const $Item = styled(Item)`
  --border-color: var(--color-border);
  --item-padding: 0.75rem;

  &[data-state='checked'] {
    --border-color: var(--color-accent);
  }

  border: solid var(--border-width) var(--border-color);
  border-radius: 0.875rem;

  padding: var(--item-padding);
`;

const $ColorPreferenceItem = styled($Item)`
  &[data-state='checked'] {
    background-color: var(--color-layer-4);
  }

  ${layoutMixins.row}
  justify-content: space-between;
`;

const $AppThemeItem = styled($Item)<{ backgroundcolor: string; gridcolor: string }>`
  ${({ backgroundcolor, gridcolor }) => css`
    --themePanel-backgroundColor: ${backgroundcolor};
    --themePanel-gridColor: ${gridcolor};
  `}

  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;

  background-color: var(--themePanel-backgroundColor);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;

    border-radius: 0.875rem;

    background: radial-gradient(
      55% 35% at 50% 65%,
      transparent,
      var(--themePanel-backgroundColor) 100%
    );
    background-color: var(--themePanel-gridColor);
    mask-image: url('/chart-bars-background.svg');
    mask-size: cover;
  }
`;

const $AppThemeHeader = styled.h3<{ textcolor: string }>`
  ${({ textcolor }) => css`
    color: ${textcolor};
  `}
  z-index: 1;
`;
const $ArrowIconContainer = styled.div`
  ${layoutMixins.column}
  gap: 0.25rem;
`;

const $ArrowIcon = styled(Icon)<{ direction: 'up' | 'down'; color: 'green' | 'red' }>`
  ${({ direction }) =>
    ({
      up: css`
        transform: rotate(-90deg);
      `,
      down: css`
        transform: rotate(90deg);
      `,
    })[direction]}

  ${({ color }) =>
    ({
      green: css`
        color: var(--color-green);
      `,
      red: css`
        color: var(--color-red);
      `,
    })[color]}
`;

const indicatorStyle = css`
  --indicator-size: 1.25rem;
  --icon-size: 0.5rem;

  height: var(--indicator-size);
  width: var(--indicator-size);

  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const $DotIndicator = styled.div<{ $selected: boolean }>`
  ${indicatorStyle}
  --background-color: var(--color-layer-2);
  --border-color: var(--color-border);

  ${({ $selected }) =>
    $selected &&
    css`
      --background-color: var(--color-accent);
      --border-color: var(--color-accent);

      &::after {
        content: '';
        display: block;
        width: var(--icon-size);
        height: var(--icon-size);
        background-color: var(--color-layer-2);
        border-radius: 50%;
      }
    `}

  background-color: var(--background-color);
  border: solid var(--border-width) var(--border-color);
`;

const $CheckIndicator = styled(Indicator)`
  ${indicatorStyle}
  position: absolute;
  bottom: var(--item-padding);
  right: var(--item-padding);

  background-color: var(--color-accent);
  color: var(--color-text-button);
`;
