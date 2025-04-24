import { type RootStore } from '@/state/_store';
import { updateOrders } from '@/state/localOrders';

import { createStoreEffect } from '../lib/createStoreEffect';
import { BonsaiCore } from '../ontology';

export function setUpLocalOrdersOrdersSync(store: RootStore) {
  return createStoreEffect(store, BonsaiCore.account.allOrders.data, (orders) => {
    store.dispatch(updateOrders(orders));
    return () => {};
  });
}
