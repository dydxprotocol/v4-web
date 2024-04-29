import { type TooltipStrings, TOOLTIP_STRING_KEYS } from '@/constants/localization';

import { CCTP_MAINNET_CHAIN_NAMES_CAPITALIZED } from '../cctp';

export const depositTooltips: TooltipStrings = {
  'minimum-deposit-amount': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.MINIMUM_DEPOSIT_AMOUNT_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.MINIMUM_DEPOSIT_AMOUNT_BODY }),
  }),
  swap: ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.SWAP_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.SWAP_BODY }),
  }),
  'lowest-fees-deposit': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.LOWEST_FEE_DEPOSITS_TITLE }),
    body: stringGetter({
      key: TOOLTIP_STRING_KEYS.LOWEST_FEE_DEPOSITS_BODY,
      params: {
        LOWEST_FEE_TOKEN_NAMES: CCTP_MAINNET_CHAIN_NAMES_CAPITALIZED.join(', '),
      },
    }),
  }),
  'gas-fees-deposit': ({ stringGetter, stringParams }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.GAS_FEES_DEPOSIT_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.GAS_FEES_DEPOSIT_BODY, params: stringParams }),
  }),
  'bridge-fees-deposit': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.BRIDGE_FEES_DEPOSIT_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.BRIDGE_FEES_DEPOSIT_BODY }),
  }),
} as const;
