import { useEffect, useState } from 'react';

import { StatSigFlags, StatsigConfigType } from '@/types/statsig';
import { StatsigClient } from '@statsig/js-client';
import {
  StatsigProvider as StatsigProviderInternal,
  useStatsigClient,
} from '@statsig/react-bindings';

import { statsigClientPromise } from '@/lib/statsig';

export const StatsigProvider = ({ children }: { children: React.ReactNode }) => {
  const [client, setClient] = useState<StatsigClient | null>(null);
  useEffect(() => {
    const setAsyncClient = async () => {
      const statsigClient = await statsigClientPromise;
      setClient(statsigClient);
    };
    setAsyncClient();
  }, [statsigClientPromise]);
  // if no client, render without provider until a client exists
  if (!client) return <div>{children}</div>;
  return <StatsigProviderInternal client={client}> {children} </StatsigProviderInternal>;
};

export const useStatsigGateValue = (gate: StatSigFlags) => {
  const { checkGate } = useStatsigClient();
  return checkGate(gate);
};

export const useAllStatsigGateValues = () => {
  const { checkGate } = useStatsigClient();
  return Object.values(StatSigFlags).reduce((acc, gate) => {
    return { ...acc, [gate]: checkGate(gate) };
  }, {} as StatsigConfigType);
};
