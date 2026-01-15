import { type PropsWithChildren, useMemo } from 'react';
import { createStarboardClient } from 'fuel-ts-sdk/client';
import type { AssetEntity } from 'fuel-ts-sdk/trading';
import { Provider as ReduxProvider } from 'react-redux';
import localAssets from '@/assets/local-assets.json';
import testnetAssets from '@/assets/testnet-assets.json';
import { NetworkSwitchContext } from '@/contexts/NetworkSwitchContext/NetworkSwitchContext';
import { getIndexerUrl } from '@/lib/env';
import { useRequiredContext } from '@/lib/useRequiredContext';
import type { Network } from '@/models/Network';
import { FuelTsSdkContext } from './FuelTsSdkContext';

interface FuelTsSdkProviderProps extends PropsWithChildren {}

export function FuelTsSdkProvider({ children }: FuelTsSdkProviderProps) {
  const currentNetwork = useRequiredContext(NetworkSwitchContext).getCurrentNetwork();
  const indexerUrl = getIndexerUrl(currentNetwork);
  const assets = getNetworkAssets(currentNetwork);

  const client = useMemo(() => {
    const client = createStarboardClient({
      indexerUrl,
    });
    client.trading.populateAssets(assets);
    return client;
  }, [assets, indexerUrl]);

  return (
    <ReduxProvider store={client.store}>
      <FuelTsSdkContext.Provider value={client}>{children}</FuelTsSdkContext.Provider>
    </ReduxProvider>
  );
}

function getNetworkAssets(network: Network) {
  if (network === 'local') return localAssets as AssetEntity[];
  if (network === 'testnet') return testnetAssets as AssetEntity[];
  throw new Error(`Unsupported Network:  ${network}`);
}
