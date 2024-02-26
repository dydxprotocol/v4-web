import { useQuery } from 'react-query';

import { timeUnits } from '@/constants/time';

import { log } from '@/lib/telemetry';

import { useDydxClient } from './useDydxClient';

const POLLING_MS = timeUnits.hour;
export const SEVEN_DAY_SPARKLINE_ENTRIES = 42;

export const usePerpetualMarketSparklines = () => {
  const { getPerpetualMarketSparklines } = useDydxClient();

  const { data } = useQuery({
    queryKey: 'perpetualMarketSparklines',
    queryFn: () => {
      try {
        return getPerpetualMarketSparklines({ period: 'SEVEN_DAYS' });
      } catch (error) {
        log('usePerpetualMarketSparklines', error);
      }
    },
    refetchInterval: POLLING_MS,
  });

  return data;
};
