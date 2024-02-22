import type { ExternalProvider } from '@ethersproject/providers';

import {
  type InjectedEthereumProvider,
  type InjectedCoinbaseWalletExtensionProvider,
  type WithInjectedEthereumProvider,
  type WithInjectedWeb3Provider,
  type WithInjectedOkxWalletProvider,
} from '@/constants/wallets';

import { isTruthy } from '../isTruthy';

// Injected EIP-1193 Providers
/* prettier-ignore */
export const isMetaMask = (provider: ExternalProvider) => (
  Boolean(provider.isMetaMask)
    
  /* not Coinbase Wallet browser extension */
  && (
    !(provider as InjectedCoinbaseWalletExtensionProvider).overrideIsMetaMask
  )
)

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

export const detectInjectedEip1193Providers = (): ExternalProvider[] => {
  const ethereumProvider = (globalThis as typeof globalThis & WithInjectedEthereumProvider)
    ?.ethereum;

  const web3Provider = (globalThis as typeof globalThis & WithInjectedWeb3Provider)?.web3
    ?.currentProvider;

  const displacedProviders = isCoinbaseWalletBrowserExtension(ethereumProvider)
    ? ethereumProvider.providers
    : [];

  const okxWalletProvider = (globalThis as typeof globalThis & WithInjectedOkxWalletProvider)
    ?.okxwallet;

  return [...displacedProviders, ethereumProvider, web3Provider, okxWalletProvider].filter(
    isTruthy
  );
};
