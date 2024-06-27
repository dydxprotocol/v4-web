import { StatsigClient } from '@statsig/js-client';

const fetchIp = async () => {
  const resp = await fetch('https://api.ipify.org?format=json');
  return resp.json();
};
const ip = await fetchIp();
export const statsigClient = new StatsigClient(import.meta.env.VITE_STATSIG_CLIENT_KEY, {
  ip,
});
await statsigClient.initializeAsync();

export enum StatSigFlags {
  // When adding a flag here, make sure to add an analytics tracker in useAnalytics.ts
  ffSkipMigration = 'ff_skip_migration',
}
