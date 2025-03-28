import { OnboardingState } from '@/constants/account';
import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import useOnboardingFlow from '@/hooks/Onboarding/useOnboardingFlow';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { DropdownMenuItem } from '@/components/DropdownMenu';
import { Icon, IconName } from '@/components/Icon';
import { SimpleUiDropdownMenu } from '@/components/SimpleUiDropdownMenu';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import { isTruthy } from '@/lib/isTruthy';

import ConnectedPortfolioOverview from './ConnectedPortfolioOverview';
import UnconnectedPortfolioOverview from './UnconnectedPortfolioOverview';

const PortfolioOverview = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const { openOnboardingDialog, onboardingState, isOnboardingDisabled, isAccountViewOnly } =
    useOnboardingFlow();

  const menuItems: DropdownMenuItem<string>[] = [
    onboardingState === OnboardingState.Disconnected && {
      value: 'connect-wallet',
      label: stringGetter({ key: STRING_KEYS.CONNECT_WALLET }),
      icon: <Icon iconName={IconName.Wallet} />,
      onSelect: isOnboardingDisabled ? undefined : openOnboardingDialog,
    },
    onboardingState === OnboardingState.AccountConnected &&
      !isAccountViewOnly && {
        value: 'transfers',
        label: stringGetter({ key: STRING_KEYS.TRANSFER }),
        icon: '🚧',
      },
    onboardingState === OnboardingState.AccountConnected &&
      !isAccountViewOnly && {
        value: 'alerts',
        label: stringGetter({ key: STRING_KEYS.ALERTS }),
        icon: '🚧',
      },
    onboardingState === OnboardingState.AccountConnected && {
      value: 'history',
      label: stringGetter({ key: STRING_KEYS.HISTORY }),
      icon: '🚧',
    },
    onboardingState === OnboardingState.AccountConnected && {
      value: 'settings',
      label: stringGetter({ key: STRING_KEYS.SETTINGS }),
      icon: '🚧',
    },
    {
      value: 'help',
      label: stringGetter({ key: STRING_KEYS.HELP }),
      icon: <Icon iconName={IconName.HelpCircle} />,
      onSelect: () => {
        dispatch(openDialog(DialogTypes.Help()));
      },
    },
    onboardingState !== OnboardingState.Disconnected && {
      value: 'disconnect-wallet',
      label: stringGetter({ key: STRING_KEYS.SIGN_OUT }),
      highlightColor: 'destroy' as const,
      icon: <Icon iconName={IconName.Arrow} />,
      onSelect: () => {
        dispatch(openDialog(DialogTypes.DisconnectWallet()));
      },
    },
  ].filter(isTruthy);

  const appMenu = (
    <SimpleUiDropdownMenu
      align="end"
      tw="absolute right-1.25 top-1.25 rounded-[50%]"
      items={menuItems}
    >
      <Button
        tw="size-2 min-w-2 border border-solid border-[color:var(--color-border)]"
        shape={ButtonShape.Circle}
        size={ButtonSize.XSmall}
      >
        <Icon iconName={IconName.Menu} />
      </Button>
    </SimpleUiDropdownMenu>
  );

  return (
    <div tw="flexColumn relative h-20 w-full" className={className}>
      {onboardingState === OnboardingState.Disconnected ? (
        <UnconnectedPortfolioOverview tw="h-full w-full" />
      ) : (
        <ConnectedPortfolioOverview tw="h-full w-full" />
      )}

      {appMenu}
    </div>
  );
};

export default PortfolioOverview;
