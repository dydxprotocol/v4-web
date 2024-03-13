import type { PayloadAction } from '@reduxjs/toolkit';

import { setSelectedNetwork } from '@/state/app';
import { resetPerpetualsState } from '@/state/perpetuals';

import abacusStateManager from '@/lib/abacus';

export default (store: any) => (next: any) => async (action: PayloadAction<any>) => {
  next(action);

  const { type, payload } = action;

  switch (type) {
    case setSelectedNetwork.type: {
      store.dispatch(resetPerpetualsState());
      abacusStateManager.switchNetwork(payload);
      break;
    }
    default: {
      break;
    }
  }
};
