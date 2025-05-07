import { useEffect, useMemo, useRef } from 'react';

import { selectCompositeClientKey, selectIndexerClientKey } from '@/bonsai/socketSelectors';

import { getSelectedNetwork } from '@/state/appSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';

import { CompositeClientManager, CompositeClientWrapper } from './compositeClientManager';

export function useCompositeClientManager() {
  const selectedNetwork = useAppSelector(getSelectedNetwork);
  const dispatch = useAppDispatch();

  // Create config object in a useMemo
  const config = useMemo(
    () => ({
      network: selectedNetwork,
      dispatch,
    }),
    [selectedNetwork, dispatch]
  );

  // we use a ref with initial value so that it is valid on first render
  const managerRef = useRef<CompositeClientWrapper | null>(CompositeClientManager.use(config));

  // we have to use useEffect to ensure we have cleanup on unmount
  useEffect(() => {
    // this is to clean up the useRef initialization
    if (managerRef.current != null) {
      CompositeClientManager.markDone(config);
      managerRef.current = null;
    }
    managerRef.current = CompositeClientManager.use(config);

    return () => {
      CompositeClientManager.markDone(config);
      managerRef.current = null;
    };
  }, [config]);

  return managerRef.current;
}

export function useIndexerClient() {
  const indexerKey = useAppSelector(selectIndexerClientKey);
  const manager = useCompositeClientManager();
  return { indexerClient: manager?.indexer.client, key: indexerKey };
}

export function useCompositeClient() {
  const clientKey = useAppSelector(selectCompositeClientKey);
  const manager = useCompositeClientManager();

  return {
    compositeClient: manager?.compositeClient.client,
    key: clientKey,
  };
}
