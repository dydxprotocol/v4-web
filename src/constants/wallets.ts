import type { ExternalProvider } from '@ethersproject/providers';
import { USDC_DENOM, type onboarding, DYDX_DENOM } from '@dydxprotocol/v4-client-js';
import type { suggestChain } from 'graz';

import { STRING_KEYS } from '@/constants/localization';

import {
  BitkeepIcon,
  BitpieIcon,
  CloverWalletIcon,
  CoinbaseIcon,
  Coin98Icon,
  GenericWalletIcon,
  HuobiIcon,
  ImTokenIcon,
  KeplrIcon,
  MathWalletIcon,
  MetaMaskIcon,
  RainbowIcon,
  TokenPocketIcon,
  TrustWalletIcon,
  WalletConnectIcon,
} from '@/icons';

import { isMetaMask } from '@/lib/wallet/providers';

// Wallet connection types

export enum WalletConnectionType {
  CoinbaseWalletSdk = 'coinbaseWalletSdk',
  CosmosSigner = 'CosmosSigner',
  InjectedEip1193 = 'injectedEip1193',
  WalletConnect1 = 'walletConnect1',
  WalletConnect2 = 'walletConnect2',
}

export enum WalletErrorType {
  // General
  ChainMismatch,
  UserCanceled,

  // Non-Deterministic
  NonDeterministicWallet,

  // Misc
  Unknown,
}

type WalletConnectionTypeConfig = {
  name: string;
  wagmiConnectorId?: string;
};

export const walletConnectionTypes: Record<WalletConnectionType, WalletConnectionTypeConfig> = {
  [WalletConnectionType.CoinbaseWalletSdk]: {
    name: 'Coinbase Wallet SDK',
    wagmiConnectorId: 'coinbaseWallet',
  },
  [WalletConnectionType.InjectedEip1193]: {
    name: 'injected EIP-1193 provider',
    wagmiConnectorId: 'injected',
  },
  [WalletConnectionType.WalletConnect1]: {
    name: 'WalletConnect 1.0',
    wagmiConnectorId: 'walletConnectLegacy',
  },
  [WalletConnectionType.WalletConnect2]: {
    name: 'WalletConnect 2.0',
    wagmiConnectorId: 'walletConnect',
  },
  [WalletConnectionType.CosmosSigner]: {
    name: 'CosmosSigner',
  },
};

// Wallets

export enum WalletType {
  BitKeep = 'BITKEEP',
  BitPie = 'BITPIE',
  CloverWallet = 'CLOVER_WALLET',
  CoinbaseWallet = 'COINBASE_WALLET',
  Coin98 = 'COIN98',
  HuobiWallet = 'HUOBI_WALLET',
  ImToken = 'IMTOKEN',
  Keplr = 'KEPLR',
  // Ledger = 'LEDGER',
  MathWallet = 'MATH_WALLET',
  MetaMask = 'METAMASK',
  Rainbow = 'RAINBOW_WALLET',
  TokenPocket = 'TOKEN_POCKET',
  TrustWallet = 'TRUST_WALLET',
  WalletConnect = 'WALLETCONNECT',
  WalletConnect2 = 'WALLETCONNECT_2',
  // TestWallet = 'TEST_WALLET',
  OtherWallet = 'OTHER_WALLET',
}

type WalletConfig = {
  type: WalletType;
  stringKey: string;
  icon: string;
  connectionTypes: WalletConnectionType[];
  matchesInjectedEip1193?: (provider: ExternalProvider & any) => boolean;
  walletconnect1Name?: string;
  walletconnect2Id?: string;
};

export const wallets: Record<WalletType, WalletConfig> = {
  [WalletType.OtherWallet]: {
    type: WalletType.OtherWallet,
    stringKey: STRING_KEYS.OTHER_WALLET,
    icon: GenericWalletIcon,
    connectionTypes: [
      WalletConnectionType.InjectedEip1193,
      // WalletConnectionType.CoinbaseWalletSdk,
      WalletConnectionType.WalletConnect2,
      WalletConnectionType.WalletConnect1,
    ],
    matchesInjectedEip1193: (provider) =>
      Object.entries(wallets).every(
        ([walletType, walletConfig]) =>
          walletType === WalletType.OtherWallet ||
          !walletConfig.matchesInjectedEip1193 ||
          !walletConfig.matchesInjectedEip1193(provider)
      ),
  },
  [WalletType.BitKeep]: {
    type: WalletType.BitKeep,
    stringKey: STRING_KEYS.BITKEEP,
    icon: BitkeepIcon,
    connectionTypes: [
      WalletConnectionType.InjectedEip1193,
      WalletConnectionType.WalletConnect2,
      WalletConnectionType.WalletConnect1,
    ],
    matchesInjectedEip1193: (provider) => provider.isBitKeep, // isBitKeepChrome, isBitEthereum
    walletconnect1Name: 'bitkeep',
    walletconnect2Id: '38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662',
  },
  [WalletType.BitPie]: {
    type: WalletType.BitPie,
    stringKey: STRING_KEYS.BITPIE,
    icon: BitpieIcon,
    connectionTypes: [WalletConnectionType.InjectedEip1193, WalletConnectionType.WalletConnect1],
    matchesInjectedEip1193: (provider) => provider.isBitpie,
    walletconnect1Name: 'bitpie',
  },
  [WalletType.CloverWallet]: {
    type: WalletType.CloverWallet,
    stringKey: STRING_KEYS.CLOVER_WALLET,
    icon: CloverWalletIcon,
    connectionTypes: [WalletConnectionType.InjectedEip1193, WalletConnectionType.WalletConnect1],
    matchesInjectedEip1193: (provider) => provider.isClover,
    // walletconnect1Name: 'clover',
  },
  [WalletType.CoinbaseWallet]: {
    type: WalletType.CoinbaseWallet,
    stringKey: STRING_KEYS.COINBASE_WALLET,
    icon: CoinbaseIcon,
    connectionTypes: [
      WalletConnectionType.CoinbaseWalletSdk,
      WalletConnectionType.InjectedEip1193,
      WalletConnectionType.WalletConnect1,
    ],
    matchesInjectedEip1193: (provider) => provider.isCoinbaseWallet, // provider.selectedProvider?.isCoinbaseWallet,
    walletconnect1Name: 'coinbase',
  },
  [WalletType.Coin98]: {
    type: WalletType.Coin98,
    stringKey: STRING_KEYS.COIN98,
    icon: Coin98Icon,
    connectionTypes: [
      WalletConnectionType.InjectedEip1193,
      WalletConnectionType.WalletConnect2,
      WalletConnectionType.WalletConnect1,
    ],
    matchesInjectedEip1193: (provider) => provider.isCoin98,
    walletconnect1Name: 'coin98',
    walletconnect2Id: '2a3c89040ac3b723a1972a33a125b1db11e258a6975d3a61252cd64e6ea5ea01',
  },
  [WalletType.HuobiWallet]: {
    type: WalletType.HuobiWallet,
    stringKey: STRING_KEYS.HUOBI_WALLET,
    icon: HuobiIcon,
    connectionTypes: [
      WalletConnectionType.InjectedEip1193,
      WalletConnectionType.WalletConnect2,
      WalletConnectionType.WalletConnect1,
    ],
    matchesInjectedEip1193: (provider) => provider.isHbWallet,
    walletconnect2Id: '797c615e2c556b610c048eb35535f212c0dd58de5d03e763120e90a7d1350a77',
  },
  [WalletType.ImToken]: {
    type: WalletType.ImToken,
    stringKey: STRING_KEYS.IMTOKEN,
    icon: ImTokenIcon,
    connectionTypes: [
      WalletConnectionType.InjectedEip1193,
      WalletConnectionType.WalletConnect2,
      WalletConnectionType.WalletConnect1,
    ],
    matchesInjectedEip1193: (provider) => provider.isImToken,
    walletconnect1Name: 'imtoken',
    walletconnect2Id: 'ef333840daf915aafdc4a004525502d6d49d77bd9c65e0642dbaefb3c2893bef',
  },
  [WalletType.MathWallet]: {
    type: WalletType.MathWallet,
    stringKey: STRING_KEYS.MATH_WALLET,
    icon: MathWalletIcon,
    connectionTypes: [WalletConnectionType.InjectedEip1193, WalletConnectionType.WalletConnect1],
    matchesInjectedEip1193: (provider) => provider.isMathWallet,
    walletconnect1Name: 'math',
    walletconnect2Id: '7674bb4e353bf52886768a3ddc2a4562ce2f4191c80831291218ebd90f5f5e26',
  },
  [WalletType.MetaMask]: {
    type: WalletType.MetaMask,
    stringKey: STRING_KEYS.METAMASK,
    icon: MetaMaskIcon,
    connectionTypes: [
      WalletConnectionType.InjectedEip1193,
      WalletConnectionType.WalletConnect2,
      WalletConnectionType.WalletConnect1,
    ],
    matchesInjectedEip1193: isMetaMask,
    walletconnect1Name: 'metamask',
    walletconnect2Id: 'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
  },
  [WalletType.Rainbow]: {
    type: WalletType.Rainbow,
    stringKey: STRING_KEYS.RAINBOW_WALLET,
    icon: RainbowIcon,
    connectionTypes: [
      WalletConnectionType.InjectedEip1193,
      WalletConnectionType.WalletConnect2,
      WalletConnectionType.WalletConnect1,
    ],
    matchesInjectedEip1193: (provider) => provider.isRainbowWallet,
    walletconnect1Name: 'rainbow',
    walletconnect2Id: '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369',
  },
  [WalletType.TokenPocket]: {
    type: WalletType.TokenPocket,
    stringKey: STRING_KEYS.TOKEN_POCKET,
    icon: TokenPocketIcon,
    connectionTypes: [
      WalletConnectionType.InjectedEip1193,
      WalletConnectionType.WalletConnect2,
      WalletConnectionType.WalletConnect1,
    ],
    matchesInjectedEip1193: (provider) => provider.isTokenPocket,
    walletconnect1Name: 'tokenpocket',
    walletconnect2Id: '20459438007b75f4f4acb98bf29aa3b800550309646d375da5fd4aac6c2a2c66',
  },
  [WalletType.TrustWallet]: {
    type: WalletType.TrustWallet,
    stringKey: STRING_KEYS.TRUST_WALLET,
    icon: TrustWalletIcon,
    connectionTypes: [
      WalletConnectionType.InjectedEip1193,
      WalletConnectionType.WalletConnect2,
      WalletConnectionType.WalletConnect1,
    ],
    matchesInjectedEip1193: (provider) => provider.isTrust,
    walletconnect1Name: 'trust',
    walletconnect2Id: '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
  },
  [WalletType.WalletConnect2]: {
    type: WalletType.WalletConnect,
    stringKey: STRING_KEYS.WALLET_CONNECT_2,
    icon: WalletConnectIcon,
    connectionTypes: [WalletConnectionType.WalletConnect2],
  },
  [WalletType.WalletConnect]: {
    type: WalletType.WalletConnect,
    stringKey: STRING_KEYS.WALLET_CONNECT,
    icon: WalletConnectIcon,
    connectionTypes: [WalletConnectionType.WalletConnect1],
  },
  [WalletType.Keplr]: {
    type: WalletType.Keplr,
    stringKey: STRING_KEYS.KEPLR,
    icon: KeplrIcon,
    connectionTypes: [WalletConnectionType.CosmosSigner],
  },
};

// Injected EIP-1193 Providers
export type InjectedEthereumProvider = ExternalProvider;

export type InjectedWeb3Provider = ExternalProvider;

export type InjectedCoinbaseWalletExtensionProvider = InjectedEthereumProvider & {
  isMetaMask: true;
  overrideIsMetaMask: true;
  providerMap: Map<'MetaMask' | 'CoinbaseWallet', ExternalProvider>;
  providers: ExternalProvider[];
};

export type WithInjectedEthereumProvider = {
  ethereum: InjectedEthereumProvider;
};

export type WithInjectedWeb3Provider = {
  web3: {
    currentProvider: InjectedWeb3Provider;
  };
};

// Wallet connections

export type WalletConnection = {
  type: WalletConnectionType;
  provider?: ExternalProvider;
};

// dYdX Chain wallets
export const COSMOS_DERIVATION_PATH = "m/44'/118'/0'/0/0";

/**
 * @description typed data to sign for v4 onboarding
 */
export const SIGN_TYPED_DATA = {
  primaryType: 'dYdX',
  domain: {
    name: 'dYdX V4',
  },
  types: {
    dYdX: [{ name: 'action', type: 'string' }],
  },
  message: {
    action: 'dYdX V4 Onboarding',
  },
} as const;

export type PrivateInformation = ReturnType<typeof onboarding.deriveHDKeyFromEthereumSignature>;

export type EvmAddress = `0x${string}`;
export type DydxAddress = `dydx${string}`;

export const DYDX_CHAIN_INFO: Parameters<typeof suggestChain>[0] = {
  rpc: '13.59.4.93:26657',
  rest: '13.59.4.93:1317',
  chainId: 'dydx-testnet-2',
  chainName: 'dYdX Public Testnet',
  chainSymbolImageUrl:
    'https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/dydx-testnet-2/chain.png',
  bech32Config: {
    bech32PrefixAccPub: 'dydxpub',
    bech32PrefixValPub: 'dydxvaloperpub',
    bech32PrefixAccAddr: 'dydx',
    bech32PrefixConsPub: 'dydxvalconspub',
    bech32PrefixValAddr: 'dydxvaloper',
    bech32PrefixConsAddr: 'dydxvalcons',
  },
  bip44: {
    coinType: 118,
  },
  stakeCurrency: {
    coinDenom: 'DV4TNT',
    coinDecimals: 6,
    coinMinimalDenom: 'dv4tnt',
  },
  currencies: [
    {
      coinDenom: 'DV4TNT',
      coinDecimals: 6,
      coinMinimalDenom: 'dv4tnt',
    },
    {
      coinDenom: 'USDC',
      coinMinimalDenom: 'ibc/8E27BA2D5493AF5636760E354E46004562C46AB7EC0CC4C1CA14E9E20E2545B5',
      coinDecimals: 6,
    },
  ],
  feeCurrencies: [
    {
      coinDenom: 'DV4TNT',
      coinDecimals: 6,
      coinMinimalDenom: 'dv4tnt',
    },
  ],
  features: [],
};

export enum DydxChainAsset {
  USDC = 'USDC',
  DYDX = 'Dv4TNT',
}

export const DYDX_CHAIN_ASSET_COIN_DENOM: Record<DydxChainAsset, string> = {
  [DydxChainAsset.USDC]: USDC_DENOM,
  [DydxChainAsset.DYDX]: DYDX_DENOM,
};
