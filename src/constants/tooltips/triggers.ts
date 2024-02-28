import { TOOLTIP_STRING_KEYS, type TooltipStrings } from '@/constants/localization';

export const triggersTooltips: TooltipStrings = {
  'custom-amount': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.CUSTOM_AMOUNT_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.CUSTOM_AMOUNT_BODY }),
  }),
  'limit-price': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.LIMIT_PRICE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.LIMIT_PRICE_BODY }),
  }),
  'stop-loss': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.STOP_LOSS_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.STOP_LOSS_BODY }),
  }),
  'take-profit': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.TAKE_PROFIT_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.TAKE_PROFIT_BODY }),
  }),
  'unequal-order-sizes': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.UNEQUAL_ORDER_SIZES_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.UNEQUAL_ORDER_SIZES_BODY }),
  }),
} as const;
