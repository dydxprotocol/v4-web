import { useMemo } from 'react';

import { type WalletType as CosmosWalletType } from 'graz';

import {
  COINBASE_MIPD_RDNS,
  ConnectorType,
  KEPLR_DOWNLOAD_LINK,
  KEPLR_MIPD_RDNS,
  METAMASK_MIPD_RDNS,
  OKX_MIPD_RDNS,
  PHANTOM_DOWNLOAD_LINK,
  PHANTOM_MIPD_RDNS,
  WalletInfo,
  WalletType,
} from '@/constants/wallets';

import { isTruthy } from '@/lib/isTruthy';
import { testFlags } from '@/lib/testFlags';

import { useBreakpoints } from './useBreakpoints';
import { MipdInjectedWallet, useMipdInjectedWallets } from './useMipdInjectedWallets';

const getWalletInfoFromInjectedWallet = (wallet: MipdInjectedWallet) => {
  return {
    connectorType: ConnectorType.Injected,
    icon: wallet.detail.info.icon,
    name: wallet.detail.info.name,
    rdns: wallet.detail.info.rdns,
  } as WalletInfo;
};

export const useDisplayedWallets = (): WalletInfo[] => {
  const injectedWallets = useMipdInjectedWallets();
  const { isTablet } = useBreakpoints();
  const isSimpleUi = isTablet && testFlags.simpleUi;

  return useMemo(() => {
    const isPhantomDetected = Boolean(window.phantom?.solana);
    const isKeplrDetected = Boolean(window.keplr);

    const isOkxDetected =
      injectedWallets.findIndex((wallet) => wallet.detail.info.rdns === OKX_MIPD_RDNS) !== -1;

    const injectedMetaMask = injectedWallets.find(
      (wallet) => wallet.detail.info.rdns === METAMASK_MIPD_RDNS
    );

    const otherInjectedWallets = injectedWallets
      .filter(
        (wallet) =>
          // Remove Metamask. We will always show it at the first spot if it exists
          wallet.detail.info.rdns !== METAMASK_MIPD_RDNS &&
          // Remove Phantom EVM support
          wallet.detail.info.rdns !== PHANTOM_MIPD_RDNS &&
          // Remove Keplr EVM support since Keplr Cosmos is supported
          wallet.detail.info.rdns !== KEPLR_MIPD_RDNS &&
          // Remove Coinbase injected support because the regular Coinbase connector already supports
          // handling switching between injected/mobile/smart account
          wallet.detail.info.rdns !== COINBASE_MIPD_RDNS
      )
      .map(getWalletInfoFromInjectedWallet);

    const phantomWallet = isPhantomDetected
      ? {
          connectorType: ConnectorType.PhantomSolana,
          name: WalletType.Phantom,
        }
      : {
          connectorType: ConnectorType.DownloadWallet,
          name: WalletType.Phantom,
          downloadLink: PHANTOM_DOWNLOAD_LINK,
        };

    const keplrWallet = isKeplrDetected
      ? {
          connectorType: ConnectorType.Cosmos,
          name: 'keplr' as CosmosWalletType.KEPLR,
        }
      : {
          connectorType: ConnectorType.DownloadWallet,
          name: WalletType.Keplr,
          downloadLink: KEPLR_DOWNLOAD_LINK,
        };

    if (isSimpleUi) {
      return [
        injectedMetaMask && getWalletInfoFromInjectedWallet(injectedMetaMask),
        ...otherInjectedWallets,
        isPhantomDetected && phantomWallet,
        isKeplrDetected && keplrWallet,
        { connectorType: ConnectorType.WalletConnect, name: WalletType.WalletConnect2 },
        isOkxDetected && { connectorType: ConnectorType.WalletConnect, name: WalletType.OkxWallet },
        Boolean(import.meta.env.VITE_PRIVY_APP_ID) && {
          connectorType: ConnectorType.Privy,
          name: WalletType.Privy,
        },
      ].filter(isTruthy) as WalletInfo[];
    }

    return [
      // always show Metamask extension first if it is detected
      injectedMetaMask && getWalletInfoFromInjectedWallet(injectedMetaMask),
      ...otherInjectedWallets,
      phantomWallet,
      keplrWallet,
      { connectorType: ConnectorType.WalletConnect, name: WalletType.WalletConnect2 },
      { connectorType: ConnectorType.Coinbase, name: WalletType.CoinbaseWallet },
      Boolean(import.meta.env.VITE_PRIVY_APP_ID) && {
        connectorType: ConnectorType.Privy,
        name: WalletType.Privy,
      },

      // No need to special-case an OKX WalletConnect option if the OKX extension wallet is already detected.
      // Note that OKX mobile app users can still connect through the generic WalletConnect option
      !isOkxDetected && { connectorType: ConnectorType.WalletConnect, name: WalletType.OkxWallet },
    ].filter(isTruthy) as WalletInfo[];
  }, [injectedWallets]);
};
