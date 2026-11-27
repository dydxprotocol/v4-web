import type { StringGetterFunction } from '@/constants/localization';
import { ConnectorType, WalletInfo, wallets } from '@/constants/wallets';

// Brand names do not require an entry in the separately published localization package.
export const getWalletName = (wallet: WalletInfo, stringGetter: StringGetterFunction): string => {
  if (wallet.connectorType === ConnectorType.Injected) return wallet.name;

  if (!Object.prototype.hasOwnProperty.call(wallets, wallet.name)) return wallet.name;
  const walletConfig = wallets[wallet.name as keyof typeof wallets];
  if ('displayName' in walletConfig) return walletConfig.displayName;
  return stringGetter({ key: walletConfig.stringKey });
};
