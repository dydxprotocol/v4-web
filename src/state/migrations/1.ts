import { PersistedState } from 'redux-persist';

import { parseStorageItem } from './utils';

type EvmDerivedAddresses = {
  version?: string;
  [EvmAddress: EvmAddress]: {
    encryptedSignature?: string;
    dydxAddress?: DydxAddress;
  };
};

type SolDerivedAddresses = {
  version?: string;
} & Record<
  SolAddress,
  {
    encryptedSignature?: string;
    dydxAddress?: DydxAddress;
  }
>;

enum CosmosWalletType {
  KEPLR = 'keplr',
  LEAP = 'leap',
  VECTIS = 'vectis',
  COSMOSTATION = 'cosmostation',
  WALLETCONNECT = 'walletconnect',
  WC_KEPLR_MOBILE = 'wc_keplr_mobile',
  WC_LEAP_MOBILE = 'wc_leap_mobile',
  WC_COSMOSTATION_MOBILE = 'wc_cosmostation_mobile',
  WC_CLOT_MOBILE = 'wc_clot_mobile',
  METAMASK_SNAP_LEAP = 'metamask_snap_leap',
  METAMASK_SNAP_COSMOS = 'metamask_snap_cosmos',
  STATION = 'station',
  XDEFI = 'xdefi',
  CAPSULE = 'capsule',
  COSMIFRAME = 'cosmiframe',
  COMPASS = 'compass',
}
type EvmAddress = `0x${string}`;
type SolAddress = `${string}`;
type DydxAddress = `dydx${string}`;

interface EIP6963ProviderInfo<TRdns extends string = any> {
  icon: `data:image/${string}`; // RFC-2397
  name: string;
  rdns: TRdns;
  uuid: string;
}

type WalletInfo =
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

enum WalletType {
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

enum ConnectorType {
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

enum WalletNetworkType {
  Evm = 'evm',
  Cosmos = 'cosmos',
  Solana = 'solana',
}

interface V1MigrationWalletState {
  sourceAccount: {
    address?: string;
    chain?: WalletNetworkType;
    encryptedSignature?: string;
    walletInfo?: WalletInfo;
  };
}

export type V1State = PersistedState & { wallet: V1MigrationWalletState };
/**
 * Move over wallet data from localStorage into redux
 * TODO (in future migration): Remove these localStorage items
 */
export function migration1(state: PersistedState): V1State {
  if (!state) {
    throw new Error('state must be defined');
  }

  // We have to run parseStorageItem on these strings because they are stored with a extra quotations (from JSON.stringify)!
  const evmAddress = parseStorageItem<EvmAddress>(localStorage.getItem('dydx.EvmAddress'));
  const evmDerivedAddresses = parseStorageItem<EvmDerivedAddresses>(
    localStorage.getItem('dydx.EvmDerivedAddresses')
  );
  const solAddress = parseStorageItem<SolAddress>(localStorage.getItem('dydx.SolAddress'));
  const solDerivedAddresses = parseStorageItem<SolDerivedAddresses>(
    localStorage.getItem('dydx.SolDerivedAddresses')
  );

  const dydxAddress = parseStorageItem<DydxAddress>(localStorage.getItem('dydx.DydxAddress'));
  const selectedWallet = parseStorageItem<WalletInfo>(
    localStorage.getItem('dydx.OnboardingSelectedWallet')
  );

  if (!selectedWallet) {
    return {
      ...state,
      wallet: {
        sourceAccount: {
          address: undefined,
          chain: undefined,
          encryptedSignature: undefined,
          walletInfo: undefined,
        },
      },
    };
  }

  if (selectedWallet.connectorType === ConnectorType.PhantomSolana) {
    return {
      ...state,
      wallet: {
        sourceAccount: {
          address: solAddress ?? undefined,
          chain: WalletNetworkType.Solana,
          encryptedSignature: solAddress
            ? solDerivedAddresses?.[solAddress]?.encryptedSignature
            : undefined,
          walletInfo: selectedWallet,
        },
      },
    };
  }

  if (selectedWallet.connectorType === ConnectorType.Cosmos) {
    return {
      ...state,
      wallet: {
        sourceAccount: {
          address: dydxAddress ?? undefined,
          chain: WalletNetworkType.Cosmos,
          walletInfo: selectedWallet,
        },
      },
    };
  }

  const shouldCopyOverEvmSignature = evmAddress && evmDerivedAddresses?.version === 'v2';
  return {
    ...state,
    wallet: {
      sourceAccount: {
        address: evmAddress,
        chain: WalletNetworkType.Evm,
        encryptedSignature: shouldCopyOverEvmSignature
          ? evmDerivedAddresses[evmAddress]?.encryptedSignature
          : undefined,
        walletInfo: selectedWallet,
      },
    },
  };
}
