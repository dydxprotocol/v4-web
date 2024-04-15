import { type onboarding } from '@dydxprotocol/v4-client-js';
import type { ExternalProvider } from '@ethersproject/providers';
import type { suggestChain } from 'graz';
import { EIP1193Provider } from 'viem';

import { STRING_KEYS } from '@/constants/localization';

import {
  BitkeepIcon,
  BitpieIcon,
  CloverWalletIcon,
  Coin98Icon,
  CoinbaseIcon,
  EmailIcon,
  GenericWalletIcon,
  HuobiIcon,
  ImTokenIcon,
  KeplrIcon,
  MathWalletIcon,
  MetaMaskIcon,
  OkxWalletIcon,
  RainbowIcon,
  TokenPocketIcon,
  TrustWalletIcon,
  WalletConnectIcon,
} from '@/icons';

import { DydxChainId, WALLETS_CONFIG_MAP } from './networks';

// Wallet connection types

export enum WalletConnectionType {
  CoinbaseWalletSdk = 'coinbaseWalletSdk',
  CosmosSigner = 'CosmosSigner',
  Privy = 'Privy',
  InjectedEip1193 = 'injectedEip1193',
  WalletConnect2 = 'walletConnect2',
  TestWallet = 'TestWallet',
}

export enum WalletErrorType {
  // General
  ChainMismatch,
  UserCanceled,
  SwitchChainMethodMissing,

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
  [WalletConnectionType.WalletConnect2]: {
    name: 'WalletConnect 2.0',
    wagmiConnectorId: 'walletConnect',
  },
  [WalletConnectionType.CosmosSigner]: {
    name: 'CosmosSigner',
  },
  [WalletConnectionType.TestWallet]: {
    name: 'TestWallet',
  },
  [WalletConnectionType.Privy]: {
    name: 'Privy',
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
  OkxWallet = 'OKX_WALLET',
  Rainbow = 'RAINBOW_WALLET',
  TokenPocket = 'TOKEN_POCKET',
  TrustWallet = 'TRUST_WALLET',
  WalletConnect2 = 'WALLETCONNECT_2',
  TestWallet = 'TEST_WALLET',
  OtherWallet = 'OTHER_WALLET',
  Privy = 'PRIVY',
}

const WALLET_CONNECT_EXPLORER_RECOMMENDED_WALLETS = {
  Metamask: 'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
  imToken: 'ef333840daf915aafdc4a004525502d6d49d77bd9c65e0642dbaefb3c2893bef',
  TokenPocket: '20459438007b75f4f4acb98bf29aa3b800550309646d375da5fd4aac6c2a2c66',
  Trust: '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
  OkxWallet: '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709',
  Rainbow: '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369',
  Zerion: 'ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18',
  Ledger: '19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927',
  Fireblocks: '5864e2ced7c293ed18ac35e0db085c09ed567d67346ccb6f58a0327a75137489',
  Uniswap: 'c03dfee351b6fcc421b4494ea33b9d4b92a984f87aa76d1663bb28705e95034a',
  Robinhood: '8837dd9413b1d9b585ee937d27a816590248386d9dbf59f5cd3422dbbb65683e',
  '1inch': 'c286eebc742a537cd1d6818363e9dc53b21759a1e8e5d9b263d0c03ec7703576',
};

export const WALLET_CONNECT_EXPLORER_RECOMMENDED_IDS = Object.values(
  WALLET_CONNECT_EXPLORER_RECOMMENDED_WALLETS
);

type WalletConfig = {
  type: WalletType;
  stringKey: string;
  icon: string;
  connectionTypes: WalletConnectionType[];
  matchesInjectedEip1193?: (provider: ExternalProvider & any) => boolean;
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
    connectionTypes: [WalletConnectionType.InjectedEip1193, WalletConnectionType.WalletConnect2],
    matchesInjectedEip1193: (provider) => provider.isBitKeep, // isBitKeepChrome, isBitEthereum
  },
  [WalletType.BitPie]: {
    type: WalletType.BitPie,
    stringKey: STRING_KEYS.BITPIE,
    icon: BitpieIcon,
    connectionTypes: [WalletConnectionType.InjectedEip1193],
    matchesInjectedEip1193: (provider) => provider.isBitpie,
  },
  [WalletType.CloverWallet]: {
    type: WalletType.CloverWallet,
    stringKey: STRING_KEYS.CLOVER_WALLET,
    icon: CloverWalletIcon,
    connectionTypes: [WalletConnectionType.InjectedEip1193],
    matchesInjectedEip1193: (provider) => provider.isClover,
  },
  [WalletType.CoinbaseWallet]: {
    type: WalletType.CoinbaseWallet,
    stringKey: STRING_KEYS.COINBASE_WALLET,
    icon: CoinbaseIcon,
    connectionTypes: [
      WalletConnectionType.CoinbaseWalletSdk,
      WalletConnectionType.InjectedEip1193,
      WalletConnectionType.WalletConnect2,
    ],
    matchesInjectedEip1193: (provider) => provider.isCoinbaseWallet, // provider.selectedProvider?.isCoinbaseWallet,
  },
  [WalletType.Coin98]: {
    type: WalletType.Coin98,
    stringKey: STRING_KEYS.COIN98,
    icon: Coin98Icon,
    connectionTypes: [WalletConnectionType.InjectedEip1193, WalletConnectionType.WalletConnect2],
    matchesInjectedEip1193: (provider) => provider.isCoin98,
  },
  [WalletType.HuobiWallet]: {
    type: WalletType.HuobiWallet,
    stringKey: STRING_KEYS.HUOBI_WALLET,
    icon: HuobiIcon,
    connectionTypes: [WalletConnectionType.InjectedEip1193, WalletConnectionType.WalletConnect2],
    matchesInjectedEip1193: (provider) => provider.isHbWallet,
  },
  [WalletType.ImToken]: {
    type: WalletType.ImToken,
    stringKey: STRING_KEYS.IMTOKEN,
    icon: ImTokenIcon,
    connectionTypes: [WalletConnectionType.InjectedEip1193, WalletConnectionType.WalletConnect2],
    matchesInjectedEip1193: (provider) => provider.isImToken,
    walletconnect2Id: WALLET_CONNECT_EXPLORER_RECOMMENDED_WALLETS.imToken,
  },
  [WalletType.MathWallet]: {
    type: WalletType.MathWallet,
    stringKey: STRING_KEYS.MATH_WALLET,
    icon: MathWalletIcon,
    connectionTypes: [WalletConnectionType.InjectedEip1193],
    matchesInjectedEip1193: (provider) => provider.isMathWallet,
    walletconnect2Id: '7674bb4e353bf52886768a3ddc2a4562ce2f4191c80831291218ebd90f5f5e26',
  },
  [WalletType.MetaMask]: {
    type: WalletType.MetaMask,
    stringKey: STRING_KEYS.METAMASK,
    icon: MetaMaskIcon,
    connectionTypes: [WalletConnectionType.InjectedEip1193, WalletConnectionType.WalletConnect2],
    matchesInjectedEip1193: (provider) =>
      Boolean(provider.isMetaMask) && !provider.overrideIsMetaMask,
    walletconnect2Id: WALLET_CONNECT_EXPLORER_RECOMMENDED_WALLETS.Metamask,
  },
  [WalletType.OkxWallet]: {
    type: WalletType.OkxWallet,
    stringKey: STRING_KEYS.OKX_WALLET,
    icon: OkxWalletIcon,
    connectionTypes: [WalletConnectionType.InjectedEip1193, WalletConnectionType.WalletConnect2],
    matchesInjectedEip1193: (provider) => provider.isOkxWallet,
    walletconnect2Id: WALLET_CONNECT_EXPLORER_RECOMMENDED_WALLETS.OkxWallet,
  },
  [WalletType.Rainbow]: {
    type: WalletType.Rainbow,
    stringKey: STRING_KEYS.RAINBOW_WALLET,
    icon: RainbowIcon,
    connectionTypes: [WalletConnectionType.InjectedEip1193, WalletConnectionType.WalletConnect2],
    matchesInjectedEip1193: (provider) => provider.isRainbowWallet,
    walletconnect2Id: WALLET_CONNECT_EXPLORER_RECOMMENDED_WALLETS.Rainbow,
  },
  [WalletType.TokenPocket]: {
    type: WalletType.TokenPocket,
    stringKey: STRING_KEYS.TOKEN_POCKET,
    icon: TokenPocketIcon,
    connectionTypes: [WalletConnectionType.InjectedEip1193, WalletConnectionType.WalletConnect2],
    matchesInjectedEip1193: (provider) => provider.isTokenPocket,
    walletconnect2Id: WALLET_CONNECT_EXPLORER_RECOMMENDED_WALLETS.TokenPocket,
  },
  [WalletType.TrustWallet]: {
    type: WalletType.TrustWallet,
    stringKey: STRING_KEYS.TRUST_WALLET,
    icon: TrustWalletIcon,
    connectionTypes: [WalletConnectionType.InjectedEip1193, WalletConnectionType.WalletConnect2],
    matchesInjectedEip1193: (provider) => provider.isTrust,
    walletconnect2Id: WALLET_CONNECT_EXPLORER_RECOMMENDED_WALLETS.Trust,
  },
  [WalletType.WalletConnect2]: {
    type: WalletType.WalletConnect2,
    stringKey: STRING_KEYS.WALLET_CONNECT_2,
    icon: WalletConnectIcon,
    connectionTypes: [WalletConnectionType.WalletConnect2],
  },
  [WalletType.Keplr]: {
    type: WalletType.Keplr,
    stringKey: STRING_KEYS.KEPLR,
    icon: KeplrIcon,
    connectionTypes: [WalletConnectionType.CosmosSigner],
  },
  [WalletType.TestWallet]: {
    type: WalletType.TestWallet,
    stringKey: STRING_KEYS.TEST_WALLET,
    icon: GenericWalletIcon,
    connectionTypes: [WalletConnectionType.TestWallet],
  },
  [WalletType.Privy]: {
    type: WalletType.Privy,
    stringKey: STRING_KEYS.EMAIL_OR_SOCIAL,
    icon: EmailIcon,
    connectionTypes: [WalletConnectionType.Privy],
  },
};

// Injected EIP-1193 Providers
export type InjectedEthereumProvider = EIP1193Provider;

export type InjectedWeb3Provider = EIP1193Provider;

export type InjectedCoinbaseWalletExtensionProvider = InjectedEthereumProvider & {
  isMetaMask: true;
  overrideIsMetaMask: true;
  providerMap: Map<'MetaMask' | 'CoinbaseWallet', EIP1193Provider>;
  providers: EIP1193Provider[];
};

export type WithInjectedEthereumProvider = {
  ethereum: InjectedEthereumProvider;
};

export type WithInjectedWeb3Provider = {
  web3: {
    currentProvider: InjectedWeb3Provider;
  };
};

export type WithInjectedOkxWalletProvider = {
  okxwallet: InjectedWeb3Provider;
};

// Wallet connections

export type WalletConnection = {
  type: WalletConnectionType;
  provider?: EIP1193Provider;
};

/**
 * @description typed data to sign for dYdX Chain onboarding
 */
export const getSignTypedData = (selectedDydxChainId: DydxChainId) =>
  ({
    primaryType: 'dYdX',
    domain: {
      name: WALLETS_CONFIG_MAP[selectedDydxChainId].signTypedDataDomainName,
    },
    types: {
      dYdX: [{ name: 'action', type: 'string' }],
    },
    message: {
      action: WALLETS_CONFIG_MAP[selectedDydxChainId].signTypedDataAction,
    },
  }) as const;

export type PrivateInformation = ReturnType<typeof onboarding.deriveHDKeyFromEthereumSignature>;

export type EvmAddress = `0x${string}`;
export type DydxAddress = `dydx${string}`;

export const DYDX_MAINNET_CHAIN_INFO: Parameters<typeof suggestChain>[0]['chainInfo'] = {
  rpc: 'https://rpc-dydx.keplr.app',
  rest: 'https://lcd-dydx.keplr.app',
  chainId: 'dydx-mainnet-1',
  chainName: 'dYdX',
  chainSymbolImageUrl:
    'https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/dydx-mainnet/adydx.png',
  stakeCurrency: {
    coinDenom: 'DYDX',
    coinDecimals: 18,
    coinMinimalDenom: 'adydx',
    coinImageUrl:
      'https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/dydx-mainnet/adydx.png',
    coinGeckoId: 'dydx-chain',
  },
  bip44: {
    coinType: 118,
  },
  bech32Config: {
    bech32PrefixAccAddr: 'dydx',
    bech32PrefixAccPub: 'dydxpub',
    bech32PrefixValAddr: 'dydxvaloper',
    bech32PrefixValPub: 'dydxvaloperpub',
    bech32PrefixConsAddr: 'dydxvalcons',
    bech32PrefixConsPub: 'dydxvalconspub',
  },
  currencies: [
    {
      coinDenom: 'DYDX',
      coinDecimals: 18,
      coinMinimalDenom: 'adydx',
      coinImageUrl:
        'https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/dydx-mainnet/adydx.png',
      coinGeckoId: 'dydx-chain',
    },
  ],
  feeCurrencies: [
    {
      coinDenom: 'DYDX',
      coinDecimals: 18,
      coinMinimalDenom: 'adydx',
      coinImageUrl:
        'https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/dydx-mainnet/adydx.png',
      coinGeckoId: 'dydx-chain',
      gasPriceStep: {
        low: 12500000000,
        average: 12500000000,
        high: 20000000000,
      },
    },
    {
      coinDenom: 'USDC',
      coinMinimalDenom: 'ibc/8E27BA2D5493AF5636760E354E46004562C46AB7EC0CC4C1CA14E9E20E2545B5',
      coinDecimals: 6,
      gasPriceStep: {
        low: 0.025,
        average: 0.025,
        high: 0.03,
      },
    },
  ],
  walletUrlForStaking: 'https://wallet.keplr.app/chains/dydx',
  features: [],
};

export const DYDX_TESTNET_CHAIN_INFO: Parameters<typeof suggestChain>[0]['chainInfo'] = {
  rpc: 'https://rpc-dydx-testnet.keplr.app',
  rest: 'https://lcd-dydx-testnet.keplr.app',
  chainId: 'dydx-testnet-4',
  chainName: 'dydx Testnet',
  chainSymbolImageUrl:
    'https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/dydx-testnet/chain.png',
  bech32Config: {
    bech32PrefixAccAddr: 'dydx',
    bech32PrefixAccPub: 'dydxpub',
    bech32PrefixValAddr: 'dydxvaloper',
    bech32PrefixValPub: 'dydxvaloperpub',
    bech32PrefixConsAddr: 'dydxvalcons',
    bech32PrefixConsPub: 'dydxvalconspub',
  },
  bip44: {
    coinType: 118,
  },
  stakeCurrency: {
    coinDenom: 'DV4TNT',
    coinDecimals: 18,
    coinMinimalDenom: 'adv4tnt',
  },
  currencies: [
    {
      coinDenom: 'DV4TNT',
      coinDecimals: 18,
      coinMinimalDenom: 'adv4tnt',
    },
  ],
  feeCurrencies: [
    {
      coinDenom: 'DV4TNT',
      coinDecimals: 18,
      coinMinimalDenom: 'adv4tnt',
      gasPriceStep: {
        low: 25000000000,
        average: 25000000000,
        high: 50000000000,
      },
    },
  ],
  features: [],
};

export const NOBLE_MAINNET_CHAIN_INFO: Parameters<typeof suggestChain>[0]['chainInfo'] = {
  rpc: 'https://rpc-noble.keplr.app',
  rest: 'https://lcd-noble.keplr.app',
  chainId: 'noble-1',
  chainName: 'Noble',
  chainSymbolImageUrl:
    'https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/noble/chain.png',
  bip44: {
    coinType: 118,
  },
  bech32Config: {
    bech32PrefixAccAddr: 'noble',
    bech32PrefixAccPub: 'noblepub',
    bech32PrefixValAddr: 'noblevaloper',
    bech32PrefixValPub: 'noblevaloperpub',
    bech32PrefixConsAddr: 'noblevalcons',
    bech32PrefixConsPub: 'noblevalconspub',
  },
  currencies: [
    {
      coinDenom: 'USDC',
      coinMinimalDenom: 'uusdc',
      coinDecimals: 6,
      coinGeckoId: 'usd-coin',
      coinImageUrl:
        'https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/noble/uusdc.png',
    },
    {
      coinDenom: 'FRNZ',
      coinMinimalDenom: 'ufrienzies',
      coinDecimals: 6,
      coinImageUrl:
        'https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/noble/ufrienzies.png',
    },
  ],
  feeCurrencies: [
    {
      coinDenom: 'USDC',
      coinMinimalDenom: 'uusdc',
      coinDecimals: 6,
      coinGeckoId: 'usd-coin',
      coinImageUrl:
        'https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/noble/uusdc.png',
      gasPriceStep: {
        low: 0.1,
        average: 0.1,
        high: 0.2,
      },
    },
    {
      coinDenom: 'ATOM',
      coinMinimalDenom: 'ibc/EF48E6B1A1A19F47ECAEA62F5670C37C0580E86A9E88498B7E393EB6F49F33C0',
      coinDecimals: 6,
      gasPriceStep: {
        low: 0.01,
        average: 0.01,
        high: 0.02,
      },
    },
  ],
  features: [],
};

export const NOBLE_TESTNET_CHAIN_INFO: Parameters<typeof suggestChain>[0]['chainInfo'] = {
  chainId: 'grand-1',
  chainName: 'Grand',
  rpc: 'https://rpc.testnet.noble.strange.love',
  rest: 'https://api.testnet.noble.strange.love/',
  nodeProvider: {
    name: 'Strangelove',
    email: 'support@strange.love',
    website: 'https://strange.love/',
  },
  chainSymbolImageUrl:
    'https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/grand/chain.png',
  stakeCurrency: {
    coinDenom: 'STAKE',
    coinMinimalDenom: 'ustake',
    coinDecimals: 6,
  },
  bip44: {
    coinType: 118,
  },
  bech32Config: {
    bech32PrefixAccAddr: 'noble',
    bech32PrefixAccPub: 'noblepub',
    bech32PrefixValAddr: 'noblevaloper',
    bech32PrefixValPub: 'noblevaloperpub',
    bech32PrefixConsAddr: 'noblevalcons',
    bech32PrefixConsPub: 'noblevalconspub',
  },
  currencies: [
    {
      coinDenom: 'USDC',
      coinMinimalDenom: 'uusdc',
      coinDecimals: 6,
      coinImageUrl:
        'https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/grand/uusdc.png',
    },
    {
      coinDenom: 'STAKE',
      coinMinimalDenom: 'ustake',
      coinDecimals: 6,
      coinImageUrl:
        'https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/grand/ustake.png',
    },
    {
      coinDenom: 'LOVE',
      coinMinimalDenom: 'ulove',
      coinDecimals: 6,
    },
  ],
  feeCurrencies: [
    {
      coinDenom: 'USDC',
      coinMinimalDenom: 'uusdc',
      coinDecimals: 6,
      coinImageUrl:
        'https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/grand/uusdc.png',
      gasPriceStep: {
        low: 0.1,
        average: 0.1,
        high: 0.2,
      },
    },
  ],
  features: [],
};
// TODO: export this type from abacus instead
export enum DydxChainAsset {
  USDC = 'usdc',
  CHAINTOKEN = 'chain',
}

export const TEST_WALLET_EVM_ADDRESS: EvmAddress = '0x0000000000000000000000000000000000000000';
