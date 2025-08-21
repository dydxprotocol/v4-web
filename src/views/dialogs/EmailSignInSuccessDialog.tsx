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

export const EmailSignInSuccessDialog = ({
  setIsOpen,
}: {
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const stringGetter = useStringGetter();
  const { emailSignInError, emailSignInStatus } = useTurnkeyAuth();
  const sourceAccount = useAppSelector(getSourceAccount);
  const walletInfo = sourceAccount.walletInfo;

  const isTurnkey = walletInfo?.connectorType === ConnectorType.Turnkey;

  useEffect(() => {
    if (!isTurnkey) {
      setIsOpen(false);
    }
  }, [isTurnkey, setIsOpen]);

  const title = useMemo(
    () =>
      emailSignInStatus === 'loading'
        ? 'Logging in...'
        : emailSignInStatus === 'error'
          ? 'Error logging in'
          : isTurnkey
            ? `Logged in with ${walletInfo.userEmail}`
            : 'Logged in',
    [emailSignInStatus, isTurnkey, walletInfo]
  );

  const description = useMemo(
    () =>
      emailSignInStatus === 'loading'
        ? 'Please wait while we log you in...'
        : emailSignInStatus === 'error'
          ? emailSignInError ?? 'An error occurred while logging in. Please try again.'
          : 'You are now logged in with your email account.',
    [emailSignInStatus, emailSignInError]
  );

  return (
    <Dialog isOpen setIsOpen={setIsOpen} title={<div />}>
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
          state={{
            isLoading: emailSignInStatus === 'loading',
          }}
          onClick={() => setIsOpen(false)}
        >
          {stringGetter({ key: STRING_KEYS.CONTINUE })}
        </Button>
      </div>
    </Dialog>
  );
};
