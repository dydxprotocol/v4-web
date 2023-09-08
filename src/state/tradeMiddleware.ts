import type { PayloadAction } from '@reduxjs/toolkit';

import type { SubaccountOrder } from '@/constants/abacus';

import { removeUncommittedOrderClientId, setSubaccount } from '@/state/account';

import { getSubaccountOrders, getUncommittedOrderClientIds } from '@/state/accountSelectors';

export default (store: any) => (next: any) => async (action: PayloadAction<any>) => {
  const { type, payload } = action;
  const state = store.getState();
  next(action);

  switch (type) {
    case setSubaccount.type: {
      const updatedOrders = payload?.orders?.toArray() || [];
      const orders = getSubaccountOrders(state);
      const uncommittedOrderClientIds = getUncommittedOrderClientIds(state);

      if (uncommittedOrderClientIds?.length && updatedOrders?.length !== orders?.length) {
        const updatedOrdersClientIds = Object.fromEntries(
          updatedOrders.map((order: SubaccountOrder) => [order.clientId, order])
        );

        const receivedClientId = uncommittedOrderClientIds.find(
          (clientId) => updatedOrdersClientIds[clientId]
        );

        if (receivedClientId) {
          store.dispatch(removeUncommittedOrderClientId(receivedClientId));
        }
      }
      break;
    }
    default: {
      break;
    }
  }
};
