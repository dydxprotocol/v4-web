import { OnboardingState } from '@/constants/account';
import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import useOnboardingFlow from '@/hooks/Onboarding/useOnboardingFlow';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { SimpleUiDropdownMenu } from '@/components/SimpleUiDropdownMenu';

import { useAppDispatch } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';

import ConnectedPortfolioOverview from './portfolio-overview/ConnectedPortfolioOverview';
import UnconnectedPortfolioOverview from './portfolio-overview/UnconnectedPortfolioOverview';

const PortfolioOverview = () => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const { openOnboardingDialog, onboardingState, isOnboardingDisabled } = useOnboardingFlow();

  const appMenu = (
    <SimpleUiDropdownMenu
      tw="absolute right-1.25 top-1.25 rounded-[50%]"
      items={[
        ...(onboardingState === OnboardingState.Disconnected
          ? [
              {
                value: 'connect-wallet',
                label: stringGetter({ key: STRING_KEYS.CONNECT_WALLET }),
                icon: <Icon iconName={IconName.Wallet} />,
                onSelect: isOnboardingDisabled ? undefined : openOnboardingDialog,
              },
            ]
          : []),
        {
          value: 'settings',
          label: stringGetter({ key: STRING_KEYS.SETTINGS }),
          icon: <Icon iconName={IconName.Settings} />,
        },
        {
          value: 'help',
          label: stringGetter({ key: STRING_KEYS.HELP }),
          icon: <Icon iconName={IconName.HelpCircle} />,
          onSelect: () => {
            dispatch(openDialog(DialogTypes.Help()));
          },
        },
        ...(onboardingState !== OnboardingState.Disconnected
          ? [
              {
                value: 'disconnect-wallet',
                label: stringGetter({ key: STRING_KEYS.SIGN_OUT }),
                highlightColor: 'destroy' as const,
                icon: <Icon iconName={IconName.Arrow} />,
                onSelect: () => {
                  dispatch(openDialog(DialogTypes.DisconnectWallet()));
                },
              },
            ]
          : []),
      ]}
    >
      <Button
        tw="size-2 border border-solid border-[color:var(--color-border)]"
        shape={ButtonShape.Circle}
        size={ButtonSize.XSmall}
      >
        <Icon iconName={IconName.Menu} />
      </Button>
    </SimpleUiDropdownMenu>
  );

  return (
    <div tw="flexColumn h-full">
      {onboardingState === OnboardingState.Disconnected ? (
        <UnconnectedPortfolioOverview tw="h-20" />
      ) : (
        <ConnectedPortfolioOverview tw="h-20" />
      )}

      {appMenu}
    </div>
  );
};

export default PortfolioOverview;
