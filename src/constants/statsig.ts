export type StatsigConfigType = Record<StatSigFlags, boolean>;

/**
 * !README!:
 * If you are using a flag in abacus, you must add it to the abacus
 * StatsigConfig object first! Otherwise it won't be set in the StatsigConfig object
 */
export enum StatSigFlags {
  ffSkipMigration = 'ff_skip_migration',
  ffShowPredictionMarketsUi = 'ff_show_prediction_markets_ui',
  ffEnableEvmSwaps = 'ff_enable_evm_swaps',
  ffEnableKeplr = 'ff_enable_keplr',
}

export type StatsigDynamicConfigType = Record<StatsigDynamicConfigs, any>;

export enum StatsigDynamicConfigs {
  dcMaxSafeBridgeFees = 'dc_max_safe_bridge_fees', // returns number
  dcHighestVolumeUsers = 'dc_highest_volume_users', // returns string[]
}
