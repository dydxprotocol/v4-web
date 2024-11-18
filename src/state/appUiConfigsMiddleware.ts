import type { PayloadAction } from '@reduxjs/toolkit';

import { MarketFilters } from '@/constants/markets';

import { setShouldHideLaunchableMarkets } from '@/state/appUiConfigs';
import { setMarketFilter } from '@/state/perpetuals';

export default (store: any) => (next: any) => async (action: PayloadAction<any>) => {
  next(action);

  const { type, payload } = action;

  switch (type) {
    case setShouldHideLaunchableMarkets.type: {
      if (payload) {
        store.dispatch(setMarketFilter(MarketFilters.ALL));
      }
      break;
    }
    default: {
      break;
    }
  }
};
