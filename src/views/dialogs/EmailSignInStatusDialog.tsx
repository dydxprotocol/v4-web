import { useEffect, useMemo } from 'react';

import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { ConnectorType } from '@/constants/wallets';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTurnkeyAuth } from '@/providers/TurnkeyAuthProvider';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { AppTheme } from '@/state/appUiConfigs';
import { getAppTheme } from '@/state/appUiConfigsSelectors';
import { openDialog } from '@/state/dialogs';
import { getSourceAccount } from '@/state/walletSelectors';

import { calc } from '@/lib/do';
import { sleep } from '@/lib/timeUtils';

// TODO(turnkey): Localization
export const EmailSignInStatusDialog = ({
  setIsOpen,
}: {
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const { emailSignInError, emailSignInStatus, isFirstSignIn, resetEmailSignInStatus } =
    useTurnkeyAuth();
  const sourceAccount = useAppSelector(getSourceAccount);
  const walletInfo = sourceAccount.walletInfo;
  const appTheme = useAppSelector(getAppTheme);
  const isLightMode = appTheme === AppTheme.Light;
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

  const icon = useMemo(() => {
    const innerIcon = calc(() => {
      const iconStyles =
        emailSignInStatus === 'success'
          ? {
              width: '1rem',
              height: '1rem',
              minWidth: '1rem',
              minHeight: '1rem',
            }
          : {
              width: '2rem',
              height: '2rem',
              minWidth: '2rem',
              minHeight: '2rem',
            };

      if (isTurnkey) {
        const { providerName } = walletInfo;

        if (providerName === 'google') {
          return (
            <Icon
              tw="flex"
              css={{
                ...iconStyles,
                marginRight: ['loading', 'idle'].includes(emailSignInStatus) ? '-1px' : '0',
              }}
              iconName={IconName.Google}
            />
          );
        }

        if (providerName === 'apple') {
          return (
            <Icon
              tw="flex size-2"
              css={{
                ...iconStyles,
                marginLeft: ['loading', 'idle'].includes(emailSignInStatus) ? '-1px' : '0',
              }}
              iconName={isLightMode ? IconName.Apple : IconName.AppleLight}
            />
          );
        }
      }

      return <Icon tw="flex text-color-layer-7" css={iconStyles} iconName={IconName.Email} />;
    });

    switch (emailSignInStatus) {
      case 'idle':
      case 'loading':
        return (
          <div tw="relative flex size-[4.5rem] items-center justify-center p-0.75">
            <LoadingSpinner
              id="email-sign-in-status-dialog-loading"
              size="100%"
              strokeWidth="2"
              tw="absolute left-0 top-0 flex h-full w-full items-center justify-center text-color-accent"
            />
            {innerIcon}
          </div>
        );
      case 'error':
        return (
          <div tw="relative flex size-[4.5rem] items-center justify-center rounded-[50%] bg-color-gradient-error">
            <Icon tw="flex size-3 text-color-error" iconName={IconName.ErrorExclamation} />
          </div>
        );
      case 'success':
      default:
        return innerIcon;
    }
  }, [emailSignInStatus, isTurnkey, walletInfo, isLightMode]);

  const welcomeContent = isTurnkey && (
    <div tw="flexColumn z-[1] items-center gap-0.5">
      <Icon
        tw="flex size-3 text-color-text-2"
        css={{ transform: 'scaleX(-1)' }}
        iconName={IconName.RewardStars}
      />
      <div>
        <span
          tw="font-large-bold"
          css={{
            background:
              'linear-gradient(to bottom right, var(--color-text-2), var(--color-accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {isFirstSignIn ? stringGetter({ key: STRING_KEYS.WELCOME_DYDX }) : 'Welcome back'}
        </span>
      </div>

      <p tw="text-color-text-0">You are now signed in with</p>
      <div tw="row gap-0.5 rounded-[0.75rem] border border-solid border-color-layer-4 bg-color-layer-3 px-1 py-0.5">
        {icon} <span>{walletInfo.userEmail}</span>
      </div>
      <Button
        tw="mt-1 w-full"
        type={ButtonType.Button}
        action={ButtonAction.SimplePrimary}
        onClick={async () => {
          setIsOpen(false);

          if (isFirstSignIn) {
            await sleep(0);
            dispatch(openDialog(DialogTypes.Deposit2({})));
          }
        }}
      >
        {isFirstSignIn
          ? 'Deposit and Start Trading →'
          : stringGetter({ key: STRING_KEYS.CONTINUE })}
      </Button>
    </div>
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
      {emailSignInStatus === 'success' ? (
        <>
          <div
            tw="absolute inset-0 left-[50%] top-0 h-[222px] w-full opacity-75"
            css={{
              transform: 'translateX(-50%) scale(1.25)',
              background:
                'url("/dots-background.svg"), radial-gradient(circle, var(--color-layer-4), transparent 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          {welcomeContent}
        </>
      ) : (
        <div tw="column justify-items-center gap-0.5 text-center">
          {icon}
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
      )}
    </Dialog>
  );
};
