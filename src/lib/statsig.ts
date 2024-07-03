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
      import.meta.env.VITE_TEST_USER_ID === 'true' ? { userID: 'test-id' } : {},
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

/**
 *
 * This is used only in useInitializePage to block abacus start on the fully loaded async statsig config.
 * This prevents new users from automatically received a 'false' for all feature gates because they
 * don't have a statsig value cached.
 */
export const statsigConfigPromise = async () => {
  const client = await initStatsig();
  const allGateValues = Object.values(StatSigFlags).reduce((acc, gate) => {
    return { ...acc, [gate]: client.checkGate(gate) };
  }, {} as StatsigConfigType);
  return allGateValues;
};
