import { TradeAction } from '@/bonsai/types/summaryTypes';

import { SharePNLAnalyticsDialogProps } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { IndexerOrderSide } from '@/types/indexer/indexerApiGen';

import type { useStringGetter } from '@/hooks/useStringGetter';

import { assertNever } from './assertNever';

type ShareType = NonNullable<SharePNLAnalyticsDialogProps['shareType']>;

export const TRADE_ACTION_TO_SHARE_TYPE_MAP: Record<TradeAction, ShareType | undefined> = {
  [TradeAction.OPEN_LONG]: 'open',
  [TradeAction.OPEN_SHORT]: 'open',
  [TradeAction.CLOSE_LONG]: 'close',
  [TradeAction.CLOSE_SHORT]: 'close',
  [TradeAction.PARTIAL_CLOSE_LONG]: 'partialClose',
  [TradeAction.PARTIAL_CLOSE_SHORT]: 'partialClose',
  [TradeAction.ADD_TO_LONG]: 'extend',
  [TradeAction.ADD_TO_SHORT]: 'extend',
  [TradeAction.LIQUIDATION]: 'liquidated',
};

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
    case TradeAction.LIQUIDATION:
      return {
        label: stringGetter({ key: STRING_KEYS.LIQUIDATED }),
        color: 'var(--color-negative)',
      };
    default:
      return assertNever(action);
  }
}

export function getOrderSideColor(
  action: TradeAction,
  side: IndexerOrderSide | undefined,
  stringGetter: ReturnType<typeof useStringGetter>
) {
  const display = getTradeActionDisplayInfo(action, stringGetter);
  return {
    actionLabel: display.label,
    actionColor: display.color,
    sideColor: side === IndexerOrderSide.BUY ? 'var(--color-positive)' : 'var(--color-negative)',
  };
}
