import { useMemo } from 'react';

import { WalletType as CosmosWalletType } from 'graz';

import { StatsigFlags } from '@/constants/statsig';
import {
  COINBASE_MIPD_RDNS,
  ConnectorType,
  KEPLR_DOWNLOAD_LINK,
  KEPLR_MIPD_RDNS,
  METAMASK_DOWNLOAD_LINK,
  METAMASK_MIPD_RDNS,
  OKX_MIPD_RDNS,
  PHANTOM_DOWNLOAD_LINK,
  PHANTOM_MIPD_RDNS,
  WalletInfo,
  WalletType,
} from '@/constants/wallets';

import { isTruthy } from '@/lib/isTruthy';

import { MipdInjectedWallet, useMipdInjectedWallets } from './useMipdInjectedWallets';
import { useStatsigGateValue } from './useStatsig';

const getWalletInfoFromInjectedWallet = (wallet: MipdInjectedWallet) => {
  return {
    connectorType: ConnectorType.Injected,
    icon: wallet.detail.info.icon,
    name: wallet.detail.info.name,
    rdns: wallet.detail.info.rdns,
  } as WalletInfo;
};

export const useDisplayedWallets = (): WalletInfo[] => {
  const keplrEnabled = useStatsigGateValue(StatsigFlags.ffEnableKeplr);
  const injectedWallets = useMipdInjectedWallets();

  return useMemo(() => {
    const phantomDetected = Boolean(window.phantom?.solana);
    const keplrDetected = Boolean(window.keplr);

    const okxDetected =
      injectedWallets.findIndex((wallet) => wallet.detail.info.rdns === OKX_MIPD_RDNS) !== -1;

    const injectedMetaMask = injectedWallets.find(
      (wallet) => wallet.detail.info.rdns === METAMASK_MIPD_RDNS
    );

    const enabledInjectedWallets = injectedWallets
      .filter(
        (wallet) =>
          // Remove Metamask. We will always show it at the first spot regardless of detection
          wallet.detail.info.rdns !== METAMASK_MIPD_RDNS &&
          // Remove Phantom EVM support, but enable Phantom Solana support based on EIP-6963 detection
          wallet.detail.info.rdns !== PHANTOM_MIPD_RDNS &&
          // Remove Keplr EVM support since Keplr Cosmos is supported
          wallet.detail.info.rdns !== KEPLR_MIPD_RDNS &&
          // Remove Coinbase injected support because the regular Coinbase connector already supports
          // handling switching between injected/mobile/smart account
          wallet.detail.info.rdns !== COINBASE_MIPD_RDNS
      )
      .map(getWalletInfoFromInjectedWallet);

    const metamaskWallet = injectedMetaMask
      ? getWalletInfoFromInjectedWallet(injectedMetaMask)
      : {
          connectorType: ConnectorType.DownloadWallet,
          name: WalletType.MetaMask,
          downloadLink: METAMASK_DOWNLOAD_LINK,
        };

    const phantomWallet = phantomDetected
      ? {
          connectorType: ConnectorType.PhantomSolana,
          name: WalletType.Phantom,
        }
      : {
          connectorType: ConnectorType.DownloadWallet,
          name: WalletType.Phantom,
          downloadLink: PHANTOM_DOWNLOAD_LINK,
        };

    const keplrWallet = keplrDetected
      ? {
          connectorType: ConnectorType.Cosmos,
          name: CosmosWalletType.KEPLR,
        }
      : {
          connectorType: ConnectorType.DownloadWallet,
          name: WalletType.Keplr,
          downloadLink: KEPLR_DOWNLOAD_LINK,
        };

    return [
      // If the user does not have any injected wallets installed, show Metamask as the first option
      // with a download link since it the recommended wallet
      metamaskWallet,
      phantomWallet,
      keplrEnabled && keplrWallet,
      { connectorType: ConnectorType.WalletConnect, name: WalletType.WalletConnect2 },

      ...enabledInjectedWallets,

      { connectorType: ConnectorType.Coinbase, name: WalletType.CoinbaseWallet },
      Boolean(import.meta.env.VITE_PRIVY_APP_ID) && {
        connectorType: ConnectorType.Privy,
        name: WalletType.Privy,
      },

      // No need to special-case an OKX WalletConnect option if the OKX extension wallet is already detected.
      // Note that OKX mobile app users can still connect through the generic WalletConnect option
      !okxDetected && { connectorType: ConnectorType.WalletConnect, name: WalletType.OkxWallet },
    ].filter(isTruthy) as WalletInfo[];
  }, [injectedWallets, keplrEnabled]);
};
