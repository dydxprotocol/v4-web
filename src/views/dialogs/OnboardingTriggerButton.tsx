import styled from 'styled-components';

import { OnboardingState } from '@/constants/account';
import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import useOnboardingFlow from '@/hooks/Onboarding/useOnboardingFlow';
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
  const { openOnboardingDialog, onboardingState, isAccountViewOnly, isOnboardingDisabled } =
    useOnboardingFlow({ onClick });

  return (
    <$SignInButton
      className={className}
      action={ButtonAction.SimplePrimary}
      shape={shape ?? ButtonShape.Pill}
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
          : stringGetter({ key: STRING_KEYS.SIGN_IN_TITLE })
        : {
            [OnboardingState.Disconnected]: stringGetter({ key: STRING_KEYS.SIGN_IN_TITLE }),
            [OnboardingState.WalletConnected]: stringGetter({ key: STRING_KEYS.RECOVER_KEYS }),
          }[onboardingState as string]}
    </$SignInButton>
  );
};

const $SignInButton = styled(Button)`
  --button-textColor: var(--color-white) !important;
  --button-padding: 0.5rem 1.5rem;

  span {
    color: var(--color-white) !important;
  }
`;
