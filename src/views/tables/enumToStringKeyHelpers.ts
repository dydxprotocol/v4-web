import { MarginMode } from '@/abacus-ts/types/summaryTypes';

import { STRING_KEYS } from '@/constants/localization';
import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

export function getIndexerPositionSideStringKey(side: IndexerPositionSide) {
  if (side === IndexerPositionSide.LONG) {
    return STRING_KEYS.LONG_POSITION_SHORT;
  }
  return STRING_KEYS.SHORT_POSITION_SHORT;
}

export function getMarginModeStringKey(mode: MarginMode) {
  return mode === 'CROSS' ? STRING_KEYS.CROSS : STRING_KEYS.ISOLATED;
}
