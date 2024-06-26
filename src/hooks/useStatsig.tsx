import { StatsigClient } from '@statsig/js-client';
import { StatsigProvider, useStatsigClient } from '@statsig/react-bindings';

export enum StatSigFlags {
  ffSkipMigration = 'ff_skip_migration',
}

export const StatSigProvider = ({ children }: { children: React.ReactNode }) => {
  const client = new StatsigClient(`${import.meta.env.VITE_PRIVY_APP_ID}`, {});

  client.initializeSync();

  return <StatsigProvider client={client}> {children} </StatsigProvider>;
};

export const useStatSigGateValue = (gate: StatSigFlags) => {
  const { checkGate } = useStatsigClient();
  return checkGate(gate);
};
