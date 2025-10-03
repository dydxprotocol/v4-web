import { useCallback, useMemo, useRef } from 'react';

import { ButtonAction, ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { ConnectorType } from '@/constants/wallets';
import { LoginMethod } from '@/types/turnkey';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTurnkeyAuth } from '@/providers/TurnkeyAuthProvider';
import { useTurnkeyWallet } from '@/providers/TurnkeyWalletProvider';

import { Button } from '@/components/Button';
import { Dialog } from '@/components/Dialog';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpinner } from '@/components/Loading/LoadingSpinner';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { AppTheme } from '@/state/appUiConfigs';
import { getAppTheme, getChartDotBackground } from '@/state/appUiConfigsSelectors';
import { openDialog } from '@/state/dialogs';
import { getSourceAccount, getTurnkeyEmailOnboardingData } from '@/state/walletSelectors';

import { calc } from '@/lib/do';
import { sleep } from '@/lib/timeUtils';

export const EmailSignInStatusDialog = ({
  setIsOpen,
}: {
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const { isNewTurnkeyUser } = useTurnkeyWallet();
  const { emailSignInError, emailSignInStatus, resetEmailSignInStatus } = useTurnkeyAuth();
  const sourceAccount = useAppSelector(getSourceAccount);
  const walletInfo = sourceAccount.walletInfo;
  const appTheme = useAppSelector(getAppTheme);
  const isLightMode = appTheme === AppTheme.Light;
  const isTurnkey = walletInfo?.connectorType === ConnectorType.Turnkey;
  const chartDotBackground = useAppSelector(getChartDotBackground);
  const turnkeyEmailOnboardingData = useAppSelector(getTurnkeyEmailOnboardingData);
  const hasNoUploadedAddress =
    walletInfo?.connectorType === ConnectorType.Turnkey &&
    walletInfo.loginMethod === LoginMethod.Email &&
    !turnkeyEmailOnboardingData?.dydxAddress;

  // Use cached turnkeyEmailOnboardingData to determine if we should show the welcome content
  // turnkeyEmailOnboardingData is cleared after handling, so we only want initial state
  const showWelcomeContentRef = useRef(hasNoUploadedAddress || isNewTurnkeyUser);
  const showWelcomeContent = showWelcomeContentRef.current;

  const setIsOpenInner = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        resetEmailSignInStatus();
      }

      setIsOpen(isOpen);
    },
    [setIsOpen, resetEmailSignInStatus]
  );

  const title = useMemo(
    () =>
      ({
        loading: stringGetter({ key: STRING_KEYS.LOGGING_IN }),
        error: stringGetter({ key: STRING_KEYS.ERROR_LOGGING_IN }),
        success: isTurnkey
          ? stringGetter({
              key: STRING_KEYS.LOGGED_IN_WITH,
              params: {
                EMAIL: walletInfo.userEmail,
              },
            })
          : stringGetter({ key: STRING_KEYS.LOGGED_IN }),
        idle: stringGetter({ key: STRING_KEYS.LOGGING_IN }),
      })[emailSignInStatus],
    [emailSignInStatus, isTurnkey, walletInfo, stringGetter]
  );

  const description = useMemo(
    () =>
      ({
        loading: stringGetter({ key: STRING_KEYS.PLEASE_WAIT_LOGIN }),
        error: emailSignInError ?? stringGetter({ key: STRING_KEYS.ERROR_WHILE_LOGGING_IN }),
        success: stringGetter({ key: STRING_KEYS.EMAIL_LOGIN_SUCCESS }),
        idle: stringGetter({ key: STRING_KEYS.PLEASE_WAIT_LOGIN }),
      })[emailSignInStatus],
    [emailSignInStatus, emailSignInError, stringGetter]
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
          {showWelcomeContent
            ? stringGetter({ key: STRING_KEYS.WELCOME_DYDX })
            : stringGetter({ key: STRING_KEYS.WELCOME_BACK })}
        </span>
      </div>

      <p tw="text-color-text-0">You are now signed in with</p>
      <div tw="row gap-0.5 rounded-[0.75rem] border border-solid border-color-layer-4 bg-color-layer-3 px-1 py-0.5">
        {icon}{' '}
        <span>{walletInfo.providerName === 'apple' ? 'Apple ID' : walletInfo.userEmail}</span>
      </div>
      <Button
        tw="mt-1 w-full"
        type={ButtonType.Button}
        action={ButtonAction.SimplePrimary}
        onClick={async () => {
          setIsOpen(false);

          if (showWelcomeContent) {
            await sleep(0);
            dispatch(openDialog(DialogTypes.Deposit2({})));
          }
        }}
      >
        {showWelcomeContent
          ? `${stringGetter({ key: STRING_KEYS.DEPOSIT_AND_TRADE })} →`
          : stringGetter({ key: STRING_KEYS.CONTINUE })}
      </Button>
    </div>
  );

  return (
    <Dialog
      isOpen
      css={{
        '--dialog-header-paddingBottom': 0,
        '--dialog-header-backgroundColor': 'transparent',
      }}
      setIsOpen={setIsOpenInner}
      title={<div />}
    >
      {emailSignInStatus === 'success' ? (
        <>
          <div
            tw="absolute inset-0 left-[50%] top-0 h-[222px] w-full opacity-75"
            css={{
              transform: 'translateX(-50%) scale(1.25)',
              background: `url("${chartDotBackground}"), radial-gradient(circle, var(--color-layer-4), transparent 100%)`,
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

          {emailSignInStatus === 'error' && (
            <Button
              tw="mt-1"
              type={ButtonType.Button}
              action={ButtonAction.SimplePrimary}
              size={ButtonSize.Small}
              shape={ButtonShape.Pill}
              onClick={() => setIsOpen(false)}
            >
              {stringGetter({ key: STRING_KEYS.CONTINUE })}
            </Button>
          )}
        </div>
      )}
    </Dialog>
  );
};
