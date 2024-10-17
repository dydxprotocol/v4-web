import { TOOLTIP_STRING_KEYS, TooltipStrings } from '../localization';

export const affiliateTooltips: TooltipStrings = {
  'affiliate-commissions': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.AFFILIATE_COMMISSIONS_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.AFFILIATE_COMMISSIONS_BODY }),
  }),
} as const;
