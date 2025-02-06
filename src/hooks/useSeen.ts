import { useEffect, useRef } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { shallowEqual } from 'react-redux';

import { getUserWalletAddress } from '@/state/accountInfoSelectors';
import { setSeenFills, setSeenOpenOrders, setSeenOrderHistory } from '@/state/accountUiMemory';
import { getSelectedNetwork } from '@/state/appSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';

export function useViewPanel(
  market: string | undefined,
  kind: 'fills' | 'openOrders' | 'orderHistory'
) {
  const networkId = useAppSelector(getSelectedNetwork);
  const walletId = useAppSelector(getUserWalletAddress);
  const height = useAppSelector(BonsaiCore.network.indexerHeight.data);
  const lastSetCore = useRef<any[]>([]);

  const dispatch = useAppDispatch();
  const actionCreator = (
    {
      fills: setSeenFills,
      openOrders: setSeenOpenOrders,
      orderHistory: setSeenOrderHistory,
    } as const
  )[kind];

  const componentWillUnmount = useComponentWillUnmount();

  useEffect(() => {
    if (height != null && walletId != null) {
      // only set once for a given set of configurations
      // effectively, view on mount as soon as we load height
      const thisCore = [market, actionCreator, networkId, walletId];
      if (!shallowEqual(lastSetCore.current, thisCore)) {
        lastSetCore.current = thisCore;
        dispatch(actionCreator({ scope: { networkId, walletId }, market, height }));
      }
    }
    return () => {
      if (componentWillUnmount.current) {
        if (height != null && walletId != null) {
          dispatch(actionCreator({ scope: { networkId, walletId }, market, height }));
        }
      }
    };
  }, [market, actionCreator, networkId, walletId, height, dispatch, componentWillUnmount]);
}

function useComponentWillUnmount() {
  const componentWillUnmount = useRef(false);
  useEffect(() => {
    componentWillUnmount.current = false;
    return () => {
      componentWillUnmount.current = true;
    };
  }, []);
  return componentWillUnmount;
}
