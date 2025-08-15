import { logBonsaiError } from '@/bonsai/logs';
import { weakMapMemoize } from '@reduxjs/toolkit';
import type { ApiKeyStamper, TurnkeyServerClient } from '@turnkey/sdk-server';
import { getAddress } from 'viem';

import { TurnkeyWallet } from '@/types/turnkey';

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
          accounts
            .filter((account) => account.curve === 'CURVE_SECP256K1')
            .map(async ({ address, ...account }) => {
              return {
                ...account,
                address: getAddress(address),
              };
            })
        );
        return { ...wallet, accounts: accountsWithBalance };
      })
    );
  } catch (error) {
    logBonsaiError('turnkeyUtils', 'getWalletsWithAccounts', error);
    throw error;
  }
}
