export type StatsigConfigType = Record<StatsigFlags, boolean>;

/**
 * !README!:
 * If you are using a flag in abacus, you must add it to the abacus
 * StatsigConfig object first! Otherwise it won't be set in the StatsigConfig object
 */
export enum StatsigFlags {
  ffShowPredictionMarketsUi = 'ff_show_prediction_markets_ui',
  ffEnableKeplr = 'ff_enable_keplr',
  ffEnableAffiliates = 'ff_enable_affiliates',
  ffEnableLimitClose = 'ff_enable_limit_close',
  ffEnableTimestampNonce = 'ff_enable_timestamp_nonce',
  ffEnableFunkit = 'ff_enable_funkit',
  ffEnableFunkitNew = 'ff_enable_funkit_new',
  ffDepositRewrite = 'ff_deposit_rewrite',
  ffWithdrawRewrite = 'ff_withdraw_rewrite',
}

export type StatsigDynamicConfigType = Record<StatsigDynamicConfigs, any>;

export enum StatsigDynamicConfigs {
  dcMaxSafeBridgeFees = 'dc_max_safe_bridge_fees', // returns number
  dcHighestVolumeUsers = 'dc_highest_volume_users', // returns string[]
  dcMaticProposalNotif = 'dc_matic_proposal_notif', // returns string
}
