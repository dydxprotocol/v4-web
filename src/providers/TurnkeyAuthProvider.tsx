import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { logBonsaiError, logTurnkey } from '@/bonsai/logs';
import { selectIndexerUrl } from '@/bonsai/socketSelectors';
import { useMutation } from '@tanstack/react-query';
import { useTurnkey } from '@turnkey/sdk-react';
import { jwtDecode } from 'jwt-decode';
import { useSearchParams } from 'react-router-dom';

import { DialogTypes } from '@/constants/dialogs';
import { LocalStorageKey } from '@/constants/localStorage';
import { ConnectorType, WalletType } from '@/constants/wallets';
import {
  GoogleIdTokenPayload,
  LoginMethod,
  SignInBody,
  TurnkeyEmailOnboardingData,
  TurnkeyEmailResponse,
  TurnkeyOAuthResponse,
} from '@/types/turnkey';

import { useAccounts } from '@/hooks/useAccounts';
import { useLocalStorage } from '@/hooks/useLocalStorage';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { openDialog } from '@/state/dialogs';
import { setWalletInfo } from '@/state/wallet';

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
  const { indexedDbClient, authIframeClient } = useTurnkey();
  const [emailToken, setEmailToken] = useState<string>();
  const [searchParams, setSearchParams] = useSearchParams();

  const { selectWallet } = useAccounts();

  const { mutate: sendSignInRequest, status } = useMutation({
    mutationFn: async ({
      headers,
      body,
      loginMethod,
      providerName,
      userEmail,
    }: {
      headers: HeadersInit;
      body: string;
      loginMethod: LoginMethod;
      providerName?: string;
      userEmail?: string;
    }) => {
      dispatch(
        setWalletInfo({
          connectorType: ConnectorType.Turnkey,
          name: WalletType.Turnkey,
          userEmail,
          providerName,
          loginMethod,
        })
      );

      const response = await fetch(`${indexerUrl}/v4/turnkey/signin`, {
        method: 'POST',
        headers,
        body,
      }).then((res) => res.json());

      if (response.errors && Array.isArray(response.errors)) {
        // Handle API-reported errors
        const errorMsg = response.errors.map((e: { msg: string }) => e.msg).join(', ');
        throw new Error(`useTurnkeyAuth: Backend Error: ${errorMsg}`);
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
      logTurnkey('useTurnkeyAuth', 'error', error);
      logBonsaiError('userTurnkeyAuth', 'Error during sign-in', { error });
    },
  });

  const { onboardDydxFromTurnkey, onboardDydxFromAuthIframe, embeddedPublicKey, targetPublicKeys } =
    useTurnkeyWallet();

  const signInWithOauth = async ({
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

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    sendSignInRequest({
      headers,
      body: JSON.stringify(inputBody),
      loginMethod: LoginMethod.OAuth,
      providerName,
      userEmail: decoded.email,
    });
  };

  const { setWalletFromSignature } = useAccounts();

  const handleOauthResponse = async ({ response }: { response: TurnkeyOAuthResponse }) => {
    const { session, salt } = response;
    if (session == null) {
      throw new Error('useTurnkeyAuth: No session found');
    } else if (salt == null) {
      throw new Error('useTurnkeyAuth: No salt found');
    }

    await indexedDbClient?.loginWithSession(session);
    await onboardDydxFromTurnkey({ salt, setWalletFromSignature });
  };

  const [, setTurnkeyEmailOnboardingData] = useLocalStorage<TurnkeyEmailOnboardingData | undefined>(
    {
      key: LocalStorageKey.TurnkeyEmailOnboardingData,
      defaultValue: undefined,
    }
  );

  const handleEmailResponse = async ({
    response,
    userEmail,
  }: {
    response: TurnkeyEmailResponse;
    userEmail: string;
  }) => {
    const { salt, organizationId, userId, dydxAddress } = response;

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
    setTurnkeyEmailOnboardingData({
      salt,
      organizationId,
      userId,
      userEmail,
      dydxAddress,
    });
  };

  const [emailSignInStatus, setEmailSignInStatus] = useState<'loading' | 'success' | 'error'>();
  const [emailSignInError, setEmailSignInError] = useState<string>();

  const handleEmailMagicLink = useCallback(
    async ({ token }: { token: string }) => {
      try {
        if (authIframeClient == null) {
          throw new Error('cannot initialize auth without an iframe');
        }

        await authIframeClient.injectCredentialBundle(token);
        await onboardDydxFromAuthIframe({ setWalletFromSignature });
        setEmailSignInStatus('success');
      } catch (error) {
        logBonsaiError('handleEmailMagicLink', 'error', { error });
        setEmailSignInError(error instanceof Error ? error.message : 'An unknown error occurred');
        setEmailSignInStatus('error');
      } finally {
        // Clear token from state after it has been consumed
        setEmailToken(undefined);
        // Remove the token from the search params after it has been saved to state
        searchParams.delete('token');
        setSearchParams(searchParams);
        // Clear email sign in data
        setTurnkeyEmailOnboardingData(undefined);
      }
    },
    [
      authIframeClient,
      onboardDydxFromAuthIframe,
      setWalletFromSignature,
      searchParams,
      setSearchParams,
      setTurnkeyEmailOnboardingData,
    ]
  );

  useEffect(() => {
    const turnkeyOnboardingToken = searchParams.get('token');
    if (turnkeyOnboardingToken) {
      setEmailToken(turnkeyOnboardingToken);
      setEmailSignInStatus('loading');
      dispatch(openDialog(DialogTypes.EmailSignInSuccess({})));
    }
  }, [searchParams, dispatch]);

  useEffect(() => {
    if (emailToken && targetPublicKeys?.publicKey && authIframeClient) {
      logTurnkey('handleEmailMagicLink', 'attempting to onboard', emailToken);
      handleEmailMagicLink({ token: emailToken });
    }
  }, [
    emailToken,
    targetPublicKeys?.publicKey,
    authIframeClient,
    handleEmailMagicLink,
    setSearchParams,
  ]);

  const signInWithOtp = async ({ userEmail }: { userEmail: string }) => {
    if (authIframeClient == null) {
      throw new Error('cannot initialize auth without an iframe');
    }

    const targetPublicKey = embeddedPublicKey;

    if (targetPublicKey == null) {
      throw new Error('No target public key found');
    }

    const inputBody: SignInBody = {
      signinMethod: 'email',
      userEmail,
      targetPublicKey,
      magicLink: `${globalThis.location.origin}/markets/?token`,
    };

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    sendSignInRequest({
      headers,
      body: JSON.stringify(inputBody),
      loginMethod: LoginMethod.Email,
      userEmail,
    });
  };

  return {
    targetPublicKeys,
    emailSignInError,
    emailSignInStatus,
    isLoading: status === 'pending' || emailSignInStatus === 'loading',
    isError: status === 'error' || emailSignInStatus === 'error',
    signInWithOauth,
    signInWithOtp,
  };
};
