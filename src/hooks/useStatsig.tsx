import { useEffect, useMemo, useState } from 'react';

import { StatSigFlags, StatsigConfigType } from '@/types/statsig';
import { StatsigClient } from '@statsig/js-client';
import {
  StatsigProvider as StatsigProviderInternal,
  useStatsigClient,
} from '@statsig/react-bindings';

import { initStatsigAsync } from '@/lib/statsig';

export const StatsigProvider = ({ children }: { children: React.ReactNode }) => {
  const [statsigClient, setStatsigClient] = useState<StatsigClient | null>(null);
  useEffect(() => {
    const init = async () => {
      const client = await initStatsigAsync();
      setStatsigClient(client);
    };
    init();
  }, []);
  if (!statsigClient) return <div>{children}</div>;
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
