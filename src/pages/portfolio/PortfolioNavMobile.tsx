import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { OnboardingState } from '@/constants/account';
import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useAccounts } from '@/hooks/useAccounts';
import { useNotifications } from '@/hooks/useNotifications';
import { useStringGetter } from '@/hooks/useStringGetter';

import { LogoShortIcon } from '@/icons/logo-short';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { DropdownMenu } from '@/components/DropdownMenu';
import { Icon, IconName } from '@/components/Icon';
import { UnseenIndicator } from '@/views/Lists/Alerts/UnseenIndicator';

import { getOnboardingState } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { openDialog, setIsUserMenuOpen } from '@/state/dialogs';

import { truncateAddress } from '@/lib/wallet';

export const PortfolioNavMobile = () => {
  const stringGetter = useStringGetter();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const onboardingState = useAppSelector(getOnboardingState);
  const { hasUnreadNotifications } = useNotifications();
  const { dydxAddress } = useAccounts();

  const openUserMenu = () => {
    dispatch(setIsUserMenuOpen(true));
  };

  return (
    <$MobilePortfolioHeader>
      <$LogoLink to="/">
        <LogoShortIcon />
      </$LogoLink>

      <div tw="flex items-center gap-0.5">
        {onboardingState === OnboardingState.AccountConnected && (
          <Button
            tw="relative size-2.25 min-w-2.25 rounded-[50%] border border-solid border-[color:var(--color-border)]"
            shape={ButtonShape.Circle}
            size={ButtonSize.XSmall}
            onClick={() => {
              navigate(AppRoute.Alerts);
            }}
          >
            <Icon iconName={IconName.BellStroked} />
            {hasUnreadNotifications && (
              <UnseenIndicator tw="absolute right-[-2px] top-0 size-0.875 min-h-0.875 min-w-0.875 border-2 border-solid border-[color:var(--color-layer-3)]" />
            )}
          </Button>
        )}

        <DropdownMenu
          items={[
            {
              label: (
                <div tw="flex w-9 items-center justify-between gap-0.25">
                  <p>{truncateAddress(dydxAddress)}</p>
                  <Icon iconName={IconName.Copy} />
                </div>
              ),
              value: 'copy',
              onSelect: () => navigator.clipboard.writeText(dydxAddress ?? ''),
            },
            {
              label: (
                <div tw="flex w-9 items-center justify-between gap-0.25 text-color-negative">
                  <p>{stringGetter({ key: STRING_KEYS.SIGN_OUT })}</p>
                  <Icon iconName={IconName.Close} />
                </div>
              ),
              value: 'sign-out',
              onSelect: () => dispatch(openDialog(DialogTypes.DisconnectWallet())),
            },
          ]}
        >
          <Icon iconName={IconName.Wallet3} />
          {truncateAddress(dydxAddress)}
        </DropdownMenu>

        <Button
          tw="size-2.25 min-w-2.25 rounded-[50%] border border-solid border-[color:var(--color-border)]"
          shape={ButtonShape.Circle}
          size={ButtonSize.XSmall}
          onClick={openUserMenu}
        >
          <Icon iconName={IconName.Menu} />
        </Button>
      </div>
    </$MobilePortfolioHeader>
  );
};

const $MobilePortfolioHeader = styled.div`
  ${layoutMixins.stickyHeader}
  ${layoutMixins.withOuterBorder}
  ${layoutMixins.row}

  padding: 1rem;
  background-color: var(--color-layer-2);
  z-index: 2;

  justify-content: space-between;
`;

const $LogoLink = styled(Link)`
  display: flex;
  align-self: stretch;

  > svg {
    margin: auto;
    width: 1.6rem;
    height: 1.6rem;
  }
`;
