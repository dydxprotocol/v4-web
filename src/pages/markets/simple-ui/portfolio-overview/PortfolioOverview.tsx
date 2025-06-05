import { useNavigate } from 'react-router-dom';

import { OnboardingState } from '@/constants/account';
import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { AppRoute } from '@/constants/routes';

import { useNotifications } from '@/hooks/useNotifications';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { UnseenIndicator } from '@/views/Lists/Alerts/UnseenIndicator';

import { getOnboardingState } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setIsUserMenuOpen } from '@/state/dialogs';

import { ConnectedPortfolioOverview } from './ConnectedPortfolioOverview';
import { UnconnectedPortfolioOverview } from './UnconnectedPortfolioOverview';

export const PortfolioOverview = ({ className }: { className?: string }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const onboardingState = useAppSelector(getOnboardingState);
  const { hasUnreadNotifications } = useNotifications();

  const openUserMenu = () => {
    dispatch(setIsUserMenuOpen(true));
  };

  const appMenu = (
    <div tw="absolute right-1.25 top-1.25 flex gap-0.5">
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
      <Button
        tw="size-2.25 min-w-2.25 rounded-[50%] border border-solid border-[color:var(--color-border)]"
        shape={ButtonShape.Circle}
        size={ButtonSize.XSmall}
        onClick={openUserMenu}
      >
        <Icon iconName={IconName.Menu} />
      </Button>
    </div>
  );

  return (
    <div tw="flexColumn relative h-[12.5rem] w-full" className={className}>
      {onboardingState !== OnboardingState.AccountConnected ? (
        <UnconnectedPortfolioOverview tw="h-full w-full" />
      ) : (
        <ConnectedPortfolioOverview tw="h-full w-full" />
      )}

      {appMenu}
    </div>
  );
};
