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
  MIPD = 'mipd',
  Coinbase = 'coinbase',
  WalletConnect = 'walletConnect',
  Cosmos = 'cosmos',
  Test = 'test',
  Privy = 'privy',
  Phantom = 'phantom',
}

// This is the type stored in localstorage, so it must consist of only serializable fields
export type WalletInfo =
  | ({
      connectorType: ConnectorType.MIPD;
    } & Pick<EIP6963ProviderInfo<string>, 'icon' | 'name' | 'rdns'>)
  | {
      // TODO: override existing ConnectorType enum
      connectorType:
        | ConnectorType.Coinbase
        | ConnectorType.WalletConnect
        | ConnectorType.Phantom
        | ConnectorType.Privy;
      name: WalletType;
    }
  | {
      connectorType: ConnectorType.Cosmos;
      name: CosmosWalletType;
    }
  | { connectorType: ConnectorType.Test; name: WalletType.TestWallet };
