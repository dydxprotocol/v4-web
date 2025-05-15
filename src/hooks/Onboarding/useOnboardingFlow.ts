import { OnboardingState } from '@/constants/account';
import { AnalyticsEvents } from '@/constants/analytics';
import { DialogTypes } from '@/constants/dialogs';

import { calculateIsAccountViewOnly } from '@/state/accountCalculators';
import { getOnboardingState } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { forceOpenDialog } from '@/state/dialogs';

import { track } from '@/lib/analytics/analytics';

import { useComplianceState } from '../useComplianceState';

const useOnboardingFlow = ({ onClick }: { onClick?: () => void } = {}) => {
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
  const isAccountViewOnly = useAppSelector(calculateIsAccountViewOnly);

  return {
    openOnboardingDialog,
    disableConnectButton,
    onboardingState,
    isAccountViewOnly,
    isOnboardingDisabled:
      disableConnectButton ||
      (onboardingState === OnboardingState.AccountConnected && isAccountViewOnly),
  };
};

export default useOnboardingFlow;
