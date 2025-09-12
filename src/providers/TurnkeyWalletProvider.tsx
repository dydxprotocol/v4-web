import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { logBonsaiError } from '@/bonsai/logs';
import { uncompressRawPublicKey } from '@turnkey/crypto';
import { TurnkeyIndexedDbClient } from '@turnkey/sdk-browser';
import { useTurnkey } from '@turnkey/sdk-react';
import { AES } from 'crypto-js';
import { hashMessage, hashTypedData, toHex } from 'viem';

import { ConnectorType, getSignTypedDataForTurnkey } from '@/constants/wallets';
import { HashFunction, PayloadEncoding, TurnkeyWallet, UserSession } from '@/types/turnkey';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import {
  clearTurnkeyPrimaryWallet,
  setSavedEncryptedSignature,
  setTurnkeyPrimaryWallet,
} from '@/state/wallet';
import {
  getSourceAccount,
  getTurnkeyEmailOnboardingData,
  getTurnkeyPrimaryWallet,
} from '@/state/walletSelectors';

import { getWalletsWithAccountsFromClient } from '@/lib/turnkey/turnkeyUtils';

const TurnkeyWalletContext = createContext<ReturnType<typeof useTurnkeyWalletContext> | undefined>(
  undefined
);

TurnkeyWalletContext.displayName = 'TurnkeyWallet';

export const TurnkeyWalletProvider = ({ ...props }) => (
  <TurnkeyWalletContext.Provider value={useTurnkeyWalletContext()} {...props} />
);

export const useTurnkeyWallet = () => useContext(TurnkeyWalletContext)!;

const useTurnkeyWalletContext = () => {
  const dispatch = useAppDispatch();
  const { turnkey, indexedDbClient, authIframeClient } = useTurnkey();

  const [turnkeyUser, setTurnkeyUser] = useState<UserSession>();
  const [turnkeyWallets, setTurnkeyWallets] = useState<TurnkeyWallet[]>();
  const primaryTurnkeyWallet = useAppSelector(getTurnkeyPrimaryWallet);

  const setPrimaryTurnkeyWallet = useCallback(
    (primaryWallet: TurnkeyWallet) => {
      dispatch(setTurnkeyPrimaryWallet(primaryWallet));
    },
    [dispatch]
  );

  /* ----------------------------- IndexedDbClient ----------------------------- */

  const [targetPublicKeys, setTargetPublicKeys] = useState<{
    publicKey: string;
    publicKeyCompressed: string;
  } | null>(null);

  const initClient = useCallback(async () => {
    if (indexedDbClient == null) {
      return;
    }

    let publicKeyCompressed = await indexedDbClient.getPublicKey();

    if (!publicKeyCompressed) {
      await indexedDbClient.init();
      await indexedDbClient.resetKeyPair();
      publicKeyCompressed = await indexedDbClient.getPublicKey();

      if (!publicKeyCompressed) {
        throw new Error('useTurnkeyAuth: No public key found');
      }
    }

    const publicKey = toHex(
      uncompressRawPublicKey(new Uint8Array(Buffer.from(publicKeyCompressed, 'hex')))
    );

    setTargetPublicKeys({ publicKey, publicKeyCompressed });
  }, [indexedDbClient]);

  useEffect(() => {
    initClient();
  }, [initClient]);

  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  const getTypedDataForOnboardingTurnkey = useCallback(
    (salt: string) => getSignTypedDataForTurnkey({ selectedDydxChainId, salt }),
    [selectedDydxChainId]
  );

  /* ----------------------------- AuthIframeClient ----------------------------- */

  const [embeddedPublicKey, setEmbeddedPublicKey] = useState<string | null>();
  const turnkeyEmailOnboardingData = useAppSelector(getTurnkeyEmailOnboardingData);

  const initAuthIframeClient = useCallback(async () => {
    const authIframeEmbeddedPublicKey = await authIframeClient?.getEmbeddedPublicKey();
    setEmbeddedPublicKey(authIframeEmbeddedPublicKey);
  }, [authIframeClient]);

  useEffect(() => {
    initAuthIframeClient();
  }, [initAuthIframeClient]);

  const resetAuthIframeClientKey = useCallback(async () => {
    let authIframeEmbeddedPublicKey = await authIframeClient?.getEmbeddedPublicKey();
    await authIframeClient?.clearEmbeddedKey();
    authIframeEmbeddedPublicKey = await authIframeClient?.initEmbeddedKey();
    setEmbeddedPublicKey(authIframeEmbeddedPublicKey);
  }, [authIframeClient]);

  /* ----------------------------- Onboarding Functions ----------------------------- */
  const fetchUser = useCallback(
    async (tkClient?: TurnkeyIndexedDbClient): Promise<UserSession | undefined> => {
      const isIndexedDbFlow = tkClient instanceof TurnkeyIndexedDbClient;

      if (turnkey == null || tkClient == null) {
        return undefined;
      }

      if (isIndexedDbFlow) {
        // Try and get the current user
        const token = await turnkey.getSession();

        // If the user is not found, we assume the user is not logged in
        if (!token?.expiry || token.expiry > Date.now()) {
          return undefined;
        }

        // Get the user's email
        const { user: indexedDbUser } = await tkClient.getUser({
          organizationId: token.organizationId,
          userId: token.userId,
        });

        const userToSet: UserSession = {
          id: indexedDbUser.userId,
          name: indexedDbUser.userName,
          email: indexedDbUser.userEmail ?? '',
          organization: {
            organizationId: token.organizationId,
            organizationName: '',
          },
        };

        setTurnkeyUser(userToSet);
        return userToSet;
      }

      return undefined;
    },
    [turnkey]
  );

  const getPrimaryUserWallets = useCallback(
    async (tkClient?: TurnkeyIndexedDbClient) => {
      const user = turnkeyUser ?? (await fetchUser(tkClient));
      const isIndexedDbFlow = tkClient instanceof TurnkeyIndexedDbClient;

      if (!user?.organization.organizationId) {
        return null;
      }

      if (tkClient && isIndexedDbFlow) {
        const wallets = await getWalletsWithAccountsFromClient(
          tkClient,
          user.organization.organizationId
        );

        if (wallets.length > 0) {
          setPrimaryTurnkeyWallet(wallets[0]!);
          return wallets[0]!;
        }
      }

      return null;
    },
    [turnkeyUser, fetchUser, setPrimaryTurnkeyWallet]
  );

  const onboardDydx = useCallback(
    async ({
      salt,
      setWalletFromSignature,
      tkClient,
    }: {
      salt?: string;
      setWalletFromSignature: (signature: string) => Promise<void>;
      tkClient?: TurnkeyIndexedDbClient;
    }) => {
      const selectedTurnkeyWallet = primaryTurnkeyWallet ?? (await getPrimaryUserWallets(tkClient));

      if (selectedTurnkeyWallet == null || selectedTurnkeyWallet.accounts[0] == null) {
        throw new Error('Selected turnkey wallet is not available');
      }

      if (tkClient == null) {
        throw new Error('TK client is not available');
      }

      const saltToUse = salt ?? turnkeyEmailOnboardingData?.salt;

      if (!saltToUse) {
        throw new Error('Salt is not available');
      }

      const typedData = getTypedDataForOnboardingTurnkey(saltToUse);
      const digest = hashTypedData(typedData);

      const response = await tkClient.signRawPayload({
        signWith: selectedTurnkeyWallet.accounts[0].address,
        organizationId: selectedTurnkeyWallet.accounts[0].organizationId,
        payload: digest,
        encoding: PayloadEncoding.Hexadecimal,
        hashFunction: HashFunction.NoOp,
        timestampMs: Date.now().toString(),
      });

      const signature = `${response.r}${response.s}${response.v}`;
      const staticEncryptionKey = import.meta.env.VITE_PK_ENCRYPTION_KEY;

      if (staticEncryptionKey) {
        const encryptedSignature = AES.encrypt(signature, staticEncryptionKey).toString();
        dispatch(setSavedEncryptedSignature(encryptedSignature));
      }

      await setWalletFromSignature(signature);
    },
    [
      dispatch,
      turnkeyEmailOnboardingData,
      primaryTurnkeyWallet,
      getPrimaryUserWallets,
      getTypedDataForOnboardingTurnkey,
    ]
  );

  const getUploadAddressPayload = useCallback(
    async ({
      dydxAddress,
      tkClient,
    }: {
      dydxAddress: string;
      tkClient?: TurnkeyIndexedDbClient;
    }): Promise<{ dydxAddress: string; signature: string }> => {
      const selectedTurnkeyWallet = primaryTurnkeyWallet ?? (await getPrimaryUserWallets(tkClient));

      if (selectedTurnkeyWallet == null || selectedTurnkeyWallet.accounts[0] == null) {
        throw new Error('Selected turnkey wallet is not available');
      }

      if (tkClient == null) {
        throw new Error('TK client is not available');
      }

      const payload = hashMessage(dydxAddress);

      const response = await tkClient.signRawPayload({
        signWith: selectedTurnkeyWallet.accounts[0].address,
        organizationId: selectedTurnkeyWallet.accounts[0].organizationId,
        payload,
        encoding: PayloadEncoding.Hexadecimal,
        hashFunction: HashFunction.NoOp,
        timestampMs: Date.now().toString(),
      });

      // Combine rsv values with 0x prefix to constuct the signature
      const signature = `0x${response.r}${response.s}${response.v}`;

      return { dydxAddress, signature };
    },
    [primaryTurnkeyWallet, getPrimaryUserWallets]
  );

  /* ----------------------------- End Turnkey Session ----------------------------- */

  const sourceAccount = useAppSelector(getSourceAccount);
  const walletInfo = sourceAccount.walletInfo;

  const clearTurnkeyState = useCallback(() => {
    setTurnkeyUser(undefined);
    dispatch(clearTurnkeyPrimaryWallet());
    setTurnkeyWallets(undefined);
    setTargetPublicKeys(null);
  }, []);

  const endTurnkeySession = useCallback(async () => {
    try {
      if (walletInfo?.connectorType === ConnectorType.Turnkey) {
        await turnkey?.logout();
        clearTurnkeyState();
        await resetAuthIframeClientKey();
        await indexedDbClient?.clear();
        await initClient();
      }
    } catch (error) {
      logBonsaiError(
        'endTurnkeySession',
        'Unsuccessful attempt to clean up Turnkey session',
        error
      );
    }
  }, [
    clearTurnkeyState,
    indexedDbClient,
    initClient,
    resetAuthIframeClientKey,
    turnkey,
    walletInfo,
  ]);

  /* ----------------------------- Return ----------------------------- */
  return {
    turnkeyWallets,
    primaryTurnkeyWallet,
    embeddedPublicKey,
    targetPublicKeys,

    endTurnkeySession,
    onboardDydx,
    getUploadAddressPayload,
  };
};
