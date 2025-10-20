import { OperationResult, wrapOperationSuccess } from '@/bonsai/lib/operationResult';
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
}): Promise<OperationResult<void>> {
  // TODO: This is currently a dummy transaction that just saves to local state.
  // When this becomes a real chain transaction, replace the implementation below
  // with the actual chain transaction logic and return the appropriate OperationResult.

  // Simulate network delay
  await sleep(1000);

  dispatch(setSelectedMarketLeverage({ marketId, leverage }));

  return wrapOperationSuccess(undefined);
}
