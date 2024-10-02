import { TOOLTIP_STRING_KEYS, type TooltipStrings } from '@/constants/localization';

export const generalTooltips = {
  'legacy-signing': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.LEGACY_SIGNING_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.LEGACY_SIGNING_BODY }),
  }),
  'remember-me': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.REMEMBER_ME_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.REMEMBER_ME_BODY }),
  }),
} satisfies TooltipStrings;
