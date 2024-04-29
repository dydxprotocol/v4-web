import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import styled, { type AnyStyledComponent } from 'styled-components';

import { ButtonShape } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useTokenConfigs, useStringGetter, useURLConfigs } from '@/hooks';

import { LogoShortIcon, BellStrokeIcon } from '@/icons';
import breakpoints from '@/styles/breakpoints';
import { headerMixins } from '@/styles/headerMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { NavigationMenu } from '@/components/NavigationMenu';
import { VerticalSeparator } from '@/components/Separator';
import { AccountMenu } from '@/views/menus/AccountMenu';
import { LanguageSelector } from '@/views/menus/LanguageSelector';
import { NetworkSelectMenu } from '@/views/menus/NetworkSelectMenu';
import { NotificationsMenu } from '@/views/menus/NotificationsMenu';

import { getHasSeenLaunchIncentives } from '@/state/configsSelectors';
import { openDialog } from '@/state/dialogs';

export const HeaderDesktop = () => {
  const stringGetter = useStringGetter();
  const { documentation, community, mintscanBase, exchangeStats } = useURLConfigs();
  const dispatch = useDispatch();
  const { chainTokenLabel } = useTokenConfigs();

  const hasSeenLaunchIncentives = useSelector(getHasSeenLaunchIncentives);

  const navItems = [
    {
      group: 'navigation',
      items: [
        {
          value: 'TRADE',
          label: stringGetter({ key: STRING_KEYS.TRADE }),
          href: AppRoute.Trade,
        },
        {
          value: 'PORTFOLIO',
          label: stringGetter({ key: STRING_KEYS.PORTFOLIO }),
          href: AppRoute.Portfolio,
        },
        {
          value: 'MARKETS',
          label: stringGetter({ key: STRING_KEYS.MARKETS }),
          href: AppRoute.Markets,
        },
        {
          value: chainTokenLabel,
          label: chainTokenLabel,
          href: `/${chainTokenLabel}`,
          slotAfter: !hasSeenLaunchIncentives && <Styled.UnreadIndicator />,
        },
        {
          value: 'MORE',
          label: stringGetter({ key: STRING_KEYS.MORE }),
          subitems: [
            {
              value: 'DOCUMENTATION',
              slotBefore: <Icon iconName={IconName.Terminal} />,
              label: stringGetter({ key: STRING_KEYS.DOCUMENTATION }),
              href: documentation,
            },
            {
              value: 'MINTSCAN',
              slotBefore: <Icon iconName={IconName.Mintscan} />,
              label: stringGetter({ key: STRING_KEYS.MINTSCAN }),
              href: mintscanBase,
            },
            {
              value: 'COMMUNITY',
              slotBefore: <Icon iconName={IconName.Discord} />,
              label: stringGetter({ key: STRING_KEYS.COMMUNITY }),
              href: community,
            },
            {
              value: 'TERMS_OF_USE',
              slotBefore: <Icon iconName={IconName.File} />,
              label: stringGetter({ key: STRING_KEYS.TERMS_OF_USE }),
              href: AppRoute.Terms,
            },
            {
              value: 'PRIVACY_POLICY',
              slotBefore: <Icon iconName={IconName.Privacy} />,
              label: stringGetter({ key: STRING_KEYS.PRIVACY_POLICY }),
              href: AppRoute.Privacy,
            },
            {
              value: 'HELP',
              slotBefore: <Icon iconName={IconName.HelpCircle} />,
              label: stringGetter({ key: STRING_KEYS.HELP }),
              onClick: (e: MouseEvent) => {
                e.preventDefault();
                dispatch(openDialog({ type: DialogTypes.Help }));
              },
            },
            {
              value: 'STATS',
              slotBefore: <Icon iconName={IconName.FundingChart} />,
              label: stringGetter({ key: STRING_KEYS.STATISTICS }),
              href: exchangeStats,
            },
          ],
        },
      ],
    },
  ];

  return (
    <Styled.Header>
      <Styled.LogoLink to="/">
        <LogoShortIcon />
      </Styled.LogoLink>

      <VerticalSeparator />

      <Styled.NavBefore>
        <NetworkSelectMenu sideOffset={16} />
        <VerticalSeparator />
        <LanguageSelector sideOffset={16} />
      </Styled.NavBefore>

      <VerticalSeparator />

      <Styled.NavigationMenu items={navItems} orientation="horizontal" />

      <div role="separator" />

      <Styled.NavAfter>
        <Styled.IconButton
          shape={ButtonShape.Rectangle}
          iconName={IconName.HelpCircle}
          onClick={() => dispatch(openDialog({ type: DialogTypes.Help }))}
        />

        <VerticalSeparator />

        <NotificationsMenu
          slotTrigger={
            <Styled.IconButton shape={ButtonShape.Rectangle} iconComponent={BellStrokeIcon} />
          }
        />

        <VerticalSeparator />

        <AccountMenu />
      </Styled.NavAfter>
    </Styled.Header>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Header = styled.header`
  --header-horizontal-padding-mobile: 0.5rem;
  --trigger-height: 2.25rem;
  --logo-width: 3.5rem;

  ${layoutMixins.container}
  ${layoutMixins.stickyHeader}
  ${layoutMixins.scrollSnapItem}
  backdrop-filter: none;

  height: var(--page-currentHeaderHeight);

  grid-area: Header;

  display: grid;
  align-items: stretch;
  grid-auto-flow: column;
  grid-template:
    'Logo . NavBefore . Nav . NavAfter' 100%
    / var(--logo-width) var(--border-width) calc(
      var(--sidebar-width) - var(--logo-width) - var(--border-width)
    )
    var(--border-width) 1fr var(--border-width) auto;

  @media ${breakpoints.tablet} {
    --trigger-height: 3rem;
  }

  @media ${breakpoints.mobile} {
    --navBefore-width: 7rem;
  }

  font-size: 0.9375rem;

  :before {
    backdrop-filter: blur(10px);
  }
`;

Styled.NavigationMenu = styled(NavigationMenu)`
  & {
    --navigationMenu-height: var(--stickyArea-topHeight);
    --navigationMenu-item-height: var(--trigger-height);
  }

  ${layoutMixins.scrollArea}
  padding: 0 0.5rem;
  scroll-padding: 0 0.5rem;
`;

Styled.NavBefore = styled.div`
  ${layoutMixins.flexEqualColumns}

  > * {
    align-self: center;
    margin: 0 0.4rem;
  }
`;

Styled.LogoLink = styled(Link)`
  display: flex;
  align-self: stretch;

  > svg {
    margin: auto;
    width: auto;
    height: 45%;
  }
`;

Styled.NavAfter = styled.div`
  ${layoutMixins.row}
  justify-self: end;
  padding-right: 0.75rem;

  gap: 0.5rem;

  a {
    color: var(--color-text-1);
  }
`;

Styled.IconButton = styled(IconButton)<{ size?: string }>`
  ${headerMixins.button}
  --button-border: none;
  --button-icon-size: 1rem;
  --button-padding: 0 0.5em;
`;

Styled.UnreadIndicator = styled.div`
  width: 0.4375rem;
  height: 0.4375rem;
  border-radius: 50%;
  background-color: var(--color-accent);
`;
