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
  // we dont want the app to load until statsig configs have been loaded
  // this enables us to use statsig on libs which load before the react app
  if (!client) return null;
  return <StatsigProvider client={client}> {children} </StatsigProvider>;
};

export const useStatSigGateValue = (gate: StatSigFlags) => {
  const { checkGate } = useStatsigClient();
  return checkGate(gate);
};
