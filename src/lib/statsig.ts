import { StatSigFlags, StatsigConfigType } from '@/types/statsig';
import { StatsigClient } from '@statsig/js-client';

const fetchIp = async () => {
  const resp = await fetch('https://api.ipify.org?format=json');
  return (await resp.json())?.ip;
};

let statsigClient: StatsigClient;

export const initStatsig = async () => {
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

/**
 * This function should typically be avoided in favor of the useStatsig hook
 * This is used in useInitializePage to retrieve configs for abacus only once
 * inside of a useEffect hook.
 *
 */
export const statsigGetAllGateValuesPromise = async () => {
  const client = await initStatsig();
  const allGateValues = Object.values(StatSigFlags).reduce((acc, gate) => {
    return { ...acc, [gate]: client.checkGate(gate) };
  }, {} as StatsigConfigType);
  return allGateValues;
};
