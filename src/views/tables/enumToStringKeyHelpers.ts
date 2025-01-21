import { MarginMode } from '@/abacus-ts/types/summaryTypes';

import { STRING_KEYS } from '@/constants/localization';
import {
  IndexerFillType,
  IndexerLiquidity,
  IndexerOrderSide,
  IndexerPositionSide,
} from '@/types/indexer/indexerApiGen';

import { assertNever } from '@/lib/assertNever';

export function getIndexerPositionSideStringKey(side: IndexerPositionSide) {
  if (side === IndexerPositionSide.LONG) {
    return STRING_KEYS.LONG_POSITION_SHORT;
  }
  return STRING_KEYS.SHORT_POSITION_SHORT;
}

export function getMarginModeStringKey(mode: MarginMode) {
  return mode === 'CROSS' ? STRING_KEYS.CROSS : STRING_KEYS.ISOLATED;
}

export function getIndexerFillTypeStringKey(fillType: IndexerFillType): string {
  switch (fillType) {
    case IndexerFillType.LIMIT:
      return STRING_KEYS.LIMIT_ORDER_SHORT;
    case IndexerFillType.LIQUIDATED:
      return STRING_KEYS.LIQUIDATED;
    case IndexerFillType.LIQUIDATION:
      return STRING_KEYS.LIQUIDATION;
    case IndexerFillType.DELEVERAGED:
      return STRING_KEYS.DELEVERAGED;
    case IndexerFillType.OFFSETTING:
      return STRING_KEYS.OFFSETTING;
    default:
      assertNever(fillType);
      return STRING_KEYS.LIMIT_ORDER_SHORT;
  }
}

export function getIndexerLiquidityStringKey(liquidity: IndexerLiquidity): string {
  switch (liquidity) {
    case IndexerLiquidity.MAKER:
      return STRING_KEYS.MAKER;
    case IndexerLiquidity.TAKER:
      return STRING_KEYS.TAKER;
    default:
      assertNever(liquidity);
      return STRING_KEYS.MAKER;
  }
}

export function getIndexerOrderSideStringKey(side: IndexerOrderSide) {
  if (side === IndexerOrderSide.BUY) {
    return STRING_KEYS.BUY;
  }
  return STRING_KEYS.SELL;
}
