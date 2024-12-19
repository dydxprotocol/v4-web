import { useEffect, useState } from 'react';

import { selectCompositeClientReady, selectIndexerReady } from '@/abacus-ts/socketSelectors';
import { CompositeClient, IndexerClient } from '@dydxprotocol/v4-client-js';

import { store } from '@/state/_store';
import { getSelectedNetwork } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

import { CompositeClientManager } from './compositeClientManager';

export function useIndexer() {
  const selectedNetwork = useAppSelector(getSelectedNetwork);
  const indexerReady = useAppSelector(selectIndexerReady);

  const [client, setClient] = useState<IndexerClient | undefined>(undefined);

  useEffect(() => {
    if (!indexerReady) {
      return undefined;
    }
    const clientConfig = {
      network: selectedNetwork,
      store,
    };
    setClient(CompositeClientManager.use(clientConfig).indexer!);
    return () => {
      setClient(undefined);
      CompositeClientManager.markDone(clientConfig);
    };
  }, [selectedNetwork, indexerReady]);

  return { indexerClient: client, key: `${selectedNetwork}-${indexerReady}` };
}

export function useCompositeClient() {
  const selectedNetwork = useAppSelector(getSelectedNetwork);
  const compositeClientReady = useAppSelector(selectCompositeClientReady);

  const [client, setClient] = useState<CompositeClient | undefined>(undefined);

  useEffect(() => {
    if (!compositeClientReady) {
      return undefined;
    }
    const clientConfig = {
      network: selectedNetwork,
      store,
    };
    setClient(CompositeClientManager.use(clientConfig).compositeClient!);
    return () => {
      setClient(undefined);
      CompositeClientManager.markDone(clientConfig);
    };
  }, [selectedNetwork, compositeClientReady]);

  return { compositeClient: client, key: `${selectedNetwork}-${compositeClientReady}` };
}
