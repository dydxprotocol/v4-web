import { WalletType as CosmosWalletType } from 'graz';
import { EIP6963ProviderInfo } from 'mipd';

export enum WalletType {
  CoinbaseWallet = 'COINBASE_WALLET',
  Keplr = CosmosWalletType.KEPLR,
  OkxWallet = 'OKX_WALLET',
  WalletConnect2 = 'WALLETCONNECT_2',
  TestWallet = 'TEST_WALLET',
  OtherWallet = 'OTHER_WALLET',
  Privy = 'PRIVY',
  Phantom = 'PHANTOM',
}

export enum ConnectorType {
  Injected = 'injected',
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
  | { connectorType: ConnectorType.Test; name: WalletType.TestWallet };
