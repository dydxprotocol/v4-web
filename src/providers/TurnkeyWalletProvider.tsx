import { createContext, useContext, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { TurnkeyIndexedDbClient } from '@turnkey/sdk-browser';
import { useTurnkey } from '@turnkey/sdk-react';
import { Address, getAddress, PublicClient } from 'viem';
import { usePublicClient } from 'wagmi';

import { LocalStorageKey } from '@/constants/localStorage';
import { Account, Wallet } from '@/types/turnkey';

import { useUser } from '@/hooks/Onboarding/Turnkey/useUser';
import { useLocalStorage } from '@/hooks/useLocalStorage';

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
  const { indexedDbClient } = useTurnkey();
  const { user } = useUser();
  const [preferredWallet, setPreferredWallet] = useLocalStorage<{
    userId: string;
    walletId: string;
  } | null>({
    key: LocalStorageKey.TurnkeyPreferredWallet,
    defaultValue: null,
  });

  const [selectedTurnkeyWallet, setSelectedTurnkeyWallet] = useState<Wallet | null>(null);
  const [turnkeyWallets, setTurnkeyWallets] = useState<Wallet[]>([]);

  const publicClient = usePublicClient();

  async function setWalletsQuery() {
    if (!user?.organization.organizationId) {
      return;
    }

    if (publicClient == null) {
      throw new Error('Public client is not available');
    }

    if (indexedDbClient) {
      const wallets = await getWalletsWithAccountsFromClients(
        publicClient,
        indexedDbClient,
        user.organization.organizationId
      );

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
        setSelectedTurnkeyWallet(selectedWallet);
      }
    } else {
      // This case occurs when the user signs up with a new passkey; since a read-only session is not created for new passkey sign-ups,
      // we need to fetch the wallets from the server
      const wallets = await getWalletsWithAccounts(user.organization.organizationId);
      setTurnkeyWallets(wallets);

      if (wallets.length > 0) {
        setSelectedTurnkeyWallet(wallets[0]!);
      }
    }
  }

  const { isLoading: isLoadingTurnkeyWallets } = useQuery({
    queryKey: ['turnkey-wallets', user?.id, publicClient],
    enabled: user != null && publicClient != null,
    queryFn: setWalletsQuery,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchIntervalInBackground: false,
  });

  return {
    turnkeyWallets,
    selectedTurnkeyWallet,
    preferredWallet,
    setPreferredWallet,
    isLoadingTurnkeyWallets,
  };
};

/* ------ Helpers ------ */

const getBalance = async (publicClient: PublicClient, address: Address) => {
  const balance = await publicClient.getBalance({
    address,
  });

  return balance;
};

async function getWalletsWithAccountsFromClients(
  publicClient: PublicClient,
  browserClient: TurnkeyIndexedDbClient,
  organizationId: string
): Promise<Wallet[]> {
  const { wallets } = await browserClient.getWallets();
  const walletWithAccounts = await Promise.all(
    wallets.map(async (wallet) => {
      const { accounts } = await browserClient.getWalletAccounts({
        walletId: wallet.walletId,
      });

      const accountsWithBalance = await accounts.reduce<Promise<Account[]>>(
        async (accPromise, { address, ...account }) => {
          const acc = await accPromise;
          // Ensure the account's organizationId matches the provided organizationId
          if (account.organizationId === organizationId) {
            acc.push({
              ...account,
              address: getAddress(address),
              // Balance is initialized to undefined so that it can be fetched lazily on account selection
              balance: await getBalance(publicClient, getAddress(address)),
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
