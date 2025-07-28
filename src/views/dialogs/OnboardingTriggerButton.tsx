import { OnboardingState } from '@/constants/account';
import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import useOnboardingFlow from '@/hooks/Onboarding/useOnboardingFlow';
import { useSimpleUiEnabled } from '@/hooks/useSimpleUiEnabled';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Button } from '@/components/Button';

type OnboardingTriggerButtonProps = {
  onClick?: () => void;
};

type StyleProps = {
  className?: string;
  size?: ButtonSize;
  shape?: ButtonShape;
};

export const OnboardingTriggerButton = ({
  onClick,
  className,
  shape,
  size = ButtonSize.Small,
}: OnboardingTriggerButtonProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const isSimpleUi = useSimpleUiEnabled();
  const { openOnboardingDialog, onboardingState, isAccountViewOnly, isOnboardingDisabled } =
    useOnboardingFlow({ onClick });

  return (
    <Button
      className={className}
      action={isSimpleUi ? ButtonAction.SimplePrimary : ButtonAction.Primary}
      shape={shape}
      size={size}
      type={ButtonType.Button}
      state={{
        isDisabled: isOnboardingDisabled,
      }}
      onClick={openOnboardingDialog}
    >
      {onboardingState === OnboardingState.AccountConnected
        ? isAccountViewOnly
          ? stringGetter({ key: STRING_KEYS.UNAVAILABLE })
          : stringGetter({ key: STRING_KEYS.CONNECT_WALLET })
        : {
            [OnboardingState.Disconnected]: stringGetter({ key: STRING_KEYS.CONNECT_WALLET }),
            [OnboardingState.WalletConnected]: stringGetter({ key: STRING_KEYS.RECOVER_KEYS }),
          }[onboardingState as string]}
    </Button>
  );
};
