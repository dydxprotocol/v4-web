import type { TurnkeyIframeClient, TurnkeyIndexedDbClient } from '@turnkey/sdk-browser';

import type { TurnkeyWallet, TurnkeyWalletAccount } from '@/types/turnkey';

/**
 * Get wallets with accounts from the Turnkey indexedDB client.
 * @param tkClient - The Turnkey (indexedDB or authIframe) client to use.
 * @param organizationId - The organization ID to get wallets for.
 * @returns A list of wallets with accounts.
 */
export async function getWalletsWithAccountsFromClient(
  tkClient: TurnkeyIndexedDbClient | TurnkeyIframeClient,
  organizationId: string
): Promise<TurnkeyWallet[]> {
  const { wallets } = await tkClient.getWallets({ organizationId });

  const walletWithAccounts = await Promise.all(
    wallets.map(async (wallet) => {
      const { accounts } = await tkClient.getWalletAccounts({
        walletId: wallet.walletId,
        organizationId,
      });

      const accountsWithBalance = await accounts.reduce<Promise<TurnkeyWalletAccount[]>>(
        async (accPromise, account) => {
          const acc = await accPromise;
          // Ensure the account's organizationId matches the provided organizationId
          if (account.organizationId === organizationId) {
            acc.push(account);
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
