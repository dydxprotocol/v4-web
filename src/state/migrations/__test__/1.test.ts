import { WalletType as CosmosWalletType } from 'graz';
import { afterEach, describe, expect, it } from 'vitest';

import { ConnectorType, WalletInfo, WalletType } from '@/constants/wallets';

import { V0State } from '../0';
import { migration1 } from '../1';

const V0_STATE: V0State = {
  _persist: { version: 0, rehydrated: true },
  tradingView: { chartConfig: undefined },
};

const MOCK_EVM_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const MOCK_EVM_SIGNATURE = 'fake_signature_woohoo';
const MOCK_SOLANA_ADDRESS = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const MOCK_DYDX_ADDRESS = 'dydx1';

const MOCK_EVM_WALLET_INFO: WalletInfo = {
  connectorType: ConnectorType.Coinbase,
  name: WalletType.CoinbaseWallet,
};

const MOCK_SOLANA_WALLET_INFO: WalletInfo = {
  connectorType: ConnectorType.PhantomSolana,
  name: WalletType.Phantom,
};

const MOCK_COSMOS_WALLET_INFO: WalletInfo = {
  connectorType: ConnectorType.Cosmos,
  name: CosmosWalletType.KEPLR,
};

describe('migration1', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('should not set any address if no wallet info is defined', () => {
    localStorage.setItem('dydx.EvmAddress', JSON.stringify(MOCK_EVM_ADDRESS));
    const newState = migration1(V0_STATE);
    expect(newState).toBeDefined();
    expect(newState.wallet.sourceAccount?.address).toBeUndefined();
    expect(newState.wallet.sourceAccount.walletInfo).toBeUndefined();
  });

  it('should set evm address correctly if wallet info is evm', () => {
    localStorage.setItem('dydx.EvmAddress', JSON.stringify(MOCK_EVM_ADDRESS));
    localStorage.setItem('dydx.OnboardingSelectedWallet', JSON.stringify(MOCK_EVM_WALLET_INFO));

    const newState = migration1(V0_STATE);
    expect(newState).toBeDefined();
    expect(newState.wallet.sourceAccount.address).toBe(MOCK_EVM_ADDRESS);
    expect(newState.wallet.sourceAccount.walletInfo?.connectorType).toBe(
      MOCK_EVM_WALLET_INFO.connectorType
    );
  });

  it('should set solana address correctly if wallet info is solana', () => {
    localStorage.setItem('dydx.SolAddress', JSON.stringify(MOCK_SOLANA_ADDRESS));
    localStorage.setItem('dydx.OnboardingSelectedWallet', JSON.stringify(MOCK_SOLANA_WALLET_INFO));

    const newState = migration1(V0_STATE);
    expect(newState).toBeDefined();
    expect(newState.wallet.sourceAccount.address).toBe(MOCK_SOLANA_ADDRESS);
    expect(newState.wallet.sourceAccount.walletInfo?.connectorType).toBe(
      MOCK_SOLANA_WALLET_INFO.connectorType
    );
  });

  it('should set dydx address correctly if wallet info is cosmos', () => {
    localStorage.setItem('dydx.DydxAddress', JSON.stringify(MOCK_DYDX_ADDRESS));
    localStorage.setItem('dydx.OnboardingSelectedWallet', JSON.stringify(MOCK_COSMOS_WALLET_INFO));

    const newState = migration1(V0_STATE);
    expect(newState).toBeDefined();
    expect(newState.wallet.sourceAccount.address).toBe(MOCK_DYDX_ADDRESS);
    expect(newState.wallet.sourceAccount.walletInfo?.connectorType).toBe(
      MOCK_COSMOS_WALLET_INFO.connectorType
    );
  });

  it('should set the right address even if multiple are defined in localstorage', () => {
    localStorage.setItem('dydx.EvmAddress', JSON.stringify(MOCK_EVM_ADDRESS));
    localStorage.setItem('dydx.SolAddress', JSON.stringify(MOCK_SOLANA_ADDRESS));
    localStorage.setItem('dydx.OnboardingSelectedWallet', JSON.stringify(MOCK_SOLANA_WALLET_INFO));

    const newState = migration1(V0_STATE);
    expect(newState).toBeDefined();
    expect(newState.wallet.sourceAccount.address).toBe(MOCK_SOLANA_ADDRESS);
    expect(newState.wallet.sourceAccount.walletInfo?.connectorType).toBe(
      MOCK_SOLANA_WALLET_INFO.connectorType
    );
  });

  it('should migrate over saved encrypted v2 signatures', () => {
    localStorage.setItem('dydx.EvmAddress', JSON.stringify(MOCK_EVM_ADDRESS));
    localStorage.setItem(
      'dydx.EvmDerivedAddresses',
      JSON.stringify({
        version: 'v2',
        [MOCK_EVM_ADDRESS]: { encryptedSignature: MOCK_EVM_SIGNATURE },
      })
    );
    localStorage.setItem('dydx.OnboardingSelectedWallet', JSON.stringify(MOCK_EVM_WALLET_INFO));

    const newState = migration1(V0_STATE);
    expect(newState).toBeDefined();
    expect(newState.wallet.sourceAccount?.address).toBe(MOCK_EVM_ADDRESS);
    expect(newState.wallet.sourceAccount?.encryptedSignature).toBe(MOCK_EVM_SIGNATURE);
  });

  it('should not migrate over saved encrypted v1 signatures', () => {
    localStorage.setItem('dydx.EvmAddress', JSON.stringify(MOCK_EVM_ADDRESS));
    localStorage.setItem(
      'dydx.EvmDerivedAddresses',
      JSON.stringify({
        version: 'v1',
        [MOCK_EVM_ADDRESS]: { encryptedSignature: MOCK_EVM_SIGNATURE },
      })
    );
    localStorage.setItem('dydx.OnboardingSelectedWallet', JSON.stringify(MOCK_EVM_WALLET_INFO));

    const newState = migration1(V0_STATE);
    expect(newState).toBeDefined();
    expect(newState.wallet.sourceAccount?.address).toBe(MOCK_EVM_ADDRESS);
    expect(newState.wallet.sourceAccount?.encryptedSignature).toBeUndefined();
  });
});
