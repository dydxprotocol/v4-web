import { type RootStore } from '@/state/_store';
import { updateFilledOrders, updateOrders } from '@/state/localOrders';

import { createStoreEffect } from '../lib/createStoreEffect';
import { BonsaiCore } from '../ontology';

// TODO - rewrite this when we migrate notifications from abacus
export function setUpLocalOrdersOrdersSync(store: RootStore) {
  return createStoreEffect(store, BonsaiCore.account.allOrders.data, (orders) => {
    store.dispatch(updateOrders(orders));
    return () => {};
  });
}

export function setUpLocalOrdersFillsSync(store: RootStore) {
  return createStoreEffect(store, BonsaiCore.account.fills.data, (fills) => {
    store.dispatch(updateFilledOrders(fills));
    return () => {};
  });
}
