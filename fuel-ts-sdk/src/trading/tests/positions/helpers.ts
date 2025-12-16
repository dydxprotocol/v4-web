import { CollateralAmount } from '@/shared/models/decimals';
import { address, assetId, positionId } from '@/shared/types';

import type { Position } from '../../src/positions/domain';
import { PositionChange } from '../../src/positions/domain';
import {
  FundingRate,
  PnlDelta,
  PositionFee,
  PositionSize,
  RealizedPnl,
} from '../../src/positions/domain/positions.decimals';

export function createMockPosition(overrides?: Partial<Position> & { id?: string }): Position {
  const defaults: Position = {
    id: positionId(overrides?.id || 'pos-123'),
    positionKey: {
      account: address('0x123abc'),
      indexAssetId: assetId('0xasset123'),
      isLong: true,
      ...(overrides?.positionKey || {}),
    },
    collateralAmount: CollateralAmount.fromBigInt(1000n),
    size: PositionSize.fromBigInt(5000n),
    timestamp: 1234567890,
    latest: true,
    change: PositionChange.Increase,
    collateralTransferred: CollateralAmount.fromBigInt(500n),
    positionFee: PositionFee.fromBigInt(10n),
    fundingRate: FundingRate.fromBigInt(5n),
    pnlDelta: PnlDelta.fromBigInt(100n),
    realizedFundingRate: FundingRate.fromBigInt(3n),
    realizedPnl: RealizedPnl.fromBigInt(50n),
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
