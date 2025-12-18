import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { OnboardingState } from '@/constants/account';
import { ButtonAction, ButtonShape, ButtonSize } from '@/constants/buttons';
import { ComplianceStates } from '@/constants/compliance';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useAccounts } from '@/hooks/useAccounts';
import { useEnableSpot } from '@/hooks/useEnableSpot';
import { usePerpetualsComplianceState } from '@/hooks/usePerpetualsComplianceState';
import { useStringGetter } from '@/hooks/useStringGetter';
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
import { AccountMenu } from '@/views/menus/AccountMenu/AccountMenu';
import { LanguageSelector } from '@/views/menus/LanguageSelector';
import { NotificationsMenu } from '@/views/menus/NotificationsMenu';

import { getOnboardingState } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { AppTheme, setAppThemeSetting } from '@/state/appUiConfigs';
import { getAppTheme, getHasSeenLaunchIncentives } from '@/state/appUiConfigsSelectors';
import { openDialog } from '@/state/dialogs';

import { isTruthy } from '@/lib/isTruthy';

export const HeaderDesktop = () => {
  const stringGetter = useStringGetter();
  const { documentation } = useURLConfigs();
  const dispatch = useAppDispatch();
  const { dydxAccounts } = useAccounts();
  const onboardingState = useAppSelector(getOnboardingState);
  const { complianceState } = usePerpetualsComplianceState();
  const isSpotEnabled = useEnableSpot();
  const currentTheme = useAppSelector(getAppTheme);

  const hasSeenLaunchIncentives = useAppSelector(getHasSeenLaunchIncentives);

  const handleThemeToggle = () => {
    const newTheme = currentTheme === AppTheme.Dark ? AppTheme.Light : AppTheme.Dark;
    dispatch(setAppThemeSetting(newTheme));
  };

  const navItems = [
    {
      group: 'navigation',
      items: [
        {
          value: 'TRADE',
          label: stringGetter({ key: STRING_KEYS.TRADE }),
          href: AppRoute.Trade,
        },
        isSpotEnabled && {
          value: 'SPOT',
          label: stringGetter({ key: STRING_KEYS.SPOT }),
          href: AppRoute.Spot,
        },
        {
          value: 'MARKETS',
          label: stringGetter({ key: STRING_KEYS.MARKETS }),
          href: AppRoute.Markets,
        },
        onboardingState === OnboardingState.AccountConnected && {
          value: 'PORTFOLIO',
          label: stringGetter({ key: STRING_KEYS.PORTFOLIO }),
          href: AppRoute.Portfolio,
        },
        {
          value: 'REWARDS',
          label: stringGetter({ key: STRING_KEYS.REWARDS }),
          href: AppRoute.Rewards,
          slotAfter: !hasSeenLaunchIncentives && (
            <div tw="h-[0.4375rem] w-[0.4375rem] rounded-[50%] bg-color-accent" />
          ),
        },
        {
          value: 'MORE',
          label: stringGetter({ key: STRING_KEYS.MORE }),
          subitems: [
            {
              value: 'VAULT',
              slotBefore: <Icon iconName={IconName.Bank} />,
              label: stringGetter({ key: STRING_KEYS.MEGAVAULT }),
              href: AppRoute.Vault,
            },
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

      <VerticalSeparator transparent />

      <$NavBefore>
        <$LanguageSelector sideOffset={16}>
          <Icon iconName={IconName.Translate} size="1.25em" />
        </$LanguageSelector>
        <VerticalSeparator transparent />
      </$NavBefore>

      <VerticalSeparator transparent />

      <$NavigationScrollBar>
        <$NavigationMenu items={navItems} orientation="horizontal" dividerStyle="underline" />
      </$NavigationScrollBar>

      <div role="separator" />

      <$NavAfter>
        {onboardingState === OnboardingState.AccountConnected &&
          complianceState === ComplianceStates.FULL_ACCESS && (
            <$DepositButton
              tw="mr-[0.5em]"
              shape={ButtonShape.Pill}
              size={ButtonSize.XSmall}
              action={ButtonAction.SimplePrimary}
              onClick={() => {
                dispatch(openDialog(DialogTypes.Deposit2({})));
              }}
              state={{ isDisabled: !dydxAccounts }}
            >
              <span tw="font-small-bold">{stringGetter({ key: STRING_KEYS.DEPOSIT })}</span>
            </$DepositButton>
          )}

        {onboardingState === OnboardingState.AccountConnected && (
          <NotificationsMenu
            slotTrigger={
              <$IconButton
                shape={ButtonShape.Rectangle}
                iconComponent={BellStrokeIcon as React.ElementType}
              />
            }
          />
        )}

        <$ThemeToggleButton
          shape={ButtonShape.Rectangle}
          iconName={currentTheme === AppTheme.Dark ? IconName.Sun : IconName.Moon}
          onClick={handleThemeToggle}
        />

        <$AccountMenuWrapper>
          <AccountMenu />
        </$AccountMenuWrapper>
      </$NavAfter>
    </$Header>
  );
};
const $Header = styled.header`
  --header-horizontal-padding-mobile: 0.5rem;
  --trigger-height: 2rem;
  --logo-width: 12rem;

  ${layoutMixins.container}
  backdrop-filter: none;
  background-color: 'transparent';
  border-radius: 0.75rem;
  overflow: visible;
  height: var(--page-currentHeaderHeight);
  margin-top: 1.75rem;
  margin-bottom: 1rem;
  width: 100%;
  /* max-width: 100%; */
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;

  grid-area: Header;

  /* Override border from withOuterAndInnerBorders */
  --border-color: transparent;
  box-shadow: none;

  display: grid;
  align-items: stretch;
  grid-auto-flow: column;
  grid-template:
    'Logo . NavBefore . Nav . NavAfter' 100%
    / var(--logo-width) var(--border-width) auto
    var(--border-width) 1fr var(--border-width) auto;

  z-index: 2;

  &:before {
    border-radius: 0.75rem;
  }

  @media ${breakpoints.tablet} {
    --trigger-height: 3rem;
  }

  @media ${breakpoints.mobile} {
    --navBefore-width: 7rem;
  }

  font-size: 0.9375rem;
`;

const $NavigationScrollBar = styled.div`
  /* ${layoutMixins.scrollAreaFade} */
`;

const $NavigationMenu = styled(NavigationMenu)`
  & {
    --navigationMenu-height: var(--page-header-height);
    --navigationMenu-item-height: var(--page-header-height);
  }

  ${layoutMixins.scrollArea}
  background-color: transparent;
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

  > div {
    margin: auto;
    width: auto;
    height: 85%;
  }
`;

const $NavAfter = styled.div`
  ${layoutMixins.row}

  justify-self: end;
  padding: 0 0.75rem;

  gap: 1rem;

  a {
    color: var(--color-text-1);
  }
`;

const $IconButton = styled(IconButton)<{ size?: string }>`
  ${headerMixins.button}
  --button-border: none;
  --button-icon-size: 1.15rem;
  --button-padding: 0 0.5em;
`;

const $ThemeToggleButton = styled(IconButton)`
  ${headerMixins.button}
  --button-border: none;
  --button-icon-size: 1.25em;
  --button-padding: 0.33rem 0.5rem;
`;

const $LanguageSelector = styled(LanguageSelector)`
  ${headerMixins.dropdownTrigger}
  --trigger-padding: 0.33rem 0.5rem;
`;

const $DepositButton = styled(Button)`
  --button-textColor: var(--color-white) !important;
  --button-padding: 0.5rem 1.5rem;

  span {
    color: var(--color-white) !important;
  }
`;

const $AccountMenuWrapper = styled.div`
  display: flex;
  align-items: center;

  > * {
    transform: scale(1.15);
    transform-origin: center;
  }
`;
