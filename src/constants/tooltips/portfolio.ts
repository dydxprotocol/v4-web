import { type TooltipStrings, TOOLTIP_STRING_KEYS } from '@/constants/localization';

export const portfolioTooltips: TooltipStrings = {
  'holding-hedgies': ({ stringGetter, stringParams }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.HOLDING_HEDGIES_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.HOLDING_HEDGIES_BODY, params: stringParams }),
  }),
} as const;
