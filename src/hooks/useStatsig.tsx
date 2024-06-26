import { StatsigClient } from '@statsig/js-client';
import { StatsigProvider, useStatsigClient } from '@statsig/react-bindings';

import { useWalletConnection } from './useWalletConnection';

const CLIENT_KEY = 'client-d456XgPoy4wF2fZ9rKRTq6czkLvNHJyNeRRL5cb1RCI'; // TODO move to .env, and preappend with vite? might have to add with vercel

export enum StatSigFlags {
  ffSkipMigration = 'ff_skip_migration',
}

export const StatSigProvider = ({ children }: { children: React.ReactNode }) => {
  const { evmAddress } = useWalletConnection();

  // TODO is it bad to have in here?
  // we have to pass in ip address
  const client = new StatsigClient(CLIENT_KEY, {
    userID: evmAddress,
  });

  client.initializeSync();

  return <StatsigProvider client={client}> {children} </StatsigProvider>;
};

export const useStatSigGateValue = (gate: StatSigFlags) => {
  const { checkGate } = useStatsigClient();
  return checkGate(gate);
};
