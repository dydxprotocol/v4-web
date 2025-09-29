import type { TurnkeyIframeClient, TurnkeyIndexedDbClient } from '@turnkey/sdk-browser';

import { STRING_KEYS, StringGetterFunction } from '@/constants/localization';
import type { TurnkeyWallet } from '@/types/turnkey';

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

      const accountsWithBalance = accounts.filter(
        (account) => account.organizationId === organizationId
      );

      return { ...wallet, accounts: accountsWithBalance };
    })
  );

  return walletWithAccounts;
}

export const parseTurnkeyError = (message: string, stringGetter: StringGetterFunction): string => {
  if (message.includes('User has already registered using this email')) {
    return stringGetter({ key: STRING_KEYS.USER_ALREADY_HAS_TURNKEY });
  }

  if (
    message.includes('unable to decrypt bundle using embedded key') ||
    message.includes('Organization ID is not available') ||
    message.includes('Unauthenticated desc') ||
    message.includes('Organization ID was not found')
  ) {
    return stringGetter({ key: STRING_KEYS.INVALID_TURNKEY_EMAIL_LINK });
  }

  return stringGetter({
    key: STRING_KEYS.SOMETHING_WENT_WRONG_WITH_MESSAGE,
    params: { ERROR_MESSAGE: message },
  });
};
