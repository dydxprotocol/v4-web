import { StatsigClient } from '@statsig/js-client';
import { StatsigProvider, useStatsigClient } from '@statsig/react-bindings';

export enum StatSigFlags {
  // When adding a flag here, make sure to add an analytics tracker in useAnalytics.ts
  ffSkipMigration = 'ff_skip_migration',
}

export const StatSigProvider = ({ children }: { children: React.ReactNode }) => {
  const client = new StatsigClient(`${import.meta.env.VITE_STATSIG_CLIENT_KEY}`, {
    // TODO: fill in with ip address
  });
  client.initializeSync();

  return <StatsigProvider client={client}> {children} </StatsigProvider>;
};

export const useStatSigGateValue = (gate: StatSigFlags) => {
  const { checkGate } = useStatsigClient();
  return checkGate(gate);
};
