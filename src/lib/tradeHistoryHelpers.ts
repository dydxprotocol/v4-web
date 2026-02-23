import { TradeAction } from '@/bonsai/types/summaryTypes';

import { STRING_KEYS } from '@/constants/localization';

import type { useStringGetter } from '@/hooks/useStringGetter';

export function getTradeActionDisplayInfo(
  action: TradeAction,
  stringGetter: ReturnType<typeof useStringGetter>
) {
  switch (action) {
    case TradeAction.OPEN_LONG:
      return {
        label: stringGetter({ key: STRING_KEYS.OPEN_LONG }),
        color: 'var(--color-positive)',
      };
    case TradeAction.OPEN_SHORT:
      return {
        label: stringGetter({ key: STRING_KEYS.OPEN_SHORT }),
        color: 'var(--color-negative)',
      };
    case TradeAction.CLOSE_LONG:
      return {
        label: stringGetter({ key: STRING_KEYS.CLOSE_LONG }),
        color: 'var(--color-negative)',
      };
    case TradeAction.CLOSE_SHORT:
      return {
        label: stringGetter({ key: STRING_KEYS.CLOSE_SHORT }),
        color: 'var(--color-negative)',
      };
    case TradeAction.PARTIAL_CLOSE_LONG:
      return {
        label: stringGetter({ key: STRING_KEYS.PARTIAL_CLOSE_LONG }),
        color: 'var(--color-negative)',
      };
    case TradeAction.PARTIAL_CLOSE_SHORT:
      return {
        label: stringGetter({ key: STRING_KEYS.PARTIAL_CLOSE_SHORT }),
        color: 'var(--color-negative)',
      };
    case TradeAction.ADD_TO_LONG:
      return {
        label: stringGetter({ key: STRING_KEYS.ADD_TO_LONG }),
        color: 'var(--color-positive)',
      };
    case TradeAction.ADD_TO_SHORT:
      return {
        label: stringGetter({ key: STRING_KEYS.ADD_TO_SHORT }),
        color: 'var(--color-negative)',
      };
    default:
      return {
        label: stringGetter({ key: STRING_KEYS.OPEN_LONG }),
        color: 'var(--color-positive)',
      };
  }
}
