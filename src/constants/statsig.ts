import { getLocalStorage } from '@/lib/localStorage';

import { LocalStorageKey } from './localStorage';

export type StatsigConfigType = Record<StatsigFlags, boolean>;

export enum StatsigFlags {
  ffShowPredictionMarketsUi = 'ff_show_prediction_markets_ui',
  ffEnableAffiliates = 'ff_enable_affiliates',
  ffEnableLimitClose = 'ff_enable_limit_close',
  ffEnableTimestampNonce = 'ff_enable_timestamp_nonce',
  ffEnableFunkit = 'ff_enable_funkit',
  ffEnableFunkitNew = 'ff_enable_funkit_new',
  ffDepositRewrite = 'ff_deposit_rewrite',
  ffWithdrawRewrite = 'ff_withdraw_rewrite',

  abPopupDeposit = 'ab_popup_deposit',
}

export enum CustomFlags {
  abDefaultToMarkets = 'ab_default_to_markets',
  // abSimpleUi = 'ab_simple_ui', Deprecated, Full Release
}

// we only use these for flags that MUST be available before statsig can complete loading
// WARNING: if you roll at a low probability, it will remember the value forever
// best practice is never change the flag rates
export const CUSTOM_FLAG_ROLLED_VALUES: Record<CustomFlags, boolean | undefined> = getLocalStorage({
  key: LocalStorageKey.CustomFlags,
  defaultValue: {
    ab_default_to_markets: undefined,
  },
});

export const CUSTOM_FLAG_RATES: Record<CustomFlags, number> = {
  ab_default_to_markets: 0.5,
};

export type StatsigDynamicConfigType = Record<StatsigDynamicConfigs, any>;

export enum StatsigDynamicConfigs {
  dcMaxSafeBridgeFees = 'dc_max_safe_bridge_fees', // returns number
  dcHighestVolumeUsers = 'dc_highest_volume_users', // returns string[]
  dcMaticProposalNotif = 'dc_matic_proposal_notif', // returns string
}
