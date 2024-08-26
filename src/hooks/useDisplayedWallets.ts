import { isDev, isTestnet } from '@/constants/networks';
import { StatSigFlags } from '@/constants/statsig';
import { WalletType } from '@/constants/wallets';

import { isTruthy } from '@/lib/isTruthy';

import { useStatsigGateValue } from './useStatsig';

export const useDisplayedWallets = () => {
  const keplrEnabled = useStatsigGateValue(StatSigFlags.ffEnableKeplr);

  const displayedWallets = [
    WalletType.MetaMask,

    keplrEnabled && WalletType.Keplr,

    Boolean(isTestnet || isDev) && WalletType.Phantom,

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

    Boolean(import.meta.env.VITE_PRIVY_APP_ID) && WalletType.Privy,

    WalletType.OtherWallet,
  ].filter(isTruthy);

  return displayedWallets;
};
