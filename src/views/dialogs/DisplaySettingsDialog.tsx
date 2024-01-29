import { useDispatch, useSelector } from 'react-redux';
import styled, { AnyStyledComponent, css } from 'styled-components';

import { Root, Item, Indicator } from '@radix-ui/react-radio-group';

import { useStringGetter } from '@/hooks';

import { AppTheme, setAppTheme } from '@/state/configs';
import { getAppTheme } from '@/state/configsSelectors';

import { layoutMixins } from '@/styles/layoutMixins';
import { Themes } from '@/styles/themes';

import { STRING_KEYS } from '@/constants/localization';

import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { Panel } from '@/components/Panel';
import { HorizontalSeparatorFiller } from '@/components/Separator';

type ElementProps = {
  setIsOpen: (open: boolean) => void;
};

export const DisplaySettingsDialog = ({ setIsOpen }: ElementProps) => {
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();

  const currentTheme: AppTheme = useSelector(getAppTheme);

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
      <Styled.Root value={currentTheme}>
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
          <Item value={theme}>
            <Styled.Panel
              backgroundColor={Themes[theme].layer2}
              gridColor={Themes[theme].borderDefault}
              onClick={() => {
                dispatch(setAppTheme(theme));
              }}
              slotHeader={
                <Styled.PanelHeader textColor={Themes[theme].textPrimary}>
                  {stringGetter({ key: label })}
                </Styled.PanelHeader>
              }
            >
              <Styled.Image src="/chart-bars.svg" />
              <Styled.Indicator>
                <Styled.CheckIcon iconName={IconName.Check} />
              </Styled.Indicator>
            </Styled.Panel>
          </Item>
        ))}
      </Styled.Root>
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

Styled.Section = styled.div`
  display: grid;
  gap: 1.5rem;
`;

Styled.Header = styled.header`
  ${layoutMixins.inlineRow}
`;

Styled.Root = styled(Root)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
`;

Styled.Panel = styled(Panel)<{ backgroundColor: string; gridColor: string }>`
  --panel-content-paddingY: 0.25rem;
  --panel-content-paddingX: 0.25rem;

  ${({ backgroundColor, gridColor }) => css`
    --themePanel-backgroundColor: ${backgroundColor};
    --themePanel-gridColor: ${gridColor};
  `}

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;

    background: radial-gradient(
      55% 35% at 50% 65%,
      transparent,
      var(--themePanel-backgroundColor) 100%
    );
    background-color: var(--themePanel-gridColor);
    mask-image: url('/chart-bars-background.svg');
    mask-size: cover;
  }

  position: relative;
  padding: 0.75rem;

  background-color: var(--themePanel-backgroundColor);
  border: solid var(--border-width) var(--color-border);
`;

Styled.PanelHeader = styled.h3<{ textColor: string }>`
  ${({ textColor }) => css`
    color: ${textColor};
  `}

  align-self: flex-start;
  z-index: 1;
`;

Styled.Image = styled.img`
  width: 100%;
  height: auto;
`;

Styled.Indicator = styled(Indicator)`
  --indicator-size: 1.25rem;

  height: var(--indicator-size);
  width: var(--indicator-size);

  position: absolute;
  bottom: 0;
  right: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  background-color: var(--color-accent);
  border-radius: 50%;
  color: var(--color-text-2);
`;

Styled.CheckIcon = styled(Icon)`
  --icon-size: 0.625rem;

  width: var(--icon-size);
  height: var(--icon-size);
`;
