import { TOOLTIP_STRING_KEYS, type TooltipStrings } from '@/constants/localization';

export const portfolioTooltips = {
  'holding-hedgies': ({ stringGetter, stringParams }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.HOLDING_HEDGIES_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.HOLDING_HEDGIES_BODY, params: stringParams }),
  }),
} satisfies TooltipStrings;
