import { isDev, isTestnet } from '@/constants/networks';
import { WalletType } from '@/constants/wallets';

import { isTruthy } from '@/lib/isTruthy';

export const useDisplayedWallets = () => {
  const displayedWallets = [
    WalletType.MetaMask,

    (isTestnet || isDev) && WalletType.Phantom,

    isDev && WalletType.Keplr,

    WalletType.WalletConnect2,

    WalletType.CoinbaseWallet,

    WalletType.OkxWallet,

    WalletType.PhantomEvm,
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
