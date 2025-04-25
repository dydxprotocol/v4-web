import type { PayloadAction } from '@reduxjs/toolkit';

import { setSelectedNetwork } from '@/state/app';
import { resetPerpetualsState } from '@/state/perpetuals';

export default (store: any) => (next: any) => async (action: PayloadAction<any>) => {
  next(action);

  const { type } = action;

  switch (type) {
    case setSelectedNetwork.type: {
      store.dispatch(resetPerpetualsState());
      break;
    }
    default: {
      break;
    }
  }
};
