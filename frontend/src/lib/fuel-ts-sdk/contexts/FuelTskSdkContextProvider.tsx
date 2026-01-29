import { type PropsWithChildren, useEffect, useMemo } from 'react';
import { createStarboardClient } from 'fuel-ts-sdk/client';
import type { AssetEntity } from 'fuel-ts-sdk/trading';
import { Provider as ReduxProvider } from 'react-redux';
import localAssets from '@/assets/local-assets.json';
import testnetAssets from '@/assets/testnet-assets.json';
import { NetworkSwitchContext } from '@/contexts/NetworkSwitchContext/NetworkSwitchContext';
import { WalletContext } from '@/contexts/WalletContext';
import { envs } from '@/lib/env';
import { useRequiredContext } from '@/lib/useRequiredContext';
import type { Network } from '@/models/Network';
import { useSdkQuery } from '../hooks';
import { useAccountsSdk } from '../hooks/useAccountsSdk';
import { FuelTsSdkContext } from './FuelTsSdkContext';

interface FuelTsSdkProviderProps extends PropsWithChildren {}

export function FuelTsSdkProvider({ children }: FuelTsSdkProviderProps) {
  const currentNetwork = useRequiredContext(NetworkSwitchContext).getCurrentNetwork();
  const indexerUrl = envs.getIndexerUrlByNetwork(currentNetwork);
  const assets = getNetworkAssets(currentNetwork);
  const wallet = useRequiredContext(WalletContext);

  const client = useMemo(() => {
    const client = createStarboardClient({
      indexerUrl,
      vaultContractId: envs.getVaultContractIdByNetwork(currentNetwork),
      testnetTokenContractId: envs.getTestnetTokenContractIdByNetwork(currentNetwork),
      accountGetter: wallet.getCurrentAccount,
    });
    client.trading.populateAssets(assets);
    return client;
  }, [assets, currentNetwork, indexerUrl, wallet.getCurrentAccount]);

  return (
    <ReduxProvider store={client.store}>
      <FuelTsSdkContext.Provider value={client}>
        <WalletBalancesInitializer />
        {children}
      </FuelTsSdkContext.Provider>
    </ReduxProvider>
  );
}

function WalletBalancesInitializer() {
  const wallet = useRequiredContext(WalletContext);
  const accountsSdk = useAccountsSdk();
  const userDataFetchStatus = useSdkQuery(accountsSdk.getCurrentUserDataFetchStatus);

  const hasConnectivityChanged = wallet.isUserConnected();
  useEffect(() => {
    accountsSdk.invalidateCurrentUserData();
  }, [hasConnectivityChanged, accountsSdk]);

  useEffect(() => {
    if (userDataFetchStatus === 'uninitialized') {
      accountsSdk.fetchCurrentUserData();
      return;
    }
  }, [accountsSdk, userDataFetchStatus]);

  return null;
}

function getNetworkAssets(network: Network) {
  if (network === 'local') return localAssets as AssetEntity[];
  if (network === 'testnet') return testnetAssets as AssetEntity[];
  throw new Error(`Unsupported Network:  ${network}`);
}
