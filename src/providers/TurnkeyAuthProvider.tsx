import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { logBonsaiError, logBonsaiInfo } from '@/bonsai/logs';
import { selectIndexerUrl } from '@/bonsai/socketSelectors';
import { useMutation } from '@tanstack/react-query';
import { TurnkeyIndexedDbClient } from '@turnkey/sdk-browser';
import { useTurnkey } from '@turnkey/sdk-react';
import { jwtDecode } from 'jwt-decode';
import { useSearchParams } from 'react-router-dom';

import { AnalyticsEvents, AnalyticsUserProperties } from '@/constants/analytics';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { ConnectorType, WalletType } from '@/constants/wallets';
import {
  GoogleIdTokenPayload,
  LoginMethod,
  SignInBody,
  TurnkeyEmailResponse,
  TurnkeyOAuthResponse,
} from '@/types/turnkey';

import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { appQueryClient } from '@/state/appQueryClient';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { forceOpenDialog, openDialog } from '@/state/dialogs';
import { setTurnkeyEmailOnboardingData, setWalletInfo } from '@/state/wallet';
import { getSourceAccount, getTurnkeyEmailOnboardingData } from '@/state/walletSelectors';

import { identify, track } from '@/lib/analytics/analytics';
import { parseTurnkeyError } from '@/lib/turnkey/turnkeyUtils';

import { useTurnkeyWallet } from './TurnkeyWalletProvider';

const TurnkeyAuthContext = createContext<ReturnType<typeof useTurnkeyAuthContext> | undefined>(
  undefined
);

TurnkeyAuthContext.displayName = 'TurnkeyAuth';

type SignInParams =
  | {
      body: string;
      userEmail: string;
      loginMethod: LoginMethod.Email;
    }
  | {
      body: string;
      userEmail?: string;
      loginMethod: LoginMethod.OAuth;
      providerName: 'google' | 'apple';
    }
  | {
      body: string;
      userEmail?: string;
      loginMethod: LoginMethod.Passkey;
    };

export const TurnkeyAuthProvider = ({ ...props }) => (
  <TurnkeyAuthContext.Provider value={useTurnkeyAuthContext()} {...props} />
);

export const useTurnkeyAuth = () => useContext(TurnkeyAuthContext)!;

const useTurnkeyAuthContext = () => {
  const dispatch = useAppDispatch();
  const stringGetter = useStringGetter();
  const indexerUrl = useAppSelector(selectIndexerUrl);
  const sourceAccount = useAppSelector(getSourceAccount);
  const { indexedDbClient, authIframeClient } = useTurnkey();
  const { dydxAddress: connectedDydxAddress, setWalletFromSignature, selectWallet } = useAccounts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [emailToken, setEmailToken] = useState<string>();
  const [emailSignInError, setEmailSignInError] = useState<string>();
  const [emailSignInStatus, setEmailSignInStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');

  const {
    embeddedPublicKey,
    endTurnkeySession,
    setIsNewTurnkeyUser,
    onboardDydx,
    targetPublicKeys,
    getUploadAddressPayload,
  } = useTurnkeyWallet();

  /* ----------------------------- Upload Address ----------------------------- */

  const { mutateAsync: sendUploadAddressRequest, isPending: isUploadingAddress } = useMutation({
    mutationFn: async ({
      payload,
    }: {
      payload: { dydxAddress: string; signature: string };
    }): Promise<{ success: boolean }> => {
      const body = JSON.stringify(payload);

      const response = await fetch(`${indexerUrl}/v4/turnkey/uploadAddress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body,
      }).then((res) => res.json());

      if (response.errors && Array.isArray(response.errors)) {
        const errorMsg = response.errors.map((e: { msg: string }) => e.msg).join(', ');
        throw new Error(`useTurnkeyAuth: Backend Error: ${errorMsg}`);
      }

      // TODO(turnkey): handle policy returned in response
      return response;
    },
    onError: (error, variables) => {
      track(
        AnalyticsEvents.UploadAddressError({
          dydxAddress: variables.payload.dydxAddress,
          error: error.message,
        })
      );
      logBonsaiError('TurnkeyOnboarding', 'Error posting to upload address', { error });
    },
    onSuccess: () => {
      appQueryClient.invalidateQueries({ queryKey: ['turnkeyWallets'] });
    },
  });

  const uploadAddress = useCallback(
    async ({
      tkClient,
      dydxAddress,
    }: {
      tkClient?: TurnkeyIndexedDbClient;
      dydxAddress: string;
    }) => {
      try {
        logBonsaiInfo('TurnkeyOnboarding', 'Attempting to upload address');

        if (tkClient == null) {
          throw new Error('No tk client provided');
        }

        const payload = await getUploadAddressPayload({ dydxAddress, tkClient });
        await sendUploadAddressRequest({ payload });
      } catch (error) {
        logBonsaiError('TurnkeyOnboarding', 'Error uploading address', { error });
      }
    },
    [getUploadAddressPayload, sendUploadAddressRequest]
  );

  /* ----------------------------- Sign In ----------------------------- */

  const { mutate: sendSignInRequest, status } = useMutation({
    mutationFn: async ({ body, loginMethod, userEmail, ...rest }: SignInParams) => {
      const providerName = 'providerName' in rest ? rest.providerName : undefined;
      setEmailSignInStatus('loading');

      dispatch(
        setWalletInfo({
          connectorType: ConnectorType.Turnkey,
          name: WalletType.Turnkey,
          userEmail,
          providerName,
          loginMethod,
        })
      );

      track(
        AnalyticsEvents.TurnkeyLoginInitiated({
          signinMethod: providerName ?? 'email',
        })
      );

      if (loginMethod === LoginMethod.OAuth) {
        dispatch(forceOpenDialog(DialogTypes.EmailSignInStatus({})));
      }

      const response = await fetch(`${indexerUrl}/v4/turnkey/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body,
      }).then((res) => res.json());

      if (response.errors && Array.isArray(response.errors)) {
        // Handle API-reported errors
        const errorMsg = response.errors.map((e: { msg: string }) => e.msg).join(', ');
        throw new Error(`Backend Error: ${errorMsg}`);
      }

      if (response.dydxAddress === '') {
        setIsNewTurnkeyUser(true);
        identify(AnalyticsUserProperties.IsNewUser(true));
      } else {
        identify(AnalyticsUserProperties.IsNewUser(false));
      }

      if (loginMethod === LoginMethod.OAuth && response.alreadyExists) {
        throw new Error('User has already registered using this email');
      }

      switch (loginMethod) {
        case LoginMethod.OAuth:
          handleOauthResponse({ response });
          break;
        case LoginMethod.Email:
          if (!userEmail) {
            throw new Error('No userEmail provided');
          }

          handleEmailResponse({ userEmail, response });
          setEmailSignInStatus('idle');
          break;
        case LoginMethod.Passkey: // TODO: handle passkey response
        default:
          throw new Error('Current unsupported login method');
      }
    },
    onError: async (error, variables) => {
      selectWallet(undefined);
      setEmailSignInStatus('error');
      const { errorMessage, shouldLog } = parseTurnkeyError(error.message, stringGetter);
      setEmailSignInError(errorMessage);
      await endTurnkeySession();

      if (shouldLog) {
        logBonsaiError('TurnkeyOnboarding', 'Error during sign-in', { error });
      }

      if (variables.loginMethod === LoginMethod.OAuth) {
        const providerName = variables.providerName;
        track(
          AnalyticsEvents.TurnkeyLoginError({
            signinMethod: providerName,
            error: error.message,
          })
        );
      } else if (variables.loginMethod === LoginMethod.Email) {
        track(
          AnalyticsEvents.TurnkeyLoginError({
            signinMethod: 'email',
            error: error.message,
          })
        );
      }
    },
    onSuccess(data, variables) {
      if (variables.loginMethod === LoginMethod.OAuth) {
        const providerName = variables.providerName;
        track(
          AnalyticsEvents.TurnkeyLoginCompleted({
            signinMethod: providerName,
          })
        );
      }
    },
  });

  /* ----------------------------- OAuth Sign In ----------------------------- */

  const signInWithOauth = useCallback(
    async ({
      oidcToken,
      providerName,
    }: {
      oidcToken: string;
      providerName: 'google' | 'apple';
    }) => {
      const decoded = jwtDecode<GoogleIdTokenPayload>(oidcToken);
      const { publicKeyCompressed } = targetPublicKeys ?? {};

      if (!publicKeyCompressed) {
        throw new Error('useTurnkeyAuth: No public key found');
      }

      const inputBody: SignInBody = {
        signinMethod: 'social',
        targetPublicKey: publicKeyCompressed,
        provider: providerName,
        oidcToken,
        userEmail: decoded.email,
      };

      sendSignInRequest({
        body: JSON.stringify(inputBody),
        loginMethod: LoginMethod.OAuth,
        providerName,
        userEmail: decoded.email,
      });
    },
    [sendSignInRequest, targetPublicKeys]
  );

  const handleOauthResponse = useCallback(
    async ({ response }: { response: TurnkeyOAuthResponse }) => {
      const { session, salt, dydxAddress: uploadedDydxAddress } = response;
      if (session == null) {
        throw new Error('useTurnkeyAuth: No session found');
      } else if (salt == null) {
        throw new Error('useTurnkeyAuth: No salt found');
      }

      await indexedDbClient?.loginWithSession(session);
      const derivedDydxAddress = await onboardDydx({
        salt,
        setWalletFromSignature,
        tkClient: indexedDbClient,
      });

      if (uploadedDydxAddress === '' && derivedDydxAddress) {
        try {
          await uploadAddress({ tkClient: indexedDbClient, dydxAddress: derivedDydxAddress });
        } catch (uploadAddressError) {
          if (
            uploadAddressError instanceof Error &&
            !uploadAddressError.message.includes('Dydx address already uploaded')
          ) {
            throw uploadAddressError;
          }
        }
      }

      setEmailSignInStatus('success');
      setEmailSignInError(undefined);
    },
    [onboardDydx, indexedDbClient, setWalletFromSignature, uploadAddress]
  );

  /* ----------------------------- Email Sign In ----------------------------- */

  const handleEmailResponse = useCallback(
    async ({ response, userEmail }: { response: TurnkeyEmailResponse; userEmail: string }) => {
      const { salt, organizationId, userId, dydxAddress: dydxAddressFromResponse } = response;

      if (!salt) {
        throw new Error('No salt provided in response');
      }
      if (!organizationId) {
        throw new Error('No organizationId provided in response');
      }
      if (!userId) {
        throw new Error('No userId provided in response');
      }

      // Store the Turnkey email onboarding data in local storage.
      // This data will be used after the user clicks the Magic link in their email.
      dispatch(
        setTurnkeyEmailOnboardingData({
          salt,
          organizationId,
          userId,
          userEmail,
          dydxAddress: dydxAddressFromResponse,
        })
      );
    },
    [dispatch]
  );

  const turnkeyEmailOnboardingData = useAppSelector(getTurnkeyEmailOnboardingData);

  const handleEmailMagicLink = useCallback(
    async ({ token }: { token: string }) => {
      try {
        setEmailSignInStatus('loading');

        if (authIframeClient == null || indexedDbClient == null) {
          throw new Error('cannot initialize auth without an iframe');
        }

        const { publicKeyCompressed } = targetPublicKeys ?? {};

        if (!publicKeyCompressed) {
          throw new Error('No public key found');
        }

        const { organizationId, dydxAddress: uploadedDydxAddress } =
          turnkeyEmailOnboardingData ?? {};

        if (!organizationId) {
          throw new Error('Organization ID was not found');
        }

        await authIframeClient.injectCredentialBundle(token);

        const sessionResponse = await authIframeClient.stampLogin({
          publicKey: publicKeyCompressed,
          organizationId,
        });

        const { session } = sessionResponse;

        if (!session) {
          throw new Error('No session found');
        }

        await indexedDbClient.loginWithSession(session);
        const derivedDydxAddress = await onboardDydx({
          setWalletFromSignature,
          tkClient: indexedDbClient,
        });

        if (derivedDydxAddress && uploadedDydxAddress === '') {
          try {
            await uploadAddress({ tkClient: indexedDbClient, dydxAddress: derivedDydxAddress });
          } catch (uploadAddressError) {
            if (
              uploadAddressError instanceof Error &&
              !uploadAddressError.message.includes('Dydx address already uploaded')
            ) {
              throw uploadAddressError;
            }
          }
        }

        setEmailSignInStatus('success');

        track(
          AnalyticsEvents.TurnkeyLoginCompleted({
            signinMethod: 'email',
          })
        );
      } catch (error) {
        track(
          AnalyticsEvents.TurnkeyLoginError({
            signinMethod: 'email',
            error: error.message,
          })
        );

        let errorMessage: string | undefined;

        if (error instanceof Error) {
          const { errorMessage: message, shouldLog } = parseTurnkeyError(
            error.message,
            stringGetter
          );

          if (shouldLog) {
            logBonsaiError('TurnkeyOnboarding', 'error handling email magic link', { error });
          }

          errorMessage = message;
        } else {
          logBonsaiError('TurnkeyOnboarding', 'error handling email magic link - unknown', {
            error,
          });
        }

        setEmailSignInError(
          errorMessage ??
            stringGetter({
              key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
              params: { ERROR_MESSAGE: stringGetter({ key: STRING_KEYS.UNKNOWN_ERROR }) },
            })
        );

        setEmailSignInStatus('error');
      } finally {
        // Clear token from state after it has been consumed
        setEmailToken(undefined);
        // Remove the token from the search params after it has been saved to state
        searchParams.delete('token');
        setSearchParams(searchParams);
      }
    },
    [
      authIframeClient,
      indexedDbClient,
      targetPublicKeys,
      turnkeyEmailOnboardingData,
      onboardDydx,
      setWalletFromSignature,
      searchParams,
      setSearchParams,
      stringGetter,
      uploadAddress,
    ]
  );

  const signInWithOtp = useCallback(
    async ({ userEmail }: { userEmail: string }) => {
      try {
        if (authIframeClient == null) {
          throw new Error('cannot initialize auth without an iframe');
        }

        if (embeddedPublicKey == null) {
          throw new Error('No target public key found');
        }

        const inputBody: SignInBody = {
          signinMethod: 'email',
          userEmail,
          targetPublicKey: embeddedPublicKey,
          magicLink: globalThis.location.search
            ? `${globalThis.location.href}&token`
            : `${globalThis.location.href}?token`,
        };

        sendSignInRequest({
          body: JSON.stringify(inputBody),
          loginMethod: LoginMethod.Email,
          userEmail,
        });
      } catch (error) {
        logBonsaiError('TurnkeyOnboarding', 'Error signing in with email', { error });
      }
    },
    [sendSignInRequest, authIframeClient, embeddedPublicKey]
  );

  const resetEmailSignInStatus = useCallback(() => {
    searchParams.delete('token');
    setSearchParams(searchParams);
    setEmailToken(undefined);
    setEmailSignInStatus('idle');
    setEmailSignInError(undefined);
  }, [searchParams, setSearchParams]);

  /* ----------------------------- Side Effects ----------------------------- */

  /**
   * @description Side effect to handle email link containing a token.
   * Kickstarts the onboarding process by saving the token and opening the EmailSignInStatus Dialog
   */
  useEffect(() => {
    const turnkeyOnboardingToken = searchParams.get('token');
    const hasEncryptedSignature = sourceAccount.encryptedSignature != null;

    if (turnkeyOnboardingToken && connectedDydxAddress != null) {
      searchParams.delete('token');
      setSearchParams(searchParams);
    } else if (turnkeyOnboardingToken && !hasEncryptedSignature) {
      setEmailToken(turnkeyOnboardingToken);
      dispatch(openDialog(DialogTypes.EmailSignInStatus({})));
    }
  }, [
    searchParams,
    dispatch,
    sourceAccount,
    connectedDydxAddress,
    resetEmailSignInStatus,
    setSearchParams,
  ]);

  /**
   * @description Side effect triggered after the email token is saved to state.
   * Triggers the onboarding process that manages the sign in status and attempts to sign the onboarding message.
   */
  useEffect(() => {
    if (
      emailToken &&
      targetPublicKeys?.publicKey &&
      authIframeClient &&
      emailSignInStatus === 'idle'
    ) {
      track(AnalyticsEvents.TurnkeyLoginEmailToken({}));
      logBonsaiInfo('TurnkeyOnboarding', 'Attempting to handle email magic link');
      handleEmailMagicLink({ token: emailToken });
    }
  }, [
    emailToken,
    targetPublicKeys?.publicKey,
    authIframeClient,
    handleEmailMagicLink,
    emailSignInStatus,
  ]);

  const needsAddressUpload = useMemo(() => {
    return (
      sourceAccount.walletInfo?.connectorType === ConnectorType.Turnkey &&
      sourceAccount.walletInfo.requiresAddressUpload
    );
  }, [sourceAccount.walletInfo]);

  /* ----------------------------- Return Values----------------------------- */

  return {
    targetPublicKeys,
    emailSignInError,
    emailSignInStatus,
    isLoading: status === 'pending' || emailSignInStatus === 'loading',
    isError: status === 'error' || emailSignInStatus === 'error',
    needsAddressUpload,
    isUploadingAddress,
    signInWithOauth,
    signInWithOtp,
    resetEmailSignInStatus,
  };
};
