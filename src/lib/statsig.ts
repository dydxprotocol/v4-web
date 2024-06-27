import { StatsigClient } from '@statsig/js-client';

const fetchIp = async () => {
  const resp = await fetch('https://api.ipify.org?format=json');
  return (await resp.json())?.ip;
};

let statsigClient: StatsigClient;

const initStatsig = async () => {
  if (statsigClient) return statsigClient;
  statsigClient = new StatsigClient(
    import.meta.env.VITE_STATSIG_CLIENT_KEY,
    {
      ip: await fetchIp(),
    },
    {
      disableLogging: import.meta.env.VITE_DISABLE_STATSIG,
      disableStorage: import.meta.env.VITE_DISABLE_STATSIG,
    }
  );
  if (import.meta.env.VITE_DISABLE_STATSIG) return statsigClient;
  await statsigClient.initializeSync();
  return statsigClient;
};

export const statsigClientPromise = initStatsig();

export const statsigCheckGatePromise = async (gateId: StatSigFlags) => {
  const client = await statsigClientPromise;
  return client.checkGate(gateId);
};

export enum StatSigFlags {
  // When adding a flag here, make sure to add an analytics tracker in useAnalytics.ts
  ffSkipMigration = 'ff_skip_migration',
}
