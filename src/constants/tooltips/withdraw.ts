import { TOOLTIP_STRING_KEYS, type TooltipStrings } from '@/constants/localization';
import { StatsigFlags } from '@/constants/statsig';

import { TransferType } from '../abacus';
import { getLowestFeeChainNames } from '../cctp';

export const withdrawTooltips: TooltipStrings = {
  'fast-withdraw-fee': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.FAST_WITHDRAW_FEE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.FAST_WITHDRAW_FEE_BODY }),
  }),
  'minimum-amount-received': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.MINIMUM_AMOUNT_RECEIVED_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.MINIMUM_AMOUNT_RECEIVED_BODY }),
  }),
  'withdraw-types': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.WITHDRAW_TYPES_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.WITHDRAW_TYPES_BODY }),
  }),
  'gas-fees': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.GAS_FEES_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.GAS_FEES_BODY }),
  }),
  'bridge-fees': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.BRIDGE_FEES_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.BRIDGE_FEES_BODY }),
  }),
  'lowest-fees': ({ stringGetter, featureFlags }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.LOWEST_FEE_WITHDRAWALS_TITLE }),
    body: stringGetter({
      key: TOOLTIP_STRING_KEYS.LOWEST_FEE_WITHDRAWALS_BODY,
      params: {
        LOWEST_FEE_TOKEN_NAMES: getLowestFeeChainNames(
          TransferType.withdrawal,
          featureFlags?.[StatsigFlags.ffSkipMigration] ?? false
        ).join(', '),
      },
    }),
  }),
} as const;
