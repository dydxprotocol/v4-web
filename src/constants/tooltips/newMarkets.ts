import { TOOLTIP_STRING_KEYS, type TooltipStrings } from '@/constants/localization';

export const newMarketsTooltips = {
  'reference-price': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.REFERENCE_PRICE_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.REFERENCE_PRICE_BODY }),
  }),
  'self-reported-cmc': ({ stringGetter }) => ({
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.SELF_REPORTED_CMC_BODY }),
  }),
} satisfies TooltipStrings;
