import { createContext, useContext, useState } from 'react';

import { logBonsaiError, logTurnkey } from '@/bonsai/logs';
import { selectIndexerUrl } from '@/bonsai/socketSelectors';
import { useMutation } from '@tanstack/react-query';
import { useTurnkey } from '@turnkey/sdk-react';
import { jwtDecode } from 'jwt-decode';

import { ConnectorType, WalletType } from '@/constants/wallets';
import { GoogleIdTokenPayload, LoginMethod, SignInBody } from '@/types/turnkey';

import { useAccounts } from '@/hooks/useAccounts';

import { useAppSelector } from '@/state/appTypes';

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
  const [additionalInfo, setAdditionalInfo] = useState<{
    providerName: string;
    userEmail?: string;
  } | null>(null);

  const indexerUrl = useAppSelector(selectIndexerUrl);
  const { indexedDbClient } = useTurnkey();

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
      providerName: string;
      userEmail?: string;
    }) => {
      selectWallet({
        connectorType: ConnectorType.Turnkey,
        name: WalletType.Turnkey,
      });

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
          handleOauthResponse({ response, providerName, userEmail });
          break;
        case LoginMethod.Email: // TODO: handle email response
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

  const { onboardDydxFromTurnkey, targetPublicKeys } = useTurnkeyWallet();

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

  const handleOauthResponse = async ({
    response,
    providerName,
    userEmail,
  }: {
    response: {
      session?: string;
      salt?: string;
      dydxAddress?: string;
    };
    providerName: string;
    userEmail?: string;
  }) => {
    const { session, salt } = response;
    if (session == null) {
      throw new Error('useTurnkeyAuth: No session found');
    } else if (salt == null) {
      throw new Error('useTurnkeyAuth: No salt found');
    }

    await indexedDbClient?.loginWithSession(session);
    setAdditionalInfo({ providerName, userEmail });
    await onboardDydxFromTurnkey({ salt, setWalletFromSignature });
  };

  return {
    providerName: additionalInfo?.providerName,
    userEmail: additionalInfo?.userEmail,
    targetPublicKeys,

    isLoading: status === 'pending',
    isError: status === 'error',
    signInWithOauth,
  };
};
