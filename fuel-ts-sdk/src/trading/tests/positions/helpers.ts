import { address, assetId, positionId } from '@/shared/types';

import type { Position } from '../../src/positions/domain';
import { PositionChange } from '../../src/positions/domain';

export function createMockPosition(overrides?: Partial<Position> & { id?: string }): Position {
  const defaults: Position = {
    id: positionId(overrides?.id || 'pos-123'),
    positionKey: {
      account: address('0x123abc'),
      indexAssetId: assetId('0xasset123'),
      isLong: true,
      ...(overrides?.positionKey || {}),
    },
    collateralAmount: BigInt(1000),
    size: BigInt(5000),
    timestamp: 1234567890,
    latest: true,
    change: PositionChange.Increase,
    collateralTransferred: BigInt(500),
    positionFee: BigInt(10),
    fundingRate: BigInt(5),
    pnlDelta: BigInt(100),
    realizedFundingRate: BigInt(3),
    realizedPnl: BigInt(50),
  };

  return {
    ...defaults,
    ...overrides,
    positionKey: {
      ...defaults.positionKey,
      ...overrides?.positionKey,
    },
  };
}
