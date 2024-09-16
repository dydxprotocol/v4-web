import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { ButtonShape } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { BellStrokeIcon } from '@/icons';
import { LogoShortIcon } from '@/icons/logo-short';
import breakpoints from '@/styles/breakpoints';
import { headerMixins } from '@/styles/headerMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { NavigationMenu } from '@/components/NavigationMenu';
import { VerticalSeparator } from '@/components/Separator';
import { NewTag } from '@/components/Tag';
import { MobileDownloadLinks } from '@/views/MobileDownloadLinks';
import { AccountMenu } from '@/views/menus/AccountMenu';
import { LanguageSelector } from '@/views/menus/LanguageSelector';
import { NetworkSelectMenu } from '@/views/menus/NetworkSelectMenu';
import { NotificationsMenu } from '@/views/menus/NotificationsMenu';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getHasSeenLaunchIncentives } from '@/state/configsSelectors';
import { openDialog } from '@/state/dialogs';

import { isTruthy } from '@/lib/isTruthy';
import { testFlags } from '@/lib/testFlags';

export const HeaderDesktop = () => {
  const stringGetter = useStringGetter();
  const { documentation, community, mintscanBase, exchangeStats } = useURLConfigs();
  const dispatch = useAppDispatch();
  const { chainTokenLabel } = useTokenConfigs();

  const hasSeenLaunchIncentives = useAppSelector(getHasSeenLaunchIncentives);
  const showVaults = testFlags.enableVaults;
  const showLaunchMarkets = testFlags.pml;

  const navItems = [
    {
      group: 'navigation',
      items: [
        {
          value: 'AFFILIATES',
          label: stringGetter({ key: STRING_KEYS.AFFILIATES }),
          href: AppRoute.Affiliates,
        },
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
        showLaunchMarkets && {
          value: 'LAUNCH_MARKET',
          label: stringGetter({ key: STRING_KEYS.LAUNCH_MARKETS }),
          href: AppRoute.LaunchMarket,
        },
        showVaults && {
          value: 'VAULT',
          label: (
            <>
              {stringGetter({ key: STRING_KEYS.VAULT })}{' '}
              <NewTag>{stringGetter({ key: STRING_KEYS.NEW })}</NewTag>
            </>
          ),
          href: AppRoute.Vault,
        },
        {
          value: chainTokenLabel,
          label: chainTokenLabel,
          href: `/${chainTokenLabel}`,
          slotAfter: !hasSeenLaunchIncentives && (
            <div tw="h-[0.4375rem] w-[0.4375rem] rounded-[50%] bg-color-accent" />
          ),
        },
        {
          value: 'MORE',
          label: stringGetter({ key: STRING_KEYS.MORE }),
          subitems: [
            {
              value: 'DOCUMENTATION',
              slotBefore: <Icon iconName={IconName.Terminal} />,
              label: stringGetter({ key: STRING_KEYS.API_DOCUMENTATION }),
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
              onClick: () => {
                dispatch(openDialog(DialogTypes.Help()));
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
      ].filter(isTruthy),
    },
  ];

  return (
    <$Header>
      <$LogoLink to="/">
        <LogoShortIcon />
      </$LogoLink>

      <VerticalSeparator />

      <$NavBefore>
        <NetworkSelectMenu sideOffset={16} />
        <VerticalSeparator />
        <LanguageSelector sideOffset={16} />
      </$NavBefore>

      <VerticalSeparator />

      <$NavigationMenu items={navItems} orientation="horizontal" />

      <div role="separator" />

      <$NavAfter>
        <MobileDownloadLinks />

        <$IconButton
          shape={ButtonShape.Rectangle}
          iconName={IconName.HelpCircle}
          onClick={() => dispatch(openDialog(DialogTypes.Help()))}
        />

        <VerticalSeparator />

        <NotificationsMenu
          slotTrigger={
            <$IconButton
              shape={ButtonShape.Rectangle}
              iconComponent={BellStrokeIcon as React.ElementType}
            />
          }
        />

        <VerticalSeparator />

        <AccountMenu />
      </$NavAfter>
    </$Header>
  );
};
const $Header = styled.header`
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

  &:before {
    backdrop-filter: blur(10px);
  }
`;

const $NavigationMenu = styled(NavigationMenu)`
  & {
    --navigationMenu-height: var(--stickyArea-topHeight);
    --navigationMenu-item-height: var(--trigger-height);
  }

  ${layoutMixins.scrollArea}
  padding: 0 0.5rem;
  scroll-padding: 0 0.5rem;
` as typeof NavigationMenu;

const $NavBefore = styled.div`
  ${layoutMixins.flexEqualColumns}

  > * {
    align-self: center;
    margin: 0 0.4rem;
  }
`;

const $LogoLink = styled(Link)`
  display: flex;
  align-self: stretch;

  > svg {
    margin: auto;
    width: auto;
    height: 45%;
  }
`;

const $NavAfter = styled.div`
  ${layoutMixins.row}
  justify-self: end;
  padding: 0 0.75rem;

  gap: 0.5rem;

  a {
    color: var(--color-text-1);
  }
`;

const $IconButton = styled(IconButton)<{ size?: string }>`
  ${headerMixins.button}
  --button-border: none;
  --button-icon-size: 1rem;
  --button-padding: 0 0.5em;
`;
