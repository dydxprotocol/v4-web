import { useMemo } from 'react';

import { StatSigFlags, StatsigConfigType } from '@/types/statsig';
import { StatsigClient } from '@statsig/js-client';
import {
  StatsigProvider as StatsigProviderInternal,
  useStatsigClient,
} from '@statsig/react-bindings';

const statsigClient = new StatsigClient(
  // need to default to empty string or it breaks if no key is supplied
  import.meta.env.VITE_STATSIG_CLIENT_KEY ?? '',
  {},
  {
    disableLogging: import.meta.env.VITE_DISABLE_STATSIG,
    disableStorage: import.meta.env.VITE_DISABLE_STATSIG,
  }
);
// TODO: figure out how to init statsig async so we get configs on the first page load without breaking app state
// https://linear.app/dydx/project/feature-experimentation-6853beb333d7/overview
statsigClient.initializeSync();

// Once we figure out how to initialize statsig async, this provider will actually have meaning
// https://linear.app/dydx/project/feature-experimentation-6853beb333d7/overview
export const StatsigProvider = ({ children }: { children: React.ReactNode }) => {
  return <StatsigProviderInternal client={statsigClient}> {children} </StatsigProviderInternal>;
};

export const useStatsigGateValue = (gate: StatSigFlags) => {
  const { checkGate } = useStatsigClient();
  return checkGate(gate);
};

export const useAllStatsigGateValues = () => {
  const { checkGate } = useStatsigClient();
  const allGateValues = useMemo(() => {
    return Object.values(StatSigFlags).reduce((acc, gate) => {
      return { ...acc, [gate]: checkGate(gate) };
    }, {} as StatsigConfigType);
  }, []);
  return allGateValues;
};
