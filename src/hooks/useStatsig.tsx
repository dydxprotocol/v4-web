import { useEffect, useState } from 'react';

import { StatsigClient } from '@statsig/js-client';
import { StatsigProvider, useStatsigClient } from '@statsig/react-bindings';

import { StatSigFlags, statsigClientPromise } from '@/lib/statsig';

export const StatSigProvider = ({ children }: { children: React.ReactNode }) => {
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
  return <StatsigProvider client={client}> {children} </StatsigProvider>;
};

export const useStatSigGateValue = (gate: StatSigFlags) => {
  const { checkGate } = useStatsigClient();
  return checkGate(gate);
};
