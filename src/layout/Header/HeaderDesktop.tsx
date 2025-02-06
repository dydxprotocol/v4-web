import { shallowEqual } from 'react-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { OnboardingState } from '@/constants/account';
import { ButtonAction, ButtonShape, ButtonSize } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';
import { StatsigFlags } from '@/constants/statsig';

import { useAccounts } from '@/hooks/useAccounts';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useStatsigGateValue } from '@/hooks/useStatsig';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';
import { useURLConfigs } from '@/hooks/useURLConfigs';

import { BellStrokeIcon } from '@/icons';
import { LogoShortIcon } from '@/icons/logo-short';
import breakpoints from '@/styles/breakpoints';
import { headerMixins } from '@/styles/headerMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { NavigationMenu } from '@/components/NavigationMenu';
import { VerticalSeparator } from '@/components/Separator';
import { MegavaultYieldTag } from '@/pages/portfolio/AccountOverviewSection';
import { MobileDownloadLinks } from '@/views/MobileDownloadLinks';
import { AccountMenu } from '@/views/menus/AccountMenu';
import { LanguageSelector } from '@/views/menus/LanguageSelector';
import { NetworkSelectMenu } from '@/views/menus/NetworkSelectMenu';
import { NotificationsMenu } from '@/views/menus/NotificationsMenu';

import { getOnboardingState, getSubaccount } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getHasSeenLaunchIncentives } from '@/state/appUiConfigsSelectors';
import { openDialog } from '@/state/dialogs';

import { isTruthy } from '@/lib/isTruthy';
import { testFlags } from '@/lib/testFlags';

export const HeaderDesktop = () => {
  const stringGetter = useStringGetter();
  const { documentation, community, mintscanBase, exchangeStats } = useURLConfigs();
  const dispatch = useAppDispatch();
  const { chainTokenLabel } = useTokenConfigs();
  const { dydxAccounts } = useAccounts();
  const onboardingState = useAppSelector(getOnboardingState);
  const { complianceState } = useComplianceState();

  const subAccount = useAppSelector(getSubaccount, shallowEqual);
  const { freeCollateral: availableBalance } = subAccount ?? {};

  const affiliatesEnabled = useStatsigGateValue(StatsigFlags.ffEnableAffiliates);
  const showNewDepositFlow =
    useStatsigGateValue(StatsigFlags.ffDepositRewrite) || testFlags.showNewDepositFlow;

  const hasSeenLaunchIncentives = useAppSelector(getHasSeenLaunchIncentives);

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
          value: 'MARKETS',
          label: stringGetter({ key: STRING_KEYS.MARKETS }),
          href: AppRoute.Markets,
        },
        {
          value: 'PORTFOLIO',
          label: stringGetter({ key: STRING_KEYS.PORTFOLIO }),
          href: AppRoute.Portfolio,
        },
        {
          value: 'VAULT',
          label: (
            <>
              {stringGetter({ key: STRING_KEYS.MEGAVAULT })} <MegavaultYieldTag />
            </>
          ),
          href: AppRoute.Vault,
        },
        affiliatesEnabled && {
          value: 'REFERRALS',
          label: stringGetter({ key: STRING_KEYS.REFERRALS }),
          href: AppRoute.Referrals,
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
              onClick: () => {
                dispatch(
                  openDialog(
                    DialogTypes.ExternalLink({
                      link: documentation,
                    })
                  )
                );
              },
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
        <$LanguageSelector sideOffset={16}>
          <Icon iconName={IconName.Translate} size="1.25em" />
        </$LanguageSelector>
        <VerticalSeparator />
        <NetworkSelectMenu sideOffset={16} />
      </$NavBefore>

      <VerticalSeparator />

      <$NavigationScrollBar>
        <$NavigationMenu items={navItems} orientation="horizontal" dividerStyle="underline" />
      </$NavigationScrollBar>

      <div role="separator" />

      <$NavAfter>
        {onboardingState === OnboardingState.AccountConnected &&
          complianceState === ComplianceStates.FULL_ACCESS && (
            <>
              <Button
                tw="mr-[0.5em]"
                shape={ButtonShape.Pill}
                size={ButtonSize.XSmall}
                action={
                  !availableBalance || availableBalance.gt(0)
                    ? ButtonAction.Secondary
                    : ButtonAction.Primary
                }
                onClick={() => {
                  dispatch(
                    openDialog(
                      showNewDepositFlow ? DialogTypes.Deposit2({}) : DialogTypes.Deposit({})
                    )
                  );
                }}
                state={{ isDisabled: !dydxAccounts }}
              >
                {stringGetter({ key: STRING_KEYS.DEPOSIT })}
              </Button>
              <VerticalSeparator />
            </>
          )}

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
  background-color: var(--color-layer-2);
  height: var(--page-currentHeaderHeight);

  grid-area: Header;

  display: grid;
  align-items: stretch;
  grid-auto-flow: column;
  grid-template:
    'Logo . NavBefore . Nav . NavAfter' 100%
    / var(--logo-width) var(--border-width) auto
    var(--border-width) 1fr var(--border-width) auto;

  z-index: 2;

  @media ${breakpoints.tablet} {
    --trigger-height: 3rem;
  }

  @media ${breakpoints.mobile} {
    --navBefore-width: 7rem;
  }

  font-size: 0.9375rem;
`;

const $NavigationScrollBar = styled.div`
  ${layoutMixins.scrollAreaFade}
`;

const $NavigationMenu = styled(NavigationMenu)`
  & {
    --navigationMenu-height: var(--stickyArea-topHeight);
    --navigationMenu-item-height: var(--stickyArea-topHeight);
  }

  ${layoutMixins.scrollArea}
  padding: 0 1rem;
  scroll-padding: 0 0.5rem;
` as typeof NavigationMenu;

const $NavBefore = styled.div`
  ${layoutMixins.row}

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

const $LanguageSelector = styled(LanguageSelector)`
  ${headerMixins.dropdownTrigger}
  --trigger-padding: 0.33rem 0.5rem;
`;
