import { TOOLTIP_STRING_KEYS, type TooltipStrings } from '@/constants/localization';

export const vaultTooltips = {
  'vault-your-balance': ({ stringGetter }) => ({
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.YOUR_VAULT_BALANCE_BODY }),
  }),
  'vault-available-to-withdraw': ({ stringGetter }) => ({
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.AVAILABLE_TO_WITHDRAW_BODY }),
  }),
  'vault-estimated-slippage': ({ stringGetter }) => ({
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.ESTIMATED_SLIPPAGE_BODY }),
  }),
  'vault-estimated-amount': ({ stringGetter }) => ({
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.ESTIMATED_AMOUNT_RECEIVED_BODY }),
  }),
  'vault-all-time-pnl': ({ stringGetter }) => ({
    body: stringGetter({ key: TOOLTIP_STRING_KEYS.YOUR_ALL_TIME_PNL_BODY }),
  }),
} satisfies TooltipStrings;
