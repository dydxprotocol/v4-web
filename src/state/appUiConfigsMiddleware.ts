import type { PayloadAction } from '@reduxjs/toolkit';

import { MarketFilters } from '@/constants/markets';

import { setShouldHideLaunchableMarkets } from '@/state/appUiConfigs';
import { setMarketFilter } from '@/state/perpetuals';

import { getMarketFilter } from './perpetualsSelectors';

export default (store: any) => (next: any) => async (action: PayloadAction<any>) => {
  next(action);

  const { type, payload } = action;

  switch (type) {
    case setShouldHideLaunchableMarkets.type: {
      if (payload) {
        const isViewingLaunchable = getMarketFilter(store.getState()) === MarketFilters.LAUNCHABLE;

        if (isViewingLaunchable) {
          store.dispatch(setMarketFilter(MarketFilters.ALL));
        }
      }
      break;
    }
    default: {
      break;
    }
  }
};
