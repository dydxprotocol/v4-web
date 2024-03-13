import { isDev } from '@/constants/networks';
import { WalletType } from '@/constants/wallets';

import { isTruthy } from '@/lib/isTruthy';

export const useDisplayedWallets = () => {
  return [
    WalletType.MetaMask,

    isDev && WalletType.Keplr,

    WalletType.WalletConnect2,

    WalletType.CoinbaseWallet,

    WalletType.OkxWallet,
    // Hide these wallet options until they can be properly tested on mainnet
    // WalletType.ImToken,
    // WalletType.Rainbow,
    // WalletType.TrustWallet,
    // WalletType.HuobiWallet,
    // WalletType.BitKeep,
    // WalletType.Coin98,

    WalletType.Email,
    WalletType.Discord,
    WalletType.Twitter,
    WalletType.OtherWallet,
  ].filter(isTruthy);
};
