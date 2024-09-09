import { useEffect, useMemo, useState } from 'react';

import { StatsigClient } from '@statsig/js-client';
import {
  StatsigProvider as StatsigProviderInternal,
  useStatsigClient,
  useStatsigUser,
} from '@statsig/react-bindings';

import {
  StatSigFlags,
  StatsigConfigType,
  StatsigDynamicConfigType,
  StatsigDynamicConfigs,
} from '@/constants/statsig';

import { initStatsigAsync } from '@/lib/statsig';

import { useAccounts } from './useAccounts';

export const StatsigProvider = ({ children }: { children: React.ReactNode }) => {
  const [statsigClient, setStatsigClient] = useState<StatsigClient | null>(null);
  const { updateUserSync } = useStatsigUser();
  const { dydxAddress } = useAccounts();
  useEffect(() => {
    const init = async () => {
      const client = await initStatsigAsync();
      setStatsigClient(client);
    };
    init();
  }, []);

  // TODO: consider moving either updateUser to its own hook, or the react bindings to a separate hook.
  // we don't want to have the statsigGateValue methods module import from other hooks
  // because then those hooks will have a circular dependency if they want to use statsig
  useEffect(() => {
    updateUserSync({ userID: dydxAddress });
  });
  if (!statsigClient) return <div>{children}</div>;
  return <StatsigProviderInternal client={statsigClient}> {children} </StatsigProviderInternal>;
};

export const useStatsigGateValue = (gate: StatSigFlags) => {
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
  const { user } = useStatsigUser();
  const allGateValues = useMemo(
    () =>
      Object.values(StatSigFlags).reduce((acc, gate) => {
        return { ...acc, [gate]: checkGate(gate) };
      }, {} as StatsigConfigType),
    // Certain flag values may change once a user connects their wallet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user]
  );
  return allGateValues;
};
