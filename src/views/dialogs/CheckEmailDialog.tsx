import { useCallback, useState } from 'react';

import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTurnkeyAuth } from '@/providers/TurnkeyAuthProvider';

import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { TimeoutButton } from '@/components/TimeoutButton';

export const CheckEmailDialog = ({
  userEmail,
  onClose,
  setIsOpen,
}: {
  userEmail: string;
  onClose: () => void;
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const stringGetter = useStringGetter();
  const { signInWithOtp } = useTurnkeyAuth();

  const modifiedSetIsOpen = useCallback(
    (isOpen: boolean) => {
      setIsOpen(isOpen);

      if (!isOpen) {
        onClose();
      }
    },
    [onClose, setIsOpen]
  );

  const [resendCounter, setResendCounter] = useState(0);

  const onResend = useCallback(() => {
    signInWithOtp({ userEmail });
    setResendCounter((prev) => prev + 1);
  }, [signInWithOtp, userEmail]);

  return (
    <Dialog
      css={{
        '--dialog-header-paddingBottom': 0,
      }}
      isOpen
      setIsOpen={modifiedSetIsOpen}
      title={<div />}
    >
      <div tw="column justify-items-center gap-0.5 text-center">
        <Icon tw="size-3 text-color-text-2" iconName={IconName.EmailStroke} />
        <span tw="text-color-text-2 font-medium-medium">
          {stringGetter({ key: STRING_KEYS.CHECK_EMAIL_TITLE })}
        </span>
        <p tw="text-color-text-0">{stringGetter({ key: STRING_KEYS.CHECK_EMAIL_DESCRIPTION })}</p>
        <TimeoutButton
          timeoutInSeconds={15}
          tw="mb-0.25 mt-1"
          type={ButtonType.Button}
          action={ButtonAction.SimplePrimary}
          size={ButtonSize.Small}
          shape={ButtonShape.Pill}
          resetCounter={resendCounter}
          onClick={onResend}
        >
          <Icon iconName={IconName.Resend} />
          {stringGetter({ key: STRING_KEYS.RESEND })}
        </TimeoutButton>

        {resendCounter > 0 && (
          <span tw="text-color-text-0 font-small-book">Email resent. Check your inbox.</span>
        )}
      </div>
    </Dialog>
  );
};
