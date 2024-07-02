import { StatsigClient } from '@statsig/js-client';

let statsigClient: StatsigClient;

export const initStatsig = async () => {
  if (statsigClient) return statsigClient;
  statsigClient = new StatsigClient(
    import.meta.env.VITE_STATSIG_CLIENT_KEY,
    {},
    {
      disableLogging: import.meta.env.VITE_DISABLE_STATSIG,
      disableStorage: import.meta.env.VITE_DISABLE_STATSIG,
    }
  );
  await statsigClient.initializeAsync();
  return statsigClient;
};
