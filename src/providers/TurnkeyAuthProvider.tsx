import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { logBonsaiError } from '@/bonsai/logs';
import { selectIndexerUrl } from '@/bonsai/socketSelectors';
import { useMutation } from '@tanstack/react-query';
import { TurnkeyIndexedDbClient } from '@turnkey/sdk-browser';
import { useTurnkey } from '@turnkey/sdk-react';
import { jwtDecode } from 'jwt-decode';
import { useSearchParams } from 'react-router-dom';

import { DialogTypes } from '@/constants/dialogs';
import { ConnectorType, WalletType } from '@/constants/wallets';
import {
  GoogleIdTokenPayload,
  LoginMethod,
  SignInBody,
  TurnkeyEmailResponse,
  TurnkeyOAuthResponse,
} from '@/types/turnkey';

import { useAccounts } from '@/hooks/useAccounts';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { forceOpenDialog, openDialog } from '@/state/dialogs';
import {
  clearTurnkeyEmailOnboardingData,
  setRequiresAddressUpload,
  setTurnkeyEmailOnboardingData,
  setWalletInfo,
} from '@/state/wallet';
import { getSourceAccount, getTurnkeyEmailOnboardingData } from '@/state/walletSelectors';

import { useTurnkeyWallet } from './TurnkeyWalletProvider';

const TurnkeyAuthContext = createContext<ReturnType<typeof useTurnkeyAuthContext> | undefined>(
  undefined
);

TurnkeyAuthContext.displayName = 'TurnkeyAuth';

export const TurnkeyAuthProvider = ({ ...props }) => (
  <TurnkeyAuthContext.Provider value={useTurnkeyAuthContext()} {...props} />
);

export const useTurnkeyAuth = () => useContext(TurnkeyAuthContext)!;

const useTurnkeyAuthContext = () => {
  const dispatch = useAppDispatch();
  const indexerUrl = useAppSelector(selectIndexerUrl);
  const sourceAccount = useAppSelector(getSourceAccount);
  const { indexedDbClient, authIframeClient } = useTurnkey();
  const { dydxAddress, setWalletFromSignature, selectWallet } = useAccounts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [emailToken, setEmailToken] = useState<string>();
  const [emailSignInError, setEmailSignInError] = useState<string>();
  const [emailSignInStatus, setEmailSignInStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');

  const { embeddedPublicKey, onboardDydx, targetPublicKeys, getUploadAddressPayload } =
    useTurnkeyWallet();

  /* ----------------------------- Sign In ----------------------------- */

  const { mutate: sendSignInRequest, status } = useMutation({
    mutationFn: async ({
      body,
      loginMethod,
      providerName,
      userEmail,
    }: {
      body: string;
      loginMethod: LoginMethod;
      providerName?: string;
      userEmail?: string;
    }) => {
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
        throw new Error(`useTurnkeyAuth: Backend Error: ${errorMsg}`);
      }

      if (response.dydxAddress === '') {
        dispatch(setRequiresAddressUpload(true));
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
          break;
        case LoginMethod.Passkey: // TODO: handle passkey response
        default:
          throw new Error('Current unsupported login method');
      }
    },
    onError: (error) => {
      selectWallet(undefined);
      logBonsaiError('userTurnkeyAuth', 'Error during sign-in', { error });
      setEmailSignInStatus('error');
      setEmailSignInError(error.message);
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
      const { session, salt } = response;
      if (session == null) {
        throw new Error('useTurnkeyAuth: No session found');
      } else if (salt == null) {
        throw new Error('useTurnkeyAuth: No salt found');
      }

      await indexedDbClient?.loginWithSession(session);
      await onboardDydx({ salt, setWalletFromSignature, tkClient: indexedDbClient });
      setEmailSignInStatus('success');
      setEmailSignInError(undefined);
    },
    [onboardDydx, indexedDbClient, setWalletFromSignature]
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

        const { organizationId } = turnkeyEmailOnboardingData ?? {};

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
        await onboardDydx({ setWalletFromSignature, tkClient: indexedDbClient });
        setEmailSignInStatus('success');
      } catch (error) {
        let errorMessage: string | undefined;

        if (error instanceof Error) {
          if (
            error.message.includes('unable to decrypt bundle using embedded key') ||
            error.message.includes('Organization ID is not available') ||
            error.message.includes('Unauthenticated desc') ||
            error.message.includes('Organization ID was not found')
          ) {
            errorMessage =
              'Your email link has expired or you are using a different device/browser than the one used to sign in. Please try again.';
          } else {
            logBonsaiError('handleEmailMagicLink', 'error', { error });
            errorMessage = error.message;
          }
        } else {
          logBonsaiError('handleEmailMagicLink', 'error', { error });
        }

        setEmailSignInError(errorMessage ?? 'An unknown error occurred');
        setEmailSignInStatus('error');
      } finally {
        // Clear token from state after it has been consumed
        setEmailToken(undefined);
        // Remove the token from the search params after it has been saved to state
        searchParams.delete('token');
        setSearchParams(searchParams);
        // Clear email sign in data
        dispatch(clearTurnkeyEmailOnboardingData());
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
      dispatch,
    ]
  );

  const signInWithOtp = useCallback(
    async ({ userEmail }: { userEmail: string }) => {
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

  /* ----------------------------- Upload Address ----------------------------- */
  const { mutateAsync: sendUploadAddressRequest } = useMutation({
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
    onError: (error) => {
      dispatch(setRequiresAddressUpload(true));
      logBonsaiError('userTurnkeyAuth', 'Error during upload address', { error });
    },
  });

  const uploadAddress = useCallback(
    async ({ tkClient }: { tkClient?: TurnkeyIndexedDbClient }) => {
      if (dydxAddress == null) {
        throw new Error('No dydx address provided');
      }

      if (tkClient == null) {
        throw new Error('No tk client provided');
      }

      const payload = await getUploadAddressPayload({ dydxAddress, tkClient });
      const result = await sendUploadAddressRequest({ payload });

      if (!result.success) {
        dispatch(setRequiresAddressUpload(true));
      }
    },
    [dispatch, dydxAddress, getUploadAddressPayload, sendUploadAddressRequest]
  );

  /* ----------------------------- Side Effects ----------------------------- */

  /**
   * @description Side effect to handle email link containing a token.
   * Kickstarts the onboarding process by saving the token and opening the EmailSignInStatus Dialog
   */
  useEffect(() => {
    const turnkeyOnboardingToken = searchParams.get('token');
    const hasEncryptedSignature = sourceAccount.encryptedSignature != null;

    if (turnkeyOnboardingToken && dydxAddress != null) {
      searchParams.delete('token');
      setSearchParams(searchParams);
    } else if (turnkeyOnboardingToken && !hasEncryptedSignature) {
      setEmailToken(turnkeyOnboardingToken);
      dispatch(openDialog(DialogTypes.EmailSignInStatus({})));
    }
  }, [searchParams, dispatch, sourceAccount, dydxAddress, resetEmailSignInStatus, setSearchParams]);

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

  /**
   * @description Side effect to upload the address if it is required and the user has a dydx address.
   * This is triggered after the user has signed in with email or OAuth and has derived their dydx address.
   */
  useEffect(() => {
    if (indexedDbClient && needsAddressUpload && dydxAddress != null) {
      // Set RequiredAddressUpload to false to prevent the upload from being triggered again.
      // If the uploadAddress mutation fails, the requiredAddressUpload flag will be set back to true.
      dispatch(setRequiresAddressUpload(false));
      uploadAddress({ tkClient: indexedDbClient });
    }
  }, [dispatch, dydxAddress, uploadAddress, indexedDbClient, needsAddressUpload]);

  /* ----------------------------- Return Values----------------------------- */

  return {
    targetPublicKeys,
    emailSignInError,
    emailSignInStatus,
    isLoading: status === 'pending' || emailSignInStatus === 'loading',
    isError: status === 'error' || emailSignInStatus === 'error',
    needsAddressUpload,
    signInWithOauth,
    signInWithOtp,
    resetEmailSignInStatus,
  };
};
