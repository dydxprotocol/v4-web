import { createContext, useCallback, useContext, useState } from 'react';

import { logTurnkey } from '@/bonsai/logs';
import { TurnkeyIndexedDbClient } from '@turnkey/sdk-browser';
import { useTurnkey } from '@turnkey/sdk-react';
import { hashTypedData } from 'viem';

import { LocalStorageKey } from '@/constants/localStorage';
import { ConnectorType, getSignTypedDataForTurnkey, WalletType } from '@/constants/wallets';
import { Account, UserSession, Wallet } from '@/types/turnkey';

import { useAccounts } from '@/hooks/useAccounts';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useWalletConnection } from '@/hooks/useWalletConnection';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { getWalletsWithAccounts } from '@/lib/turnkey/turnkeyUtils';

const TurnkeyWalletContext = createContext<ReturnType<typeof useTurnkeyWalletContext> | undefined>(
  undefined
);

TurnkeyWalletContext.displayName = 'TurnkeyWallet';

export const TurnkeyWalletProvider = ({ ...props }) => (
  <TurnkeyWalletContext.Provider value={useTurnkeyWalletContext()} {...props} />
);

export const useTurnkeyWallet = () => useContext(TurnkeyWalletContext)!;

const useTurnkeyWalletContext = () => {
  const { indexedDbClient, turnkey } = useTurnkey();
  const [turnkeyUser, setTurnkeyUser] = useState<UserSession | undefined>();
  const [preferredWallet, setPreferredWallet] = useLocalStorage<{
    userId: string;
    walletId: string;
  } | null>({
    key: LocalStorageKey.TurnkeyPreferredWallet,
    defaultValue: null,
  });

  const [turnkeyWallets, setTurnkeyWallets] = useState<Wallet[]>([]);
  const { primaryTurnkeyWallet, setPrimaryTurnkeyWallet } = useWalletConnection();
  const { setWalletFromSignature, selectWallet } = useAccounts();

  const fetchUser = useCallback(async (): Promise<UserSession | undefined> => {
    if (turnkey) {
      // Try and get the current user
      logTurnkey('fetchUser/', 'turnkey', turnkey);
      const token = await turnkey.getSession();
      logTurnkey('fetchUser/', 'token', token);

      // If the user is not found, we assume the user is not logged in
      if (!token?.expiry || token.expiry > Date.now() || indexedDbClient == null) {
        return undefined;
      }

      selectWallet({
        connectorType: ConnectorType.Turnkey,
        name: WalletType.Turnkey,
      });

      // Get the user's email
      const { user: indexedDbUser } = await indexedDbClient.getUser({
        organizationId: token.organizationId,
        userId: token.userId,
      });

      logTurnkey('fetchUser/', 'indexedDbUser', indexedDbUser);

      const userToSet: UserSession = {
        id: indexedDbUser.userId,
        name: indexedDbUser.userName,
        email: indexedDbUser.userEmail ?? '',
        organization: {
          organizationId: token.organizationId,
          organizationName: '',
        },
      };

      logTurnkey('fetchUser/', 'userToSet', userToSet);

      setTurnkeyUser(userToSet);
      return userToSet;
    }

    return undefined;
  }, [turnkey, indexedDbClient, selectWallet]);

  const getPrimaryUserWallets = useCallback(async () => {
    const user = turnkeyUser ?? (await fetchUser());
    logTurnkey('getPrimaryUserWallets/', 'user', user);

    if (!user?.organization.organizationId) {
      logTurnkey('getPrimaryUserWallets/', 'no organizationId');
      return null;
    }

    if (indexedDbClient) {
      logTurnkey('getPrimaryUserWallets/', 'indexedDbClient is available');
      const wallets = await getWalletsWithAccountsFromClients(
        indexedDbClient,
        user.organization.organizationId
      );

      logTurnkey('getPrimaryUserWallets/', 'wallets', wallets);

      if (wallets.length > 0) {
        let selectedWallet: Wallet = wallets[0]!;
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

    logTurnkey('getPrimaryUserWallets/', 'no indexedDbClient');

    // This case occurs when the user signs up with a new passkey; since a read-only session is not created for new passkey sign-ups,
    // we need to fetch the wallets from the server
    const wallets = await getWalletsWithAccounts(user.organization.organizationId);
    setTurnkeyWallets(wallets);

    logTurnkey('getPrimaryUserWallets/', 'wallets2', wallets);

    if (wallets.length > 0) {
      setPrimaryTurnkeyWallet(wallets[0]!);
      return wallets[0]!;
    }

    return null;
  }, [fetchUser, preferredWallet, indexedDbClient, turnkeyUser, setPrimaryTurnkeyWallet]);

  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);

  const getTypedDataForOnboardingTurnkey = useCallback(
    (salt: string) => getSignTypedDataForTurnkey({ selectedDydxChainId, salt }),
    [selectedDydxChainId]
  );

  const decodeSessionJwt = useCallback((token: string) => {
    logTurnkey('decodeSessionJwt/', 'token', token);
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

  const onboardDydxFromTurnkey = useCallback(
    async (salt: string, session: string) => {
      const decoded = decodeSessionJwt(session);
      logTurnkey('onboardDydxFromTurnkey/', 'decoded', decoded);

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
        encoding: 'PAYLOAD_ENCODING_HEXADECIMAL',
        hashFunction: 'HASH_FUNCTION_NO_OP',
        timestampMs: Date.now().toString(),
      });

      const signature = `${response.r}${response.s}${response.v}`;

      await setWalletFromSignature(signature);
    },
    [
      decodeSessionJwt,
      primaryTurnkeyWallet,
      getPrimaryUserWallets,
      indexedDbClient,
      getTypedDataForOnboardingTurnkey,
      setWalletFromSignature,
    ]
  );

  return {
    decodeSessionJwt,
    fetchUser,
    turnkeyWallets,
    preferredWallet,
    setPreferredWallet,
    onboardDydxFromTurnkey,
  };
};

/* ------ Helpers ------ */

async function getWalletsWithAccountsFromClients(
  browserClient: TurnkeyIndexedDbClient,
  organizationId: string
): Promise<Wallet[]> {
  logTurnkey('getWalletsWithAccountsFromClients/', 'browserClient', browserClient);
  await browserClient.init();
  logTurnkey('getWalletsWithAccountsFromClients/', 'browserClient initialized');
  const { wallets } = await browserClient.getWallets();
  logTurnkey('getWalletsWithAccountsFromClients/', 'wallets', wallets);

  const walletWithAccounts = await Promise.all(
    wallets.map(async (wallet) => {
      const { accounts } = await browserClient.getWalletAccounts({
        walletId: wallet.walletId,
      });

      const accountsWithBalance = await accounts.reduce<Promise<Account[]>>(
        async (accPromise, account) => {
          const acc = await accPromise;
          // Ensure the account's organizationId matches the provided organizationId
          if (account.organizationId === organizationId) {
            acc.push({
              ...account,
            });
          }
          return acc;
        },
        Promise.resolve([])
      );

      return { ...wallet, accounts: accountsWithBalance };
    })
  );

  return walletWithAccounts;
}
