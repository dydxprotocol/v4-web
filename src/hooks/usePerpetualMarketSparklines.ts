import { useQuery } from 'react-query';

import type { PerpetualMarketSparklineResponse } from '@/constants/indexer';
import { timeUnits } from '@/constants/time';

import { log } from '@/lib/telemetry';

import { useDydxClient } from './useDydxClient';

const POLLING_MS = timeUnits.hour;
export const SEVEN_DAY_SPARKLINE_ENTRIES = 42;
export const ONE_DAY_SPARKLINE_ENTRIES = 24;

type UsePerpetualMarketSparklinesProps = {
  period?: 'ONE_DAY' | 'SEVEN_DAYS';
  refetchInterval?: number;
};

export const usePerpetualMarketSparklines = (props: UsePerpetualMarketSparklinesProps = {}) => {
  const { period = 'SEVEN_DAYS', refetchInterval = POLLING_MS } = props;
  const { getPerpetualMarketSparklines, compositeClient } = useDydxClient();

  const { data } = useQuery<PerpetualMarketSparklineResponse | undefined>({
    enabled: Boolean(compositeClient),
    queryKey: ['perpetualMarketSparklines', period],
    queryFn: () => {
      try {
        return getPerpetualMarketSparklines({ period });
      } catch (error) {
        log('usePerpetualMarketSparklines', error);
      }
    },
    refetchInterval,
    refetchOnWindowFocus: false,
  });

  return data;
};
