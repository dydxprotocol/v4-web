import { type TooltipStrings, TOOLTIP_STRING_KEYS } from '@/constants/localization';

export const generalTooltips: TooltipStrings = {
  'legacy-signing': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.LEGACY_SIGNING_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.LEGACY_SIGNING_BODY }),
  }),
  'remember-me': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.REMEMBER_ME_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.REMEMBER_ME_BODY }),
  }),
} as const;
