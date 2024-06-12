import { OnboardingState } from '@/constants/account';
import { ButtonAction, ButtonSize } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';

import { getOnboardingState } from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { forceOpenDialog } from '@/state/dialogs';

type StyleProps = {
  size?: ButtonSize;
};

export const OnboardingTriggerButton = ({ size = ButtonSize.Small }: StyleProps) => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  const onboardingState = useAppSelector(getOnboardingState);

  return (
    <Button
      action={ButtonAction.Primary}
      size={size}
      onClick={() => dispatch(forceOpenDialog(DialogTypes.Onboarding()))}
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
