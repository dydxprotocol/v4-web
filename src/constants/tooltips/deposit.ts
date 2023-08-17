import { type TooltipStrings, TOOLTIP_STRING_KEYS } from '@/constants/localization';

export const depositTooltips: TooltipStrings = {
  swap: ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.SWAP_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.SWAP_BODY }),
  }),
} as const;
