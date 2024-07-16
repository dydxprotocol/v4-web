import { StatSigFlags, StatsigConfigType } from '@/types/statsig';
import { StatsigClient } from '@statsig/js-client';
import { merge } from 'lodash';

import { log } from './telemetry';

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
 * @param client statsig client to check
 * @param gateId
 * @returns
 */
const checkGateTyped = (client: StatsigClient, gateId: StatSigFlags) => {
  return client.checkGate(gateId);
};

/**
 *
 * This is used only in useInitializePage to block abacus start on the fully loaded async statsig config.
 * This prevents new users from automatically received a 'false' for all feature gates because they
 * don't have a statsig value cached.
 *
 * Try catches in case the statsig init or gatechecks fail.
 */
export const getStatsigConfigAsync = async (): Promise<StatsigConfigType> => {
  try {
    const client = await initStatsigAsync();
    const gateValuesList = Object.values(StatSigFlags).map((gateId) => ({
      [gateId]: checkGateTyped(client, gateId),
    }));
    const statsigConfig = merge({}, ...gateValuesList);
    return statsigConfig;
  } catch (err) {
    log('statsig/statsigConfigPromise', err);
    return {} as StatsigConfigType;
  }
};
