import { produce } from 'immer';

import {
  IndexerAssetPositionResponseObject,
  IndexerPositionSide,
} from '@/types/indexer/indexerApiGen';

import { MustBigNumber } from '@/lib/numbers';

import { freshChildSubaccount, newUsdcAssetPosition } from '../lib/subaccountUtils';
import {
  SubaccountBatchedOperations,
  SubaccountOperation,
  SubaccountOperations,
} from '../types/operationTypes';
import { ParentSubaccountDataBase } from '../types/rawTypes';

function modifyUsdcAssetPosition(
  parentSubaccount: ParentSubaccountDataBase,
  payload: Pick<IndexerAssetPositionResponseObject, 'side' | 'size' | 'subaccountNumber'>
): ParentSubaccountDataBase {
  const { side, size, subaccountNumber } = payload;
  return produce(parentSubaccount, (draftParentSubaccountData) => {
    // if no subaccount, add empty subaccount
    if (draftParentSubaccountData.childSubaccounts[subaccountNumber] == null) {
      draftParentSubaccountData.childSubaccounts[subaccountNumber] = freshChildSubaccount({
        address: draftParentSubaccountData.address,
        subaccountNumber,
      });
    }

    const childSubaccount = draftParentSubaccountData.childSubaccounts[subaccountNumber]!;

    // if no USDC, add a zero USDC position
    if (childSubaccount.assetPositions.USDC == null) {
      childSubaccount.assetPositions.USDC = newUsdcAssetPosition({
        side: IndexerPositionSide.LONG,
        size: '0',
        subaccountNumber,
      });
    }

    if (childSubaccount.assetPositions.USDC.side !== side) {
      const signedSizeBN = MustBigNumber(childSubaccount.assetPositions.USDC.size).minus(size);

      if (signedSizeBN.lt(0)) {
        // New size flips the Asset Position Side
        childSubaccount.assetPositions.USDC.side =
          childSubaccount.assetPositions.USDC.side === IndexerPositionSide.LONG
            ? IndexerPositionSide.SHORT
            : IndexerPositionSide.LONG;
      }
      childSubaccount.assetPositions.USDC.size = signedSizeBN.abs().toString();
    } else {
      // Side is maintained, add the size to the existing position
      childSubaccount.assetPositions.USDC.size = MustBigNumber(
        childSubaccount.assetPositions.USDC.size
      )
        .plus(size)
        .toString();
    }
  });
}

export function createBatchedOperations(
  ...args: SubaccountOperation[]
): SubaccountBatchedOperations {
  return {
    operations: args,
  };
}

export function applyOperationsToSubaccount(
  parentSubaccount: ParentSubaccountDataBase,
  batchedOperations: SubaccountBatchedOperations
): ParentSubaccountDataBase {
  return batchedOperations.operations.reduce(
    (currentParentSubaccount, op) =>
      SubaccountOperations.match(op, {
        DepositUsdc: ({ amount, subaccountNumber }) =>
          modifyUsdcAssetPosition(currentParentSubaccount, {
            side: IndexerPositionSide.LONG,
            size: amount,
            subaccountNumber,
          }),
        WithdrawUsdc: ({ amount, subaccountNumber }) =>
          modifyUsdcAssetPosition(currentParentSubaccount, {
            side: IndexerPositionSide.SHORT,
            size: amount,
            subaccountNumber,
          }),
        SubaccountTransfer: ({ amount, recipientSubaccountNumber, senderSubaccountNumber }) =>
          // break into lower level operations and calculate with recursion
          applyOperationsToSubaccount(currentParentSubaccount, {
            operations: [
              SubaccountOperations.WithdrawUsdc({
                amount,
                subaccountNumber: senderSubaccountNumber,
              }),
              SubaccountOperations.DepositUsdc({
                amount,
                subaccountNumber: recipientSubaccountNumber,
              }),
            ],
          }),
      }),
    parentSubaccount
  );
}
