import { OperationResult, wrapOperationSuccess } from '@/bonsai/lib/operationResult';
import { CompositeClient, Network, SubaccountInfo } from '@dydxprotocol/v4-client-js';
import { Dispatch } from '@reduxjs/toolkit';

import { setSelectedMarketLeverage } from '@/state/raw';

import { sleep } from '@/lib/timeUtils';

import { parseToPrimitives } from './parseToPrimitives';

export async function saveMarketLeverage({
  dispatch,
  marketId,
  leverage,
  subaccountInfo,
}: {
  dispatch: Dispatch;
  marketId: string;
  leverage: number;
  subaccountInfo: SubaccountInfo;
}): Promise<OperationResult<void>> {
  // TODO: This is currently a dummy transaction that just saves to local state.
  // When this becomes a real chain transaction, replace the implementation below
  // with the actual chain transaction logic and return the appropriate OperationResult.

  const client = await CompositeClient.connect(Network.staging());
  // @ts-ignore
  const res = await client.validatorClient.get.getUserLeverage(
    'dydx13yccjfatgyaqxv4aje29la8yfxferzrhsspulf',
    0
  );
  console.log(parseToPrimitives(res));

  // @ts-ignore
  console.log(subaccountInfo);
  const updateRes = await client.validatorClient.post.updateLeverage(
    subaccountInfo,
    subaccountInfo.address,
    [
      {
        clorPairId: marketId,
        customImfPpm: 1000000 / leverage,
      },
    ]
  );
  console.log(updateRes);

  // Simulate network delay
  await sleep(1000);

  dispatch(setSelectedMarketLeverage({ marketId, leverage }));

  return wrapOperationSuccess(undefined);
}
