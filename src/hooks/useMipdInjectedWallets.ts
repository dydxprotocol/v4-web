import { useMemo, useSyncExternalStore } from 'react';

import { uniqBy } from 'lodash';
import { createStore, EIP6963ProviderDetail } from 'mipd';
import { injected } from 'wagmi/connectors';

const store = createStore();

export type MipdInjectedWallet = {
  detail: EIP6963ProviderDetail;
  connector: ReturnType<typeof injected>;
};

function useMipdInjectedProviderDetails(): readonly EIP6963ProviderDetail[] {
  const availableProviders = useSyncExternalStore(store.subscribe, store.getProviders);
  return uniqBy(availableProviders, (provider: EIP6963ProviderDetail) => provider.info.rdns);
}

export function useMipdInjectedWallets(): MipdInjectedWallet[] {
  const injectedWallets = useMipdInjectedProviderDetails();

  return useMemo(
    () =>
      injectedWallets.map((detail) => ({
        connector: getConnectorForInjectedProvider(detail),
        detail,
      })),
    [injectedWallets]
  );
}

function getConnectorForInjectedProvider(providerDetail: EIP6963ProviderDetail) {
  return injected({
    target: {
      ...providerDetail.info,
      id: providerDetail.info.rdns,
      provider: providerDetail.provider,
    },
  });
}

export function getMipdConnectorByRdns(rdns: string): ReturnType<typeof injected> | undefined {
  const providerDetail = store.findProvider({ rdns });
  if (!providerDetail) return undefined;

  return getConnectorForInjectedProvider(providerDetail);
}
