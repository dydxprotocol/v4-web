import { useMemo } from 'react';

import { WalletType as CosmosWalletType } from 'graz';

import { StatsigFlags } from '@/constants/statsig';
import {
  COINBASE_MIPD_RDNS,
  ConnectorType,
  KEPLR_MIPD_RDNS,
  METAMASK_DOWNLOAD_LINK,
  OKX_MIPD_RDNS,
  PHANTOM_MIPD_RDNS,
  WalletInfo,
  WalletType,
} from '@/constants/wallets';

import { isTruthy } from '@/lib/isTruthy';

import { useMipdInjectedWallets } from './useMipdInjectedWallets';
import { useStatsigGateValue } from './useStatsig';

export const useDisplayedWallets = (): WalletInfo[] => {
  const keplrEnabled = useStatsigGateValue(StatsigFlags.ffEnableKeplr);
  const injectedWallets = useMipdInjectedWallets();

  return useMemo(() => {
    const phantomDetected =
      injectedWallets.findIndex((wallet) => wallet.detail.info.rdns === PHANTOM_MIPD_RDNS) !== -1;

    const okxDetected =
      injectedWallets.findIndex((wallet) => wallet.detail.info.rdns === OKX_MIPD_RDNS) !== -1;

    const enabledInjectedWallets = injectedWallets
      .filter(
        (wallet) =>
          // Remove Phantom EVM support, but enable Phantom Solana support based on EIP-6963 detection
          wallet.detail.info.rdns !== PHANTOM_MIPD_RDNS &&
          // Remove Keplr EVM support since Keplr Cosmos is supported
          wallet.detail.info.rdns !== KEPLR_MIPD_RDNS &&
          // Remove Coinbase injected support because the regular Coinbase connector already supports
          // handling switching between injected/mobile/smart account
          wallet.detail.info.rdns !== COINBASE_MIPD_RDNS
      )
      .map(
        (wallet) =>
          ({
            connectorType: ConnectorType.Injected,
            icon: wallet.detail.info.icon,
            name: wallet.detail.info.name,
            rdns: wallet.detail.info.rdns,
          }) as WalletInfo
      );

    // Phantom wallet must be in the 2nd slot.
    if (phantomDetected) {
      enabledInjectedWallets.splice(1, 0, {
        connectorType: ConnectorType.PhantomSolana,
        name: WalletType.Phantom,
      });
    }

    return [
      // If the user does not have any injected wallets installed, show Metamask as the first option
      // with a download link since it the recommended wallet
      !enabledInjectedWallets.length && {
        connectorType: ConnectorType.DownloadWallet,
        name: WalletType.MetaMask,
        downloadLink: METAMASK_DOWNLOAD_LINK,
      },

      ...enabledInjectedWallets,

      keplrEnabled && {
        connectorType: ConnectorType.Cosmos,
        name: CosmosWalletType.KEPLR,
      },

      { connectorType: ConnectorType.WalletConnect, name: WalletType.WalletConnect2 },

      { connectorType: ConnectorType.Coinbase, name: WalletType.CoinbaseWallet },

      // No need to special-case an OKX WalletConnect option if the OKX extension wallet is already detected.
      // Note that OKX mobile app users can still connect through the generic WalletConnect option
      !okxDetected && { connectorType: ConnectorType.WalletConnect, name: WalletType.OkxWallet },

      Boolean(import.meta.env.VITE_PRIVY_APP_ID) && {
        connectorType: ConnectorType.Privy,
        name: WalletType.Privy,
      },

      { connectorType: ConnectorType.WalletConnect, name: WalletType.OtherWallet },
    ].filter(isTruthy) as WalletInfo[];
  }, [injectedWallets, keplrEnabled]);
};
