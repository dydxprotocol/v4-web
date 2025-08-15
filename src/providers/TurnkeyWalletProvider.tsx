import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { logTurnkey } from '@/bonsai/logs';
import { uncompressRawPublicKey } from '@turnkey/crypto';
import { useTurnkey } from '@turnkey/sdk-react';
import { AES } from 'crypto-js';
import { hashTypedData, toHex } from 'viem';

import { LocalStorageKey } from '@/constants/localStorage';
import { getSignTypedDataForTurnkey } from '@/constants/wallets';
import { HashFunction, PayloadEncoding, TurnkeyWallet, UserSession } from '@/types/turnkey';

import { useLocalStorage } from '@/hooks/useLocalStorage';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { setSavedEncryptedSignature } from '@/state/wallet';

import {
  getWalletsWithAccounts,
  getWalletsWithAccountsFromIndexedDb,
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
  const { turnkey, indexedDbClient } = useTurnkey();
  const [turnkeyUser, setTurnkeyUser] = useState<UserSession | undefined>();
  const [preferredWallet, setPreferredWallet] = useLocalStorage<{
    userId: string;
    walletId: string;
  } | null>({
    key: LocalStorageKey.TurnkeyPreferredWallet,
    defaultValue: null,
  });

  const [turnkeyWallets, setTurnkeyWallets] = useState<TurnkeyWallet[]>([]);
  const [primaryTurnkeyWallet, setPrimaryTurnkeyWallet] = useState<TurnkeyWallet | undefined>();
  const [targetPublicKeys, setTargetPublicKeys] = useState<{
    publicKey: string;
    publicKeyCompressed: string;
  } | null>(null);

  const initClient = useCallback(async () => {
    logTurnkey('useTurnkeyWallet', 'initClient');

    if (indexedDbClient == null) {
      logTurnkey('useTurnkeyWallet', 'initClient', 'no indexedDbClient');
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
    ).replace('0x', '');

    setTargetPublicKeys({ publicKey, publicKeyCompressed });
  }, [indexedDbClient]);

  useEffect(() => {
    initClient();
  }, [initClient]);

  const fetchUser = async (): Promise<UserSession | undefined> => {
    if (turnkey) {
      // Try and get the current user
      const token = await turnkey.getSession();

      // If the user is not found, we assume the user is not logged in
      if (!token?.expiry || token.expiry > Date.now() || indexedDbClient == null) {
        return undefined;
      }

      // Get the user's email
      const { user: indexedDbUser } = await indexedDbClient.getUser({
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
  };

  const getPrimaryUserWallets = async () => {
    const user = turnkeyUser ?? (await fetchUser());

    if (!user?.organization.organizationId) {
      return null;
    }

    if (indexedDbClient) {
      const wallets = await getWalletsWithAccountsFromIndexedDb(
        indexedDbClient,
        user.organization.organizationId
      );

      if (wallets.length > 0) {
        let selectedWallet: TurnkeyWallet = wallets[0]!;
        // If the user has a preferred wallet, select it
        if (preferredWallet != null) {
          const wallet = wallets.find(
            (userWallet) =>
              userWallet.walletId === preferredWallet.walletId && user.id === preferredWallet.userId
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

    logTurnkey('getPrimaryUserWallets', 'no indexedDbClient');
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
  };

  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  const getTypedDataForOnboardingTurnkey = useCallback(
    (salt: string) => getSignTypedDataForTurnkey({ selectedDydxChainId, salt }),
    [selectedDydxChainId]
  );

  const decodeSessionJwt = useCallback((token: string) => {
    const [, payload] = token.split('.');
    if (!payload) {
      throw new Error('Invalid JWT: Missing payload');
    }

    const decoded = JSON.parse(atob(payload));
    const {
      exp,
      public_key: publicKey,
      session_type: sessionType,
      user_id: userId,
      organization_id: organizationId,
    } = decoded;

    if (!exp || !publicKey || !sessionType || !userId || !organizationId) {
      throw new Error('JWT payload missing required fields');
    }

    return {
      sessionType,
      userId,
      organizationId,
      expiry: exp,
      publicKey,
    };
  }, []);

  const onboardDydxFromTurnkey = async ({
    salt,
    setWalletFromSignature,
  }: {
    salt: string;
    setWalletFromSignature: (signature: string) => Promise<void>;
  }) => {
    const selectedTurnkeyWallet = primaryTurnkeyWallet ?? (await getPrimaryUserWallets());

    if (selectedTurnkeyWallet == null || selectedTurnkeyWallet.accounts[0] == null) {
      throw new Error('Selected turnkey wallet is not available');
    }

    if (indexedDbClient == null) {
      throw new Error('IndexedDB client is not available');
    }

    const typedData = getTypedDataForOnboardingTurnkey(salt);
    const digest = hashTypedData(typedData);

    const response = await indexedDbClient.signRawPayload({
      signWith: selectedTurnkeyWallet.accounts[0].address,
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
  };

  const endTurnkeySession = async () => {
    try {
      logTurnkey('useTurnkeyWallet', 'endTurnkeySession', turnkey);
      await turnkey?.logout();
      await indexedDbClient?.clear();
      await initClient();
    } catch (error) {
      logTurnkey('useTurnkeyWallet', 'endTurnkeySession error', error);
    }
  };

  return {
    turnkeyWallets,
    primaryTurnkeyWallet,
    preferredWallet,
    targetPublicKeys,

    decodeSessionJwt,
    endTurnkeySession,
    setPreferredWallet,
    onboardDydxFromTurnkey,
  };
};
