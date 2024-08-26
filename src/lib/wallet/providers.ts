import { EIP1193Provider } from 'viem';

import {
  type InjectedCoinbaseWalletExtensionProvider,
  type InjectedEthereumProvider,
  type WithInjectedEthereumProvider,
  type WithInjectedOkxWalletProvider,
  WithInjectedPhantomWalletProvider,
  type WithInjectedWeb3Provider,
} from '@/constants/wallets';

import { isTruthy } from '../isTruthy';

/*
  The Coinbase Wallet browser extension displaces existing injected EIP-1193 providers into a custom data structure, such that:
    globalThis.ethereum satisfies {
      isMetaMask: true;
      overrideIsMetaMask: true;
      providerMap: Map<'MetaMask' | 'CoinbaseWallet', ExternalProvider>;
      providers: ExternalProvider[];
    }
*/
const isCoinbaseWalletBrowserExtension = (
  ethereum: InjectedEthereumProvider | InjectedCoinbaseWalletExtensionProvider
): ethereum is InjectedCoinbaseWalletExtensionProvider =>
  ethereum && 'overrideIsMetaMask' in ethereum && ethereum.overrideIsMetaMask;

export const detectInjectedEip1193Providers = (): EIP1193Provider[] => {
  const ethereumProvider = (globalThis as typeof globalThis & WithInjectedEthereumProvider)
    ?.ethereum;

  const web3Provider = (globalThis as typeof globalThis & WithInjectedWeb3Provider)?.web3
    ?.currentProvider;

  const phantomProvider = (globalThis as typeof globalThis & WithInjectedPhantomWalletProvider)
    ?.phantom?.ethereum;

  const displacedProviders =
    isCoinbaseWalletBrowserExtension(ethereumProvider) || phantomProvider // Coinbase Wallet and Phantom Wallet place displaced providers on `window.ethereum.providers`
      ? (ethereumProvider as InjectedCoinbaseWalletExtensionProvider).providers
      : [];

  const okxWalletProvider = (globalThis as typeof globalThis & WithInjectedOkxWalletProvider)
    ?.okxwallet;

  return [...(displacedProviders ?? []), ethereumProvider, web3Provider, okxWalletProvider].filter(
    isTruthy
  );
};
