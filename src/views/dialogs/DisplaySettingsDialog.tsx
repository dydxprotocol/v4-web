import { useDispatch, useSelector } from 'react-redux';
import styled, { AnyStyledComponent, css } from 'styled-components';

import { Root, Item, Indicator } from '@radix-ui/react-radio-group';

import { useStringGetter } from '@/hooks';

import { AppTheme, AppColorMode, setAppTheme } from '@/state/configs';
import { getAppTheme, getAppColorMode } from '@/state/configsSelectors';

import { layoutMixins } from '@/styles/layoutMixins';
import { Themes } from '@/styles/themes';

import { STRING_KEYS } from '@/constants/localization';

import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { HorizontalSeparatorFiller } from '@/components/Separator';

type ElementProps = {
  setIsOpen: (open: boolean) => void;
};

export const DisplaySettingsDialog = ({ setIsOpen }: ElementProps) => {
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();

  const currentTheme: AppTheme = useSelector(getAppTheme);
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
            theme: AppTheme.Classic,
            label: STRING_KEYS.CLASSIC_DARK,
          },
          {
            theme: AppTheme.Dark,
            label: STRING_KEYS.DARK,
          },
          {
            theme: AppTheme.Light,
            label: STRING_KEYS.LIGHT,
          },
        ].map(({ theme, label }) => (
          <Styled.AppThemeItem
            key={theme}
            value={theme}
            backgroundcolor={Themes[theme][currentColorMode].layer2}
            gridcolor={Themes[theme][currentColorMode].borderDefault}
            onClick={() => {
              dispatch(setAppTheme(theme));
            }}
          >
            <Styled.AppThemeHeader textcolor={Themes[theme][currentColorMode].textPrimary}>
              {stringGetter({ key: label })}
            </Styled.AppThemeHeader>
            <Styled.Image src="/chart-bars.svg" />
            <Styled.CheckIndicator>
              <Styled.CheckIcon iconName={IconName.Check} />
            </Styled.CheckIndicator>
          </Styled.AppThemeItem>
        ))}
      </Styled.AppThemeRoot>
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

Styled.CheckIndicator = styled(Indicator)`
  ${indicatorStyle}

  position: absolute;
  bottom: var(--item-padding);
  right: var(--item-padding);

  background-color: var(--color-accent);
  color: var(--color-text-2);
`;

Styled.CheckIcon = styled(Icon)`
  width: var(--icon-size);
  height: var(--icon-size);
`;
