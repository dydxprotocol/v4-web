import type { StoreService } from '@sdk/shared/lib/StoreService';
import { CollateralAmount, RatioOutput } from '@sdk/shared/models/decimals';
import { assetId } from '@sdk/shared/types';
import { describe, expect, it, vi } from 'vitest';
import type { B256Account, VaultContractPort } from '../src/VaultContractPort';
import {
  type IncreasePositionParams,
  createIncreasePositionCommand,
} from '../src/vault/commands/increasePosition';
import { PositionIncreasedEvent, VaultOperationFailedEvent } from '../src/vault/events';

const TEST_BTC_ASSET_ID = assetId('0xbtc');
const TEST_USDC_ASSET_ID = assetId('0xusdc');

function createMockVaultContractPort(
  overrides: {
    account?: B256Account | null;
    callError?: Error;
  } = {}
): VaultContractPort {
  const { account = { Address: { bits: '0x123' } }, callError } = overrides;

  const mockWaitForResult = vi.fn().mockResolvedValue({});
  const mockCall = vi.fn().mockImplementation(() => {
    if (callError) {
      return Promise.reject(callError);
    }
    return Promise.resolve({ waitForResult: mockWaitForResult });
  });
  const mockCallParams = vi.fn().mockReturnValue({ call: mockCall });
  const mockIncreasePosition = vi.fn().mockReturnValue({ callParams: mockCallParams });

  return {
    getVaultContract: vi.fn().mockResolvedValue({
      functions: {
        increase_position: mockIncreasePosition,
      },
    }),
    getB256Account: vi.fn().mockResolvedValue(account),
  };
}

function createMockStoreService(): StoreService {
  return {
    dispatch: vi.fn(),
    select: vi.fn(),
    getState: vi.fn(),
  };
}

describe('createIncreasePositionCommand', () => {
  const defaultParams: IncreasePositionParams = {
    isLong: true,
    indexAsset: TEST_BTC_ASSET_ID,
    collateralAssetId: TEST_USDC_ASSET_ID,
    leverage: RatioOutput.fromFloat(10),
    collateralAmount: CollateralAmount.fromFloat(100),
  };

  it('calculates position size as collateralAmount * leverage', async () => {
    const vaultContractPort = createMockVaultContractPort();
    const storeService = createMockStoreService();
    const increasePosition = createIncreasePositionCommand({ vaultContractPort, storeService });

    await increasePosition(defaultParams);

    const vault = await vaultContractPort.getVaultContract();
    // 100 collateral * 10x leverage = 1000 size
    expect(vault.functions.increase_position).toHaveBeenCalledWith(
      { Address: { bits: '0x123' } },
      TEST_BTC_ASSET_ID,
      '1000000000', // 1000 with 6 decimals (CollateralAmount precision)
      true
    );
  });

  it('forwards collateral amount with correct asset ID', async () => {
    const vaultContractPort = createMockVaultContractPort();
    const storeService = createMockStoreService();
    const increasePosition = createIncreasePositionCommand({ vaultContractPort, storeService });

    await increasePosition(defaultParams);

    const vault = await vaultContractPort.getVaultContract();
    const callParams = vault.functions.increase_position().callParams;
    expect(callParams).toHaveBeenCalledWith({
      forward: {
        amount: '100000000', // 100 with 6 decimals
        assetId: TEST_USDC_ASSET_ID,
      },
    });
  });

  it('dispatches PositionIncreasedEvent on success', async () => {
    const vaultContractPort = createMockVaultContractPort();
    const storeService = createMockStoreService();
    const increasePosition = createIncreasePositionCommand({ vaultContractPort, storeService });

    await increasePosition(defaultParams);

    expect(storeService.dispatch).toHaveBeenCalledWith(
      PositionIncreasedEvent({ indexAsset: TEST_BTC_ASSET_ID, isLong: true })
    );
  });

  it('throws error when wallet is not connected', async () => {
    const vaultContractPort = createMockVaultContractPort({ account: null });
    const storeService = createMockStoreService();
    const increasePosition = createIncreasePositionCommand({ vaultContractPort, storeService });

    await expect(increasePosition(defaultParams)).rejects.toThrow('Wallet is not connected');
  });

  it('dispatches VaultOperationFailedEvent on error', async () => {
    const contractError = new Error('Contract call failed');
    const vaultContractPort = createMockVaultContractPort({ callError: contractError });
    const storeService = createMockStoreService();
    const increasePosition = createIncreasePositionCommand({ vaultContractPort, storeService });

    await expect(increasePosition(defaultParams)).rejects.toThrow('Contract call failed');

    expect(storeService.dispatch).toHaveBeenCalledWith(
      VaultOperationFailedEvent({
        operation: 'increase_position',
        error: 'Contract call failed',
      })
    );
  });

  it('handles short positions correctly', async () => {
    const vaultContractPort = createMockVaultContractPort();
    const storeService = createMockStoreService();
    const increasePosition = createIncreasePositionCommand({ vaultContractPort, storeService });

    await increasePosition({ ...defaultParams, isLong: false });

    const vault = await vaultContractPort.getVaultContract();
    expect(vault.functions.increase_position).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      false
    );
    expect(storeService.dispatch).toHaveBeenCalledWith(
      PositionIncreasedEvent({ indexAsset: TEST_BTC_ASSET_ID, isLong: false })
    );
  });

  it('calculates size correctly with different leverage values', async () => {
    const vaultContractPort = createMockVaultContractPort();
    const storeService = createMockStoreService();
    const increasePosition = createIncreasePositionCommand({ vaultContractPort, storeService });

    // 50 collateral * 5x leverage = 250 size
    await increasePosition({
      ...defaultParams,
      collateralAmount: CollateralAmount.fromFloat(50),
      leverage: RatioOutput.fromFloat(5),
    });

    const vault = await vaultContractPort.getVaultContract();
    expect(vault.functions.increase_position).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      '250000000', // 250 with 6 decimals
      expect.anything()
    );
  });
});
