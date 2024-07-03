import { StatSigFlags, StatsigConfigType } from '@/types/statsig';
import { StatsigClient } from '@statsig/js-client';

let statsigClient: StatsigClient;
let initPromise: Promise<StatsigClient> | null = null;

export const initStatsig = async () => {
  if (initPromise) {
    return initPromise;
  }
  if (statsigClient) return statsigClient;

  initPromise = (async () => {
    statsigClient = new StatsigClient(
      import.meta.env.VITE_STATSIG_CLIENT_KEY ?? '',
      { userID: 'test-id' },
      {
        disableLogging: import.meta.env.VITE_DISABLE_STATSIG,
        disableStorage: import.meta.env.VITE_DISABLE_STATSIG,
      }
    );
    await statsigClient.initializeAsync();
    return statsigClient;
  })();
  return initPromise;
};

// TODO: figure out how to init statsig async so we get configs on the first page load without breaking app state
// https://linear.app/dydx/project/feature-experimentation-6853beb333d7/overview

export const statsigConfigPromise = async () => {
  const client = await initStatsig();
  const allGateValues = Object.values(StatSigFlags).reduce((acc, gate) => {
    return { ...acc, [gate]: client.checkGate(gate) };
  }, {} as StatsigConfigType);
  return allGateValues;
};
