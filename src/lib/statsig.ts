import { StatsigClient } from '@statsig/js-client';

import { STATSIG_ENVIRONMENT_TIER } from '@/constants/networks';

let statsigClient: StatsigClient;
let initPromise: Promise<StatsigClient> | null = null;

/**
 * This method creates a promise and assigns it to the variable initPromise.
 * If an initPromise has already been generated, it returns the existing promise.
 * This causes all calls to this function to always return the statsigClient only after
 * it has retrieved all values from statsig
 *
 * @returns initPromise: a promise that returns the statsig client only after it is initialized
 */
export const initStatsigAsync = async () => {
  if (initPromise) {
    return initPromise;
  }
  if (statsigClient) return statsigClient;
  initPromise = (async () => {
    statsigClient = new StatsigClient(
      import.meta.env.VITE_STATSIG_CLIENT_KEY ?? '',
      // TODO: create a top level settings.ts file to coerce boolean env vars to actual boolean
      import.meta.env.VITE_TEST_USER_ID === 'true' ? { userID: 'test-id' } : {},
      {
        disableLogging: process.env.VITEST === 'true',
        disableStorage: process.env.VITEST === 'true',
        environment: { tier: STATSIG_ENVIRONMENT_TIER },
      }
    );
    await statsigClient.initializeAsync();
    return statsigClient;
  })();
  return initPromise;
};
