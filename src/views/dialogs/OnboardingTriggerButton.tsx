import { OnboardingState } from '@/constants/account';
import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useComplianceState } from '@/hooks/useComplianceState';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';

import { getOnboardingState } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { forceOpenDialog } from '@/state/dialogs';

import { track } from '@/lib/analytics/amplitude';

type OnboardingTriggerButtonProps = {
  onClick?: () => void;
};

type StyleProps = {
  className?: string;
  size?: ButtonSize;
};

export const OnboardingTriggerButton = ({
  onClick,
  className,
  size = ButtonSize.Small,
}: OnboardingTriggerButtonProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();
  const openOnboardingDialog = () => {
    onClick?.();
    track(
      AnalyticsEvents.OnboardingTriggerClick({
        state: onboardingState,
      })
    );
    dispatch(forceOpenDialog(DialogTypes.Onboarding()));
  };
  const { disableConnectButton } = useComplianceState();

  const onboardingState = useAppSelector(getOnboardingState);

  return (
    <Button
      className={className}
      action={ButtonAction.Primary}
      size={size}
      state={{
        isDisabled: disableConnectButton,
      }}
      onClick={openOnboardingDialog}
    >
      {
        {
          [OnboardingState.Disconnected]: stringGetter({ key: STRING_KEYS.CONNECT_WALLET }),
          [OnboardingState.WalletConnected]: stringGetter({ key: STRING_KEYS.RECOVER_KEYS }),
        }[onboardingState as string]
      }
    </Button>
  );
};
