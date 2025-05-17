import { useEffect, useRef, useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';

import { useAppSelector } from '@/state/appTypes';

export function useOnOrderIndexed(callback: () => void) {
  const [clientId, setClientId] = useState<string | undefined>();
  const allOrders = useAppSelector(BonsaiCore.account.allOrders.data);
  const hasCalledFunction = useRef(false);

  useEffect(() => {
    hasCalledFunction.current = false;
  }, [clientId]);
  if (
    !hasCalledFunction.current &&
    clientId != null &&
    allOrders.find((o) => o.clientId === clientId) != null
  ) {
    hasCalledFunction.current = true;
    callback();
  }

  return { setUnIndexedClientId: setClientId, clientId };
}
