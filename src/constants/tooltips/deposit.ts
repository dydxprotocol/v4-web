import { TOOLTIP_STRING_KEYS, TooltipStrings } from '@/constants/localization';

import { TransferType } from '../abacus';
import { getLowestFeeChainNames } from '../cctp';

export const depositTooltips = {
  'minimum-deposit-amount': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.MINIMUM_DEPOSIT_AMOUNT_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.MINIMUM_DEPOSIT_AMOUNT_BODY }),
  }),
  swap: ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.SWAP_TITLE }),
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.SWAP_BODY }),
  }),
  // can pipe in featureflags as a param here like so: ({ stringGetter, featureFlags })
  'lowest-fees-deposit': ({ stringGetter }) => ({
    title: stringGetter({ key: TOOLTIP_STRING_KEYS.LOWEST_FEE_DEPOSITS_TITLE }),
    body: stringGetter({
      key: TOOLTIP_STRING_KEYS.LOWEST_FEE_DEPOSITS_BODY,
      params: {
        LOWEST_FEE_TOKEN_NAMES: getLowestFeeChainNames(TransferType.deposit).join(', '),
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
} satisfies TooltipStrings;
