import { useCallback, useState } from 'react';

import { AnalyticsEvents } from '@/constants/analytics';
import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTurnkeyAuth } from '@/providers/TurnkeyAuthProvider';

import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { TimeoutButton } from '@/components/TimeoutButton';

import { track } from '@/lib/analytics/analytics';

export const CheckEmailDialog = ({
  userEmail,
  onClose,
  setIsOpen,
}: {
  userEmail: string;
  onClose?: () => void;
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const stringGetter = useStringGetter();
  const { signInWithOtp } = useTurnkeyAuth();

  const modifiedSetIsOpen = useCallback(
    (isOpen: boolean) => {
      setIsOpen(isOpen);

      if (!isOpen) {
        onClose?.();
      }
    },
    [onClose, setIsOpen]
  );

  const [resendCounter, setResendCounter] = useState(0);

  const onResend = useCallback(() => {
    track(AnalyticsEvents.TurnkeyResendEmailClick({}));
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
        <Icon tw="size-4 text-color-layer-7" iconName={IconName.Email} />
        <span tw="text-color-text-2 font-medium-medium">
          {stringGetter({ key: STRING_KEYS.CHECK_EMAIL_TITLE })}
        </span>
        <p tw="text-color-text-0">
          {stringGetter({
            key: STRING_KEYS.OPEN_SENT_MAGIC_LINK,
            params: {
              EMAIL: <span tw="text-color-text-1">&apos;{userEmail}&apos;</span>,
            },
          })}
        </p>
        <TimeoutButton
          timeoutInSeconds={15}
          tw="mb-0.25 mt-0.25"
          css={{
            '--button-height': '2.375rem',
            '--button-font': 'var(--font-base-medium)',
          }}
          type={ButtonType.Button}
          action={ButtonAction.AccentFaded}
          size={ButtonSize.Base}
          shape={ButtonShape.Pill}
          resetCounter={resendCounter}
          onClick={onResend}
          renderCustomCountdown={({ secondsLeft }) => (
            <span tw="row mb-0.25 mt-0.25 h-[2.375rem] gap-0.25 text-color-accent font-base-medium">
              <Icon tw="size-1" iconName={IconName.Clock} />
              {stringGetter({
                key: STRING_KEYS.WAIT_TO_RESEND_MAGIC_LINK,
                params: {
                  SECONDS_LEFT: Math.ceil(secondsLeft),
                },
              })}
            </span>
          )}
        >
          <Icon tw="size-1" iconName={IconName.Resend} />
          Resend link
        </TimeoutButton>

        {resendCounter > 0 ? (
          <span tw="h-1.25 text-color-text-0 font-base-book">
            {stringGetter({
              key: STRING_KEYS.SIGN_IN_EMAIL_RESENT,
              params: {
                EMAIL: <span tw="text-color-text-1">&apos;{userEmail}&apos;</span>,
              },
            })}
          </span>
        ) : (
          <div tw="h-1.25 w-full" />
        )}

        <Icon tw="mt-[3.5rem] w-[9rem] text-color-layer-7" iconName={IconName.PoweredByTurnkey} />
      </div>
    </Dialog>
  );
};
