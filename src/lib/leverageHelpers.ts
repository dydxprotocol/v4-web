import { Dispatch } from '@reduxjs/toolkit';

import { setSelectedMarketLeverage } from '@/state/raw';

import { sleep } from '@/lib/timeUtils';

export async function saveMarketLeverage({
  dispatch,
  marketId,
  leverage,
}: {
  dispatch: Dispatch;
  marketId: string;
  leverage: number;
}) {
  // Simulate network delay
  await sleep(1000);

  dispatch(setSelectedMarketLeverage({ marketId, leverage }));
}
