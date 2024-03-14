import { isDev } from '@/constants/networks';
import { WalletType } from '@/constants/wallets';

import { isTruthy } from '@/lib/isTruthy';
import { testFlags } from '@/lib/testFlags';

export const useDisplayedWallets = () => {
  const displayedWallets = [
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

    WalletType.OtherWallet,
  ].filter(isTruthy);

  if (testFlags.displayEmailLogin) {
    displayedWallets.push(WalletType.Email);
  }

  if (testFlags.displaySocialLogin) {
    displayedWallets.push(
      WalletType.Discord,
      WalletType.Twitter,
      WalletType.Google,
      WalletType.Apple
    );
  }

  return displayedWallets;
};
