import { isDydxV4Network } from '@/constants/networks';
import { WalletType } from '@/constants/wallets';

import { isTruthy } from '@/lib/isTruthy';

import { useSelectedNetwork } from './useSelectedNetwork';

export const useDisplayedWallets = () => {
  const { selectedNetwork } = useSelectedNetwork();

  return [
    WalletType.MetaMask,

    import.meta.env.MODE !== 'production' && isDydxV4Network(selectedNetwork) && WalletType.Keplr,

    WalletType.WalletConnect2,
    WalletType.WalletConnect,

    WalletType.CoinbaseWallet,

    WalletType.ImToken,
    WalletType.Rainbow,
    WalletType.TrustWallet,
    WalletType.HuobiWallet,
    WalletType.BitKeep,
    WalletType.Coin98,

    WalletType.OtherWallet,
  ].filter(isTruthy);
};
