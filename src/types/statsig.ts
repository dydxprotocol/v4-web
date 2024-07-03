export type StatsigConfigType = {} | Record<StatSigFlags, boolean>;

export enum StatSigFlags {
  ffSkipMigration = 'ff_skip_migration',
}
