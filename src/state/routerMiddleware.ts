import type { PayloadAction } from '@reduxjs/toolkit';

import { LocalStorageKey } from '@/constants/localStorage';

import { closeDialogInTradeBox } from '@/state/dialogs';
import { setTradeLocation } from '@/state/navigation';

import abacusStateManager from '@/lib/abacus';
import { setLocalStorage } from '@/lib/localStorage';
import { getMarketIdFromLocation } from '@/lib/tradeData';

export default (store: any) => (next: any) => async (action: PayloadAction<any>) => {
  next(action);

  const { type, payload } = action;

  switch (type) {
    case setTradeLocation.type: {
      const marketId = getMarketIdFromLocation(payload);

      if (marketId) {
        abacusStateManager.setMarket(marketId);
        store.dispatch(closeDialogInTradeBox());
        setLocalStorage({ key: LocalStorageKey.LastViewedMarket, value: marketId });
      }

      break;
    }
    default: {
      break;
    }
  }
};
