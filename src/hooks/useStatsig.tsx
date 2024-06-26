import { StatsigClient } from '@statsig/js-client';
import { StatsigProvider, useStatsigClient } from '@statsig/react-bindings';

import { useWalletConnection } from './useWalletConnection';

export enum StatSigFlags {
  ffSkipMigration = 'ff_skip_migration',
}

export const StatSigProvider = ({ children }: { children: React.ReactNode }) => {
  const { evmAddress } = useWalletConnection();

  // TODO is it bad to have in here?
  // we have to pass in ip address
  const client = new StatsigClient(`${import.meta.env.VITE_PRIVY_APP_ID}`, {
    userID: evmAddress,
  });

  client.initializeSync();

  return <StatsigProvider client={client}> {children} </StatsigProvider>;
};

export const useStatSigGateValue = (gate: StatSigFlags) => {
  const { checkGate } = useStatsigClient();
  return checkGate(gate);
};
