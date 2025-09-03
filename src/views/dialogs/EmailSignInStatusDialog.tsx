import { useEffect, useMemo } from 'react';

import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { STRING_KEYS } from '@/constants/localization';
import { ConnectorType } from '@/constants/wallets';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTurnkeyAuth } from '@/providers/TurnkeyAuthProvider';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';

import { useAppSelector } from '@/state/appTypes';
import { getSourceAccount } from '@/state/walletSelectors';

export const EmailSignInStatusDialog = ({
  setIsOpen,
}: {
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const stringGetter = useStringGetter();
  const { emailSignInError, emailSignInStatus, resetEmailSignInStatus } = useTurnkeyAuth();
  const sourceAccount = useAppSelector(getSourceAccount);
  const walletInfo = sourceAccount.walletInfo;

  const isTurnkey = walletInfo?.connectorType === ConnectorType.Turnkey;

  useEffect(() => {
    if (!isTurnkey) {
      setIsOpen(false);
    }

    return () => {
      resetEmailSignInStatus();
    };
  }, [isTurnkey, setIsOpen, resetEmailSignInStatus]);

  // TODO(turnkey): Localization - Pending Design
  const title = useMemo(
    () =>
      ({
        loading: 'Logging in...',
        error: 'Error logging in',
        success: isTurnkey ? `Logged in with ${walletInfo.userEmail}` : 'Logged in',
        idle: 'Logging in...',
      })[emailSignInStatus],
    [emailSignInStatus, isTurnkey, walletInfo]
  );

  // TODO(turnkey): Localization - Pending Design
  const description = useMemo(
    () =>
      ({
        loading: 'Please wait while we log you in...',
        error: emailSignInError ?? 'An error occurred while logging in. Please try again.',
        success: 'You are now logged in with your email account.',
        idle: 'Please wait while we log you in...',
      })[emailSignInStatus],
    [emailSignInStatus, emailSignInError]
  );

  return (
    <Dialog
      isOpen
      css={{
        '--dialog-header-paddingBottom': 0,
      }}
      setIsOpen={setIsOpen}
      title={<div />}
    >
      <div tw="column justify-items-center gap-0.5 text-center">
        <Icon tw="size-3 text-color-text-2" iconName={IconName.EmailStroke} />
        <span tw="text-color-text-2 font-medium-medium">{title}</span>
        <p tw="text-color-text-0">{description}</p>

        <Button
          tw="mt-1"
          type={ButtonType.Button}
          action={ButtonAction.SimplePrimary}
          size={ButtonSize.Small}
          shape={ButtonShape.Pill}
          onClick={() => setIsOpen(false)}
          state={{
            isDisabled: emailSignInStatus === 'loading' || emailSignInStatus === 'idle',
          }}
        >
          {stringGetter({ key: STRING_KEYS.CONTINUE })}
        </Button>
      </div>
    </Dialog>
  );
};
