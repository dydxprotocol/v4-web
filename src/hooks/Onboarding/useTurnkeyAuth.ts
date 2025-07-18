import { useCallback } from 'react';

import { logBonsaiError } from '@/bonsai/logs';
import { useTurnkey } from '@turnkey/sdk-react';

export const useTurnkeyAuth = () => {
  const { passkeyClient, turnkey, indexedDbClient } = useTurnkey();

  const initEmailAuth = useCallback(
    async ({ targetUserEmail }: { targetUserEmail: string }) => {
      try {
        const publicKey = await indexedDbClient?.getPublicKey();
        if (publicKey == null) {
          throw new Error('useTurnkeyAuth: Public key not found');
        }

        if (turnkey == null) {
          throw new Error('useTurnkeyAuth: Turnkey not initialized');
        }

        await turnkey?.serverSign('emailAuth', [
          {
            email: targetUserEmail,
            targetPublicKey: publicKey,
            organizationId: import.meta.env.VITE_PUBLIC_ORGANIZATION_ID,
          },
        ]);
      } catch (error) {
        logBonsaiError('userTurnkeyAuth', 'initEmailAuth', { error });
      }
    },
    [indexedDbClient, turnkey]
  );

  const loginPasskey = useCallback(async () => {
    try {
      if (passkeyClient == null) {
        throw new Error('useTurnkeyAuth: Passkey client not initialized');
      }
      if (indexedDbClient == null) {
        throw new Error('useTurnkeyAuth: IndexedDB client not initialized');
      }

      const publicKey = await indexedDbClient.getPublicKey();
      if (publicKey == null) {
        throw new Error('useTurnkeyAuth: Public key not found');
      }

      await passkeyClient.loginWithPasskey({
        publicKey,
        sessionType: 'SESSION_TYPE_READ_WRITE',
        expirationSeconds: '900',
      });
    } catch (error) {
      logBonsaiError('userTurnkeyAuth', 'loginPasskey', { error });
    }
  }, [passkeyClient, indexedDbClient]);

  const createPasskey = useCallback(async () => {
    try {
      if (passkeyClient == null) {
        throw new Error('useTurnkeyAuth: Passkey client not initialized');
      }

      await passkeyClient.createUserPasskey();
    } catch (error) {
      logBonsaiError('userTurnkeyAuth', 'createPasskey', { error });
    }
  }, [passkeyClient]);

  const loginWithSession = useCallback(
    async (credentialBundle: string) => {
      try {
        if (indexedDbClient == null) {
          throw new Error('useTurnkeyAuth: IndexedDB client not initialized');
        }

        await indexedDbClient.loginWithSession(credentialBundle);
      } catch (error) {
        logBonsaiError('userTurnkeyAuth', 'loginWithSession', { error });
      }
    },
    [indexedDbClient]
  );

  return {
    initEmailAuth,
    loginPasskey,
    loginWithSession,
    createPasskey,
  };
};
