import { type TooltipStrings, TOOLTIP_STRING_KEYS } from '@/constants/localization';

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
} as const;
