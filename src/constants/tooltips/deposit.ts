import { type TooltipStrings, TOOLTIP_STRING_KEYS } from '@/constants/localization';

export const depositTooltips: TooltipStrings = {
  'minimum-deposit-amount': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.MINIMUM_DEPOSIT_AMOUNT_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.MINIMUM_DEPOSIT_AMOUNT_BODY }),
  }),
  swap: ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.SWAP_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.SWAP_BODY }),
  }),
  'gas-fees-deposit': ({ stringGetter, stringParams }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.GAS_FEES_DEPOSIT_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.GAS_FEES_DEPOSIT_BODY, params: stringParams }),
  }),
} as const;
