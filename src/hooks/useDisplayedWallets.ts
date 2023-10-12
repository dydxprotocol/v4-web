import { WalletType } from '@/constants/wallets';

import { isTruthy } from '@/lib/isTruthy';

export const useDisplayedWallets = () => {
  return [
    WalletType.MetaMask,

    import.meta.env.MODE !== 'production' && WalletType.Keplr,

    WalletType.WalletConnect2,
    
    WalletType.CoinbaseWallet,
    
    // Hide these wallet options until they can be properly tested on mainnet
    // WalletType.ImToken,
    // WalletType.Rainbow,
    // WalletType.TrustWallet,
    // WalletType.HuobiWallet,
    // WalletType.BitKeep,
    // WalletType.Coin98,

    WalletType.OtherWallet,
  ].filter(isTruthy);
};
