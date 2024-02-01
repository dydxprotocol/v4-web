import { useDispatch, useSelector } from 'react-redux';
import styled, { AnyStyledComponent, css } from 'styled-components';

import { Root, Item, Indicator } from '@radix-ui/react-radio-group';

import { useStringGetter } from '@/hooks';

import {
  AppTheme,
  AppThemeSystemSetting,
  AppColorMode,
  setAppThemeSetting,
  setAppColorMode,
} from '@/state/configs';
import { getAppThemeSetting, getAppColorMode } from '@/state/configsSelectors';

import { layoutMixins } from '@/styles/layoutMixins';
import { Themes } from '@/styles/themes';

import { STRING_KEYS } from '@/constants/localization';
import { NumberSign } from '@/constants/numbers';

import { Dialog } from '@/components/Dialog';
import { DiffArrow } from '@/components/DiffArrow';
import { Icon, IconName } from '@/components/Icon';
import { HorizontalSeparatorFiller } from '@/components/Separator';

type ElementProps = {
  setIsOpen: (open: boolean) => void;
};

export const DisplaySettingsDialog = ({ setIsOpen }: ElementProps) => {
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();

  const currentTheme: AppTheme = useSelector(getAppThemeSetting);
  const currentColorMode: AppColorMode = useSelector(getAppColorMode);

  const sectionHeader = (heading: string) => {
    return (
      <Styled.Header>
        {heading}
        <HorizontalSeparatorFiller />
      </Styled.Header>
    );
  };

  const themePanels = () => {
    return (
      <Styled.AppThemeRoot value={currentTheme}>
        {[
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
        ].map(({ themeSetting, label }) => {
          const theme =
            themeSetting === AppThemeSystemSetting.System ? AppTheme.Dark : themeSetting;

          const backgroundColor = Themes[theme][currentColorMode].layer2;
          const gridColor = Themes[theme][currentColorMode].borderDefault;
          const textColor = Themes[theme][currentColorMode].textPrimary;

          return (
            <Styled.AppThemeItem
              key={themeSetting}
              value={themeSetting}
              backgroundcolor={backgroundColor}
              gridcolor={gridColor}
              onClick={() => {
                dispatch(setAppThemeSetting(themeSetting));
              }}
            >
              <Styled.AppThemeHeader textcolor={textColor}>
                {stringGetter({ key: label })}
              </Styled.AppThemeHeader>
              <Styled.Image src="/chart-bars.svg" />
              <Styled.CheckIndicator>
                <Styled.CheckIcon iconName={IconName.Check} />
              </Styled.CheckIndicator>
            </Styled.AppThemeItem>
          );
        })}
      </Styled.AppThemeRoot>
    );
  };

  const colorModeOptions = () => {
    return (
      <Styled.ColorPreferenceRoot value={currentColorMode}>
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
          <Styled.ColorPreferenceItem
            key={colorMode}
            value={colorMode}
            onClick={() => {
              dispatch(setAppColorMode(colorMode));
            }}
          >
            <Styled.ColorPreferenceLabel>
              <Styled.DiffArrowContainer>
                <Styled.DiffArrow
                  direction="up"
                  sign={
                    colorMode === AppColorMode.GreenUp ? NumberSign.Positive : NumberSign.Negative
                  }
                />
                <Styled.DiffArrow
                  direction="down"
                  sign={
                    colorMode === AppColorMode.GreenUp ? NumberSign.Negative : NumberSign.Positive
                  }
                />
              </Styled.DiffArrowContainer>
              {stringGetter({ key: label })}
            </Styled.ColorPreferenceLabel>
            <Styled.DotIndicator $selected={currentColorMode === colorMode} />
          </Styled.ColorPreferenceItem>
        ))}
      </Styled.ColorPreferenceRoot>
    );
  };

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.DISPLAY_SETTINGS })}
    >
      <Styled.Section>
        {sectionHeader(stringGetter({ key: STRING_KEYS.THEME }))}
        {themePanels()}
      </Styled.Section>
      <Styled.Section>
        {sectionHeader(stringGetter({ key: STRING_KEYS.DIRECTION_COLOR_PREFERENCE }))}
        {colorModeOptions()}
      </Styled.Section>
    </Dialog>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

const gridStyle = css`
  display: grid;
  gap: 1.5rem;
`;

Styled.Section = styled.div`
  ${gridStyle}
  padding: 1rem 0;
`;

Styled.Header = styled.header`
  ${layoutMixins.inlineRow}
`;

Styled.AppThemeRoot = styled(Root)`
  ${gridStyle}
  grid-template-columns: 1fr 1fr;
`;

Styled.ColorPreferenceRoot = styled(Root)`
  ${gridStyle}
  grid-template-columns: 1fr;
`;

Styled.Item = styled(Item)`
  --border-color: var(--color-border);
  --item-padding: 0.75rem;

  &[data-state='checked'] {
    --border-color: var(--color-accent);
  }

  border: solid var(--border-width) var(--border-color);
  border-radius: 0.875rem;

  padding: var(--item-padding);
`;

Styled.ColorPreferenceItem = styled(Styled.Item)`
  &[data-state='checked'] {
    background-color: var(--color-layer-4);
  }

  ${layoutMixins.row}
  justify-content: space-between;
`;

Styled.AppThemeItem = styled(Styled.Item)<{ backgroundcolor: string; gridcolor: string }>`
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

Styled.AppThemeHeader = styled.h3<{ textcolor: string }>`
  ${({ textcolor }) => css`
    color: ${textcolor};
  `}
  z-index: 1;
`;

Styled.Image = styled.img`
  width: 100%;
  height: auto;
  z-index: 1;
`;

Styled.ColorPreferenceLabel = styled.div`
  ${layoutMixins.inlineRow};
  gap: 1ch;
`;

Styled.DiffArrowContainer = styled.div`
  ${layoutMixins.column}
  gap: 0.5ch;
`;

Styled.DiffArrow = styled(DiffArrow)`
  --diffArrow-color-positive: var(--color-success);
  --diffArrow-color-negative: var(--color-error);

  svg {
    width: 0.75em;
    height: 0.75em;
  }
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

Styled.DotIndicator = styled.div<{ $selected: boolean }>`
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

Styled.CheckIndicator = styled(Indicator)`
  ${indicatorStyle}
  position: absolute;
  bottom: var(--item-padding);
  right: var(--item-padding);

  background-color: var(--color-accent);
  color: var(--color-text-button);
`;

Styled.CheckIcon = styled(Icon)`
  width: var(--icon-size);
  height: var(--icon-size);
`;
