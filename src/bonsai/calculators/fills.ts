import { keyBy, maxBy, orderBy } from 'lodash';
import { weakMapMemoize } from 'reselect';

import { NUM_PARENT_SUBACCOUNTS } from '@/constants/account';
import { EMPTY_ARR } from '@/constants/objects';
import {
  IndexerFillType,
  IndexerOrderSide,
  IndexerPositionSide,
} from '@/types/indexer/indexerApiGen';
import { IndexerCompositeFillObject } from '@/types/indexer/indexerManual';

import { assertNever } from '@/lib/assertNever';
import { MustBigNumber, MustNumber } from '@/lib/numbers';

import { mergeObjects } from '../lib/mergeObjects';
import { SubaccountFill, SubaccountFillType } from '../types/summaryTypes';

export function calculateFills(
  liveFills: IndexerCompositeFillObject[] | undefined,
  restFills: IndexerCompositeFillObject[] | undefined
) {
  const getFillsById = (data: IndexerCompositeFillObject[]) => keyBy(data, (fill) => fill.id ?? '');
  const merged = mergeObjects(
    getFillsById(liveFills ?? EMPTY_ARR),
    getFillsById(restFills ?? EMPTY_ARR),
    (first, second) => maxBy([first, second], (f) => MustBigNumber(f.createdAtHeight).toNumber())!
  );
  return orderBy(Object.values(merged).map(calculateFill), [(f) => f.createdAt], ['desc']);
}

const calculateFill = weakMapMemoize(
  (base: IndexerCompositeFillObject): SubaccountFill => ({
    ...base,
    marginMode: (base.subaccountNumber ?? 0) >= NUM_PARENT_SUBACCOUNTS ? 'ISOLATED' : 'CROSS',
    type: getFillType(base),
    closedPnl: calculateClosedPnl(base),
  })
);

function getFillType({
  type,
  clientMetadata,
}: IndexerCompositeFillObject): SubaccountFillType | undefined {
  if (type == null) {
    return type;
  }
  if (type === IndexerFillType.TWAPSUBORDER) return SubaccountFillType.TWAP;
  if (type === IndexerFillType.LIQUIDATION) return SubaccountFillType.LIMIT; // CT-916
  if (type === IndexerFillType.DELEVERAGED) return SubaccountFillType.LIQUIDATED; // CT-1118
  if (type === IndexerFillType.OFFSETTING) return SubaccountFillType.DELEVERAGED; // CT-1118

  if (clientMetadata === '1' && type === IndexerFillType.LIMIT) return SubaccountFillType.MARKET;
  if (type === IndexerFillType.LIMIT) return SubaccountFillType.LIMIT;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (type === IndexerFillType.LIQUIDATED) return SubaccountFillType.LIQUIDATED;

  assertNever(type);
  return SubaccountFillType.LIMIT;
}

const calculateClosedPnl = (fill: IndexerCompositeFillObject) => {
  const fee = MustNumber(fill.fee ?? '0');

  // Old fills are not supported so we show -- instead of 0
  if (
    fill.positionSideBefore == null ||
    fill.positionSizeBefore == null ||
    fill.entryPriceBefore == null
  ) {
    return undefined;
  }

  const positionSizeBefore = parseFloat(fill.positionSizeBefore);
  const entryPriceBefore = parseFloat(fill.entryPriceBefore);

  // No position before = opening trade, only fees realize
  if (positionSizeBefore === 0) {
    return -fee;
  }

  // Check if position is reducing (opposite side)
  const isReducing =
    (fill.positionSideBefore === IndexerPositionSide.LONG && fill.side === IndexerOrderSide.SELL) ||
    (fill.positionSideBefore === IndexerPositionSide.SHORT && fill.side === IndexerOrderSide.BUY);

  if (!isReducing) {
    // Position increasing (same side), only fees realize
    return -fee;
  }

  const size = MustNumber(fill.size ?? '0');
  const price = MustNumber(fill.price ?? '0');

  // Position reducing - cap closing amount to actual position size
  const closingAmount = Math.min(size, positionSizeBefore);

  // Calculate P&L only on the closing portion
  const closingPnl =
    fill.positionSideBefore === IndexerPositionSide.LONG
      ? (price - entryPriceBefore) * closingAmount
      : (entryPriceBefore - price) * closingAmount;

  return closingPnl - fee;
};
