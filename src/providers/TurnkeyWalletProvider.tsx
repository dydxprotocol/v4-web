import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { logTurnkey } from '@/bonsai/logs';
import { uncompressRawPublicKey } from '@turnkey/crypto';
import { TurnkeyIframeClient, TurnkeyIndexedDbClient } from '@turnkey/sdk-browser';
import { useTurnkey } from '@turnkey/sdk-react';
import { AES } from 'crypto-js';
import { hashTypedData, toHex } from 'viem';

import { LocalStorageKey } from '@/constants/localStorage';
import { ConnectorType, getSignTypedDataForTurnkey } from '@/constants/wallets';
import {
  HashFunction,
  PayloadEncoding,
  TurnkeyEmailOnboardingData,
  TurnkeyWallet,
  UserSession,
} from '@/types/turnkey';

import { useLocalStorage } from '@/hooks/useLocalStorage';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setSavedEncryptedSignature } from '@/state/wallet';
import { getSourceAccount } from '@/state/walletSelectors';

import {
  getWalletsWithAccounts,
  getWalletsWithAccountsFromClient,
} from '@/lib/turnkey/turnkeyUtils';

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
  const [preferredWallet, setPreferredWallet] = useLocalStorage<{
    userId: string;
    walletId: string;
  } | null>({
    key: LocalStorageKey.TurnkeyPreferredWallet,
    defaultValue: null,
  });

  const [turnkeyUser, setTurnkeyUser] = useState<UserSession>();
  const [turnkeyWallets, setTurnkeyWallets] = useState<TurnkeyWallet[]>([]);
  const [primaryTurnkeyWallet, setPrimaryTurnkeyWallet] = useState<TurnkeyWallet>();

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
  const [turnkeyEmailOnboardingData] = useLocalStorage<TurnkeyEmailOnboardingData | undefined>({
    key: LocalStorageKey.TurnkeyEmailOnboardingData,
    defaultValue: undefined,
  });

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
  const fetchUserShared = useCallback(
    async (
      tkClient?: TurnkeyIndexedDbClient | TurnkeyIframeClient
    ): Promise<UserSession | undefined> => {
      const isIndexedDbFlow = tkClient instanceof TurnkeyIndexedDbClient;
      const isAuthIframeFlow = tkClient instanceof TurnkeyIframeClient;

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

      if (isAuthIframeFlow) {
        const { organizationId, userId } = turnkeyEmailOnboardingData ?? {};

        if (!organizationId) {
          throw new Error('Organization ID is not available');
        }

        if (!userId) {
          throw new Error('User ID is not available');
        }

        const authIframeUser = await tkClient.getUser({
          organizationId,
          userId,
        });

        const userToSet: UserSession = {
          id: authIframeUser.user.userId,
          name: authIframeUser.user.userName,
          email: authIframeUser.user.userEmail ?? '',
          organization: {
            organizationId,
            organizationName: '',
          },
        };

        logTurnkey('fetchUserFrommAuthIframe', 'userToSet', userToSet);

        setTurnkeyUser(userToSet);

        return userToSet;
      }

      return undefined;
    },
    [turnkey, turnkeyEmailOnboardingData]
  );

  const getPrimaryUserWalletsShared = useCallback(
    async (tkClient?: TurnkeyIndexedDbClient | TurnkeyIframeClient) => {
      const user = turnkeyUser ?? (await fetchUserShared(tkClient));
      const isIndexedDbFlow = tkClient instanceof TurnkeyIndexedDbClient;
      const isAuthIframeFlow = tkClient instanceof TurnkeyIframeClient;

      if (!user?.organization.organizationId) {
        return null;
      }

      if (tkClient && isIndexedDbFlow) {
        const wallets = await getWalletsWithAccountsFromClient(
          tkClient,
          user.organization.organizationId
        );

        if (wallets.length > 0) {
          let selectedWallet: TurnkeyWallet = wallets[0]!;
          // If the user has a preferred wallet, select it
          if (preferredWallet != null) {
            const wallet = wallets.find(
              (userWallet) =>
                userWallet.walletId === preferredWallet.walletId &&
                user.id === preferredWallet.userId
            );

            // Preferred wallet is found select it as the current wallet
            // otherwise select the first wallet in the list of wallets
            if (wallet) {
              selectedWallet = wallet;
            }
          }

          setPrimaryTurnkeyWallet(selectedWallet);
          return selectedWallet;
        }

        return null;
      }

      if (tkClient && isAuthIframeFlow) {
        const wallets = await getWalletsWithAccountsFromClient(
          tkClient,
          user.organization.organizationId
        );

        if (wallets.length > 0) {
          let selectedWallet: TurnkeyWallet = wallets[0]!;
          // If the user has a preferred wallet, select it
          if (preferredWallet != null) {
            const wallet = wallets.find(
              (userWallet) =>
                userWallet.walletId === preferredWallet.walletId &&
                user.id === preferredWallet.userId
            );

            // Preferred wallet is found select it as the current wallet
            // otherwise select the first wallet in the list of wallets
            if (wallet) {
              selectedWallet = wallet;
            }
          }

          setPrimaryTurnkeyWallet(selectedWallet);
          return selectedWallet;
        }

        return null;
      }

      // This case occurs when the user signs up with a new passkey; since a read-only session is not created for new passkey sign-ups,
      // we need to fetch the wallets from the server
      const wallets = await getWalletsWithAccounts(user.organization.organizationId);
      setTurnkeyWallets(wallets);
      logTurnkey('getPrimaryUserWallets', 'no indexedDb Wallets', wallets);

      if (wallets.length > 0) {
        setPrimaryTurnkeyWallet(wallets[0]!);
        return wallets[0]!;
      }

      return null;
    },
    [turnkeyUser, fetchUserShared, preferredWallet]
  );

  const onboardDydxShared = useCallback(
    async ({
      salt,
      setWalletFromSignature,
      tkClient,
    }: {
      salt?: string;
      setWalletFromSignature: (signature: string) => Promise<void>;
      tkClient?: TurnkeyIndexedDbClient | TurnkeyIframeClient;
    }) => {
      const selectedTurnkeyWallet =
        primaryTurnkeyWallet ?? (await getPrimaryUserWalletsShared(tkClient));

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
      getPrimaryUserWalletsShared,
      getTypedDataForOnboardingTurnkey,
    ]
  );

  const getUploadAddressPayload = useCallback(
    async ({
      dydxAddress,
      tkClient,
    }: {
      dydxAddress: string;
      tkClient?: TurnkeyIndexedDbClient | TurnkeyIframeClient;
    }): Promise<{ dydxAddress: string; signature: string }> => {
      const selectedTurnkeyWallet =
        primaryTurnkeyWallet ?? (await getPrimaryUserWalletsShared(tkClient));

      if (selectedTurnkeyWallet == null || selectedTurnkeyWallet.accounts[0] == null) {
        throw new Error('Selected turnkey wallet is not available');
      }

      if (tkClient == null) {
        throw new Error('TK client is not available');
      }

      const response = await tkClient.signRawPayload({
        signWith: selectedTurnkeyWallet.accounts[0].address,
        organizationId: selectedTurnkeyWallet.accounts[0].organizationId,
        payload: dydxAddress,
        encoding: PayloadEncoding.Hexadecimal,
        hashFunction: HashFunction.NoOp,
        timestampMs: Date.now().toString(),
      });

      const signature = `${response.r}${response.s}${response.v}`;

      return { dydxAddress, signature };
    },
    [primaryTurnkeyWallet, getPrimaryUserWalletsShared]
  );

  /* ----------------------------- End Turnkey Session ----------------------------- */

  const sourceAccount = useAppSelector(getSourceAccount);
  const walletInfo = sourceAccount.walletInfo;

  const clearTurnkeyState = useCallback(() => {
    setTurnkeyUser(undefined);
    setPrimaryTurnkeyWallet(undefined);
    setTurnkeyWallets([]);
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
      logTurnkey('useTurnkeyWallet', 'endTurnkeySession error', error);
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
    preferredWallet,
    embeddedPublicKey,
    targetPublicKeys,

    endTurnkeySession,
    setPreferredWallet,
    resetAuthIframeClientKey,
    onboardDydxShared,
    getUploadAddressPayload,
  };
};
