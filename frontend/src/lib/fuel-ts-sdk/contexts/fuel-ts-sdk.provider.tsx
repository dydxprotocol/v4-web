/* eslint-disable react-hooks/refs */
import { type PropsWithChildren, useRef } from 'react';
import { createStarboardClient } from 'fuel-ts-sdk/client';
import type { Asset } from 'fuel-ts-sdk/trading';
import { Provider as ReduxProvider } from 'react-redux';
import localAssets from '@/assets/local-assets.json';
import testnetAssets from '@/assets/testnet-assets.json';
import { NetworkSwitchContext } from '@/contexts/network-switch/network-switch.context';
import { getIndexerUrl } from '@/lib/env';
import { useRequiredContext } from '@/lib/use-required-context.hook';
import type { Network } from '@/models/network';
import type { FuelTsSdkContextType } from './fuel-ts-sdk.context';
import { FuelTsSdkContext } from './fuel-ts-sdk.context';

interface FuelTsSdkProviderProps extends PropsWithChildren {}

export function FuelTsSdkProvider({ children }: FuelTsSdkProviderProps) {
  const currentNetwork = useRequiredContext(NetworkSwitchContext).getCurrentNetwork();
  const indexerUrl = getIndexerUrl(currentNetwork);
  const assets = getNetworkAssets(currentNetwork);

  const clientRef = useRef<FuelTsSdkContextType | null>(null);

  if (clientRef.current == null) {
    clientRef.current = createStarboardClient({
      indexerUrl,
    });
    clientRef.current.trading.populateAssets(assets);
  }

  return (
    <ReduxProvider store={clientRef.current.store}>
      <FuelTsSdkContext.Provider value={clientRef.current}>{children}</FuelTsSdkContext.Provider>
    </ReduxProvider>
  );
}

function getNetworkAssets(network: Network) {
  if (network === 'local') return localAssets as Asset[];
  if (network === 'testnet') return testnetAssets as Asset[];
  throw new Error(`Unsupported Network:  ${network}`);
}
