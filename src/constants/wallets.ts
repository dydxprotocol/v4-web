import { type onboarding } from '@dydxprotocol/v4-client-js';
import { WalletType as CosmosWalletType } from 'graz';
import { EIP6963ProviderInfo } from 'mipd';

import { STRING_KEYS } from '@/constants/localization';

import {
  CoinbaseIcon,
  EmailIcon,
  GenericWalletIcon,
  KeplrIcon,
  MetaMaskIcon,
  OkxWalletIcon,
  PhantomIcon,
  WalletConnectIcon,
} from '@/icons';

import { DydxChainId, WALLETS_CONFIG_MAP } from './networks';

export enum WalletErrorType {
  // General
  ChainMismatch,
  UserCanceled,
  SwitchChainMethodMissing,

  // Non-Deterministic
  NonDeterministicWallet,

  // Misc
  Unknown,

  // EIP specified errors
  EipResourceUnavailable,
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

export enum WalletType {
  CoinbaseWallet = 'COINBASE_WALLET',
  Keplr = CosmosWalletType.KEPLR,
  OkxWallet = 'OKX_WALLET',
  WalletConnect2 = 'WALLETCONNECT_2',
  TestWallet = 'TEST_WALLET',
  OtherWallet = 'OTHER_WALLET',
  Privy = 'PRIVY',
  Phantom = 'PHANTOM',
  MetaMask = 'METAMASK',
}

export enum ConnectorType {
  Injected = 'injected',
  // Not a real connector type, but a link to download the wallet for those who don't have it installed
  DownloadWallet = 'downloadWallet',
  Coinbase = 'coinbase',
  WalletConnect = 'walletConnect',
  Cosmos = 'cosmos',
  Test = 'test',
  Privy = 'privy',
  PhantomSolana = 'phantomSolana',
}

// This is the type stored in localstorage, so it must consist of only serializable fields
export type WalletInfo =
  | ({
      connectorType: ConnectorType.Injected;
    } & Pick<EIP6963ProviderInfo<string>, 'icon' | 'name' | 'rdns'>)
  | {
      connectorType:
        | ConnectorType.Coinbase
        | ConnectorType.WalletConnect
        | ConnectorType.PhantomSolana
        | ConnectorType.Privy;
      name: WalletType;
    }
  | {
      connectorType: ConnectorType.Cosmos;
      name: CosmosWalletType;
    }
  | { connectorType: ConnectorType.Test; name: WalletType.TestWallet }
  | { connectorType: ConnectorType.DownloadWallet; name: string; downloadLink: string };

type WalletConfig = {
  type: WalletType;
  stringKey: string;
  icon: string;
};

export const wallets: Record<WalletInfo['name'], WalletConfig> = {
  [WalletType.OtherWallet]: {
    type: WalletType.OtherWallet,
    stringKey: STRING_KEYS.OTHER_WALLET,
    icon: GenericWalletIcon,
  },
  [WalletType.CoinbaseWallet]: {
    type: WalletType.CoinbaseWallet,
    stringKey: STRING_KEYS.COINBASE_WALLET,
    icon: CoinbaseIcon,
  },
  [WalletType.OkxWallet]: {
    type: WalletType.OkxWallet,
    stringKey: STRING_KEYS.OKX_WALLET,
    icon: OkxWalletIcon,
  },
  [WalletType.Keplr]: {
    type: WalletType.Keplr,
    stringKey: STRING_KEYS.KEPLR,
    icon: KeplrIcon,
  },
  [WalletType.TestWallet]: {
    type: WalletType.TestWallet,
    stringKey: STRING_KEYS.TEST_WALLET,
    icon: GenericWalletIcon,
  },
  [WalletType.Privy]: {
    type: WalletType.Privy,
    stringKey: STRING_KEYS.EMAIL_OR_SOCIAL,
    icon: EmailIcon,
  },
  [WalletType.Phantom]: {
    type: WalletType.Phantom,
    stringKey: STRING_KEYS.PHANTOM_SOL,
    icon: PhantomIcon,
  },
  [WalletType.WalletConnect2]: {
    type: WalletType.WalletConnect2,
    stringKey: STRING_KEYS.WALLET_CONNECT_2,
    icon: WalletConnectIcon,
  },
  [WalletType.MetaMask]: {
    type: WalletType.MetaMask,
    stringKey: STRING_KEYS.METAMASK,
    icon: MetaMaskIcon,
  },
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
export type SolAddress = `${string}`;
export type DydxAddress = `dydx${string}`;

// Extension wallet EIP-6963 identifiers
export const PHANTOM_MIPD_RDNS = 'app.phantom';
export const OKX_MIPD_RDNS = 'com.okex.wallet';
export const KEPLR_MIPD_RDNS = 'app.keplr';
export const COINBASE_MIPD_RDNS = 'com.coinbase.wallet';
export const METAMASK_MIPD_RDNS = 'io.metamask';

export const METAMASK_DOWNLOAD_LINK = 'https://metamask.io/download/';
export const PHANTOM_DOWNLOAD_LINK = 'https://phantom.app/download';
export const KEPLR_DOWNLOAD_LINK = 'https://www.keplr.app/get';

// TODO: export this type from abacus instead
export enum DydxChainAsset {
  USDC = 'usdc',
  CHAINTOKEN = 'chain',
}

export const TEST_WALLET_EVM_ADDRESS: EvmAddress = '0x0000000000000000000000000000000000000000';
