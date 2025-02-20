import { useEffect, useState } from 'react';

import { selectCompositeClientReady, selectIndexerReady } from '@/bonsai/socketSelectors';
import { CompositeClient, IndexerClient } from '@dydxprotocol/v4-client-js';

import { getSelectedNetwork } from '@/state/appSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';

import { CompositeClientManager } from './compositeClientManager';

export function useIndexerClient() {
  const selectedNetwork = useAppSelector(getSelectedNetwork);
  const indexerReady = useAppSelector(selectIndexerReady);
  const dispatch = useAppDispatch();

  const [client, setClient] = useState<IndexerClient | undefined>(undefined);

  useEffect(() => {
    if (!indexerReady) {
      return undefined;
    }
    const clientConfig = {
      network: selectedNetwork,
      dispatch,
    };
    setClient(CompositeClientManager.use(clientConfig).indexer!);
    return () => {
      setClient(undefined);
      CompositeClientManager.markDone(clientConfig);
    };
  }, [selectedNetwork, indexerReady, dispatch]);

  return { indexerClient: client, key: `${selectedNetwork}-${indexerReady}` };
}

export function useCompositeClient() {
  const selectedNetwork = useAppSelector(getSelectedNetwork);
  const compositeClientReady = useAppSelector(selectCompositeClientReady);
  const dispatch = useAppDispatch();

  const [client, setClient] = useState<CompositeClient | undefined>(undefined);

  useEffect(() => {
    if (!compositeClientReady) {
      return undefined;
    }
    const clientConfig = {
      network: selectedNetwork,
      dispatch,
    };
    setClient(CompositeClientManager.use(clientConfig).compositeClient!);
    return () => {
      setClient(undefined);
      CompositeClientManager.markDone(clientConfig);
    };
  }, [selectedNetwork, compositeClientReady, dispatch]);

  return { compositeClient: client, key: `${selectedNetwork}-${compositeClientReady}` };
}
