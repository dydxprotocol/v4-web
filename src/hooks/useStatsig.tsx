import { StatsigProvider, useStatsigClient } from '@statsig/react-bindings';

import { StatSigFlags, statsigClient } from '@/lib/statsig';

export const StatSigProvider = ({ children }: { children: React.ReactNode }) => {
  // const client = new StatsigClient(`${import.meta.env.VITE_STATSIG_CLIENT_KEY}`, {
  //   // TODO: fill in with ip address
  // });
  // client.initializeSync();
  return <StatsigProvider client={statsigClient}> {children} </StatsigProvider>;
};

export const useStatSigGateValue = (gate: StatSigFlags) => {
  const { checkGate } = useStatsigClient();
  return checkGate(gate);
};
