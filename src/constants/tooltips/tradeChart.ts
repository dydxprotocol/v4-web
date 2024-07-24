import { TOOLTIP_STRING_KEYS, type TooltipStrings } from '@/constants/localization';

export const tradeChartTooltips: TooltipStrings = {
  'ohlc': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.OHLC_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.OHLC_BODY }),
  }),
} as const;
