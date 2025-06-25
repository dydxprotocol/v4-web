import { useEffect, useMemo, useState } from 'react';

import { StatsigClient } from '@statsig/js-client';
import {
  StatsigProvider as StatsigProviderInternal,
  useStatsigClient,
} from '@statsig/react-bindings';

import { AnalyticsUserProperties } from '@/constants/analytics';
import { LocalStorageKey } from '@/constants/localStorage';
import {
  CUSTOM_FLAG_RATES,
  CUSTOM_FLAG_ROLLED_VALUES,
  CustomFlags,
  StatsigConfigType,
  StatsigDynamicConfigType,
  StatsigDynamicConfigs,
  StatsigFlags,
} from '@/constants/statsig';

import { identify } from '@/lib/analytics/analytics';
import { setLocalStorage } from '@/lib/localStorage';
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

export function useCustomFlagValue(flag: CustomFlags) {
  if (CUSTOM_FLAG_ROLLED_VALUES[flag] == null) {
    const rate = CUSTOM_FLAG_RATES[flag];
    CUSTOM_FLAG_ROLLED_VALUES[flag] = Math.random() < rate;
    identify(AnalyticsUserProperties.CustomFlags(CUSTOM_FLAG_ROLLED_VALUES));
    setLocalStorage({ key: LocalStorageKey.CustomFlags, value: CUSTOM_FLAG_ROLLED_VALUES });
  }

  return CUSTOM_FLAG_ROLLED_VALUES[flag];
}
