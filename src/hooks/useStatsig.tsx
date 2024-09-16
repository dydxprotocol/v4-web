import { useEffect, useMemo, useState } from 'react';

import { StatsigClient } from '@statsig/js-client';
import {
  StatsigProvider as StatsigProviderInternal,
  useStatsigClient,
} from '@statsig/react-bindings';

import {
  StatsigConfigType,
  StatsigDynamicConfigType,
  StatsigDynamicConfigs,
  StatsigFlags,
} from '@/constants/statsig';

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

export const useStatsigGateValue = (gate: StatsigFlags) => {
  const { checkGate } = useStatsigClient();
  return checkGate(gate);
};

export const useAllStatsigDynamicConfigValues = () => {
  const { getDynamicConfig } = useStatsigClient();
  const allDynamicConfigValues = useMemo(() => {
    return Object.values(StatsigDynamicConfigs).reduce((acc, gate) => {
      return { ...acc, [gate]: getDynamicConfig(gate).get('value') };
    }, {} as StatsigDynamicConfigType);
  }, [getDynamicConfig]);
  return allDynamicConfigValues;
};

export const useAllStatsigGateValues = () => {
  const { checkGate } = useStatsigClient();
  const allGateValues = useMemo(() => {
    return Object.values(StatsigFlags).reduce((acc, gate) => {
      return { ...acc, [gate]: checkGate(gate) };
    }, {} as StatsigConfigType);
  }, []);
  return allGateValues;
};
