import { TOOLTIP_STRING_KEYS, type TooltipStrings } from '@/constants/localization';

export const stakeTooltips: TooltipStrings = {
  'validator-selection': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.VALIDATOR_SELECTION_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.VALIDATOR_SELECTION_BODY }),
  }),
} as const;
