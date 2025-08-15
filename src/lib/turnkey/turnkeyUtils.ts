import { logBonsaiError } from '@/bonsai/logs';
import { weakMapMemoize } from '@reduxjs/toolkit';
import type { TurnkeyIndexedDbClient } from '@turnkey/sdk-browser';
import type { ApiKeyStamper, TurnkeyServerClient } from '@turnkey/sdk-server';

import type { TurnkeyWallet, TurnkeyWalletAccount } from '@/types/turnkey';

const TURNKEY_API_PUBLIC_KEY = import.meta.env.VITE_TURNKEY_API_PUBLIC_KEY;
const TURNKEY_API_PRIVATE_KEY = import.meta.env.VITE_TURNKEY_API_PRIVATE_KEY;

const getLazyTurnkeyApiKeyStamper = weakMapMemoize(async () => {
  return (await import('@turnkey/sdk-server')).ApiKeyStamper;
});

const getLazyTurnkeyClient = weakMapMemoize(async () => {
  return (await import('@turnkey/sdk-server')).TurnkeyServerClient;
});

let stamper: ApiKeyStamper | undefined;
let turnkeyClient: TurnkeyServerClient | undefined;

/**
 * Get wallets with accounts from the Turnkey server.
 * @param organizationId - The organization ID to get wallets for.
 * @returns A list of wallets with accounts.
 */
export async function getWalletsWithAccounts(organizationId: string): Promise<TurnkeyWallet[]> {
  try {
    if (TURNKEY_API_PUBLIC_KEY == null || TURNKEY_API_PRIVATE_KEY == null) {
      throw new Error('Turnkey API keys and base URL are not set');
    }

    stamper ??= new (await getLazyTurnkeyApiKeyStamper())({
      apiPublicKey: TURNKEY_API_PUBLIC_KEY,
      apiPrivateKey: TURNKEY_API_PRIVATE_KEY,
    });

    if (import.meta.env.VITE_TURNKEY_API_BASE_URL == null) {
      throw new Error('Turnkey API base URL is not set');
    }

    turnkeyClient ??= new (await getLazyTurnkeyClient())({
      apiBaseUrl: import.meta.env.VITE_TURNKEY_API_BASE_URL,
      organizationId: import.meta.env.VITE_PUBLIC_ORGANIZATION_ID,
      stamper,
    });

    const { wallets } = await turnkeyClient.getWallets({
      organizationId,
    });

    return await Promise.all(
      wallets.map(async (wallet) => {
        if (turnkeyClient == null) {
          throw new Error(`${wallet.walletId} - Turnkey client is not set`);
        }

        const { accounts } = await turnkeyClient.getWalletAccounts({
          organizationId,
          walletId: wallet.walletId,
        });

        const accountsWithBalance = await Promise.all(
          accounts.filter((account) => account.curve === 'CURVE_SECP256K1')
        );
        return { ...wallet, accounts: accountsWithBalance };
      })
    );
  } catch (error) {
    logBonsaiError('turnkeyUtils', 'getWalletsWithAccounts', error);
    throw error;
  }
}

/**
 * Get wallets with accounts from the Turnkey indexedDB client.
 * @param browserClient - The Turnkey indexedDB client to use.
 * @param organizationId - The organization ID to get wallets for.
 * @returns A list of wallets with accounts.
 */
export async function getWalletsWithAccountsFromIndexedDb(
  browserClient: TurnkeyIndexedDbClient,
  organizationId: string
): Promise<TurnkeyWallet[]> {
  const { wallets } = await browserClient.getWallets({ organizationId });

  const walletWithAccounts = await Promise.all(
    wallets.map(async (wallet) => {
      const { accounts } = await browserClient.getWalletAccounts({
        walletId: wallet.walletId,
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
