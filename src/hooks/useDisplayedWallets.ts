import { isDev } from '@/constants/networks';
import { WalletType } from '@/constants/wallets';

import { isTruthy } from '@/lib/isTruthy';

export const useDisplayedWallets = () => {
  const displayedWallets = [
    WalletType.MetaMask,

    isDev && WalletType.Keplr,

    WalletType.WalletConnect2,

    WalletType.CoinbaseWallet,

    WalletType.OkxWallet,
    WalletType.Phantom,
    // Hide these wallet options until they can be properly tested on mainnet
    // WalletType.ImToken,
    // WalletType.Rainbow,
    // WalletType.TrustWallet,
    // WalletType.HuobiWallet,
    // WalletType.BitKeep,
    // WalletType.Coin98,

    Boolean(import.meta.env.VITE_PRIVY_APP_ID) && WalletType.Privy,

    WalletType.OtherWallet,
  ].filter(isTruthy);

  return displayedWallets;
};
