import { produce } from 'immer';

import {
  IndexerAssetPositionResponseObject,
  IndexerPositionSide,
} from '@/types/indexer/indexerApiGen';

import { MustBigNumber } from '@/lib/numbers';

import { freshChildSubaccount, newUsdcAssetPosition } from '../lib/subaccountUtils';
import {
  ModifyUsdcAssetPositionProps,
  SubaccountBatchedOperations,
  SubaccountOperations,
} from '../types/operationTypes';
import { ParentSubaccountData } from '../types/rawTypes';

function addUsdcAssetPosition(
  parentSubaccount: ParentSubaccountData,
  payload: Pick<IndexerAssetPositionResponseObject, 'side' | 'size' | 'subaccountNumber'>
): ParentSubaccountData {
  const { side, size, subaccountNumber } = payload;
  return produce(parentSubaccount, (draftParentSubaccountData) => {
    let childSubaccount = draftParentSubaccountData.childSubaccounts[subaccountNumber];

    if (childSubaccount == null) {
      // Upsert ChildSubaccountData into parentSubaccountData.childSubaccounts
      const updatedChildSubaccount = freshChildSubaccount({
        address: draftParentSubaccountData.address,
        subaccountNumber,
      });

      childSubaccount = {
        ...updatedChildSubaccount,
        assetPositions: {
          ...updatedChildSubaccount.assetPositions,
          USDC: newUsdcAssetPosition({
            side,
            size,
            subaccountNumber,
          }),
        },
      };
    } else {
      if (childSubaccount.assetPositions.USDC == null) {
        // Upsert USDC Asset Position
        childSubaccount.assetPositions.USDC = newUsdcAssetPosition({
          side,
          size,
          subaccountNumber,
        });
      } else {
        if (childSubaccount.assetPositions.USDC.side !== side) {
          const signedSizeBN = MustBigNumber(childSubaccount.assetPositions.USDC.size).minus(size);

          if (signedSizeBN.lte(0)) {
            // New size flips the Asset Position Side
            childSubaccount.assetPositions.USDC.side =
              childSubaccount.assetPositions.USDC.side === IndexerPositionSide.LONG
                ? IndexerPositionSide.SHORT
                : IndexerPositionSide.LONG;
            childSubaccount.assetPositions.USDC.size = signedSizeBN.abs().toString();
          } else {
            // Set the new size of the Asset Position
            childSubaccount.assetPositions.USDC.size = signedSizeBN.toString();
          }
        } else {
          // Side is maintained, add the size to the existing position
          childSubaccount.assetPositions.USDC.size = MustBigNumber(
            childSubaccount.assetPositions.USDC.size
          )
            .plus(size)
            .toString();
        }
      }
    }
  });
}

export type UsdcDepositArgs = {
  subaccountNumber: number;
  depositAmount?: string;
};

export function createUsdcDepositOperations(
  parentSubaccount: ParentSubaccountData,
  { subaccountNumber, depositAmount }: UsdcDepositArgs
): SubaccountBatchedOperations {
  const updatedParentSubaccountData = addUsdcAssetPosition(parentSubaccount, {
    side: IndexerPositionSide.LONG,
    size: depositAmount ?? '0',
    subaccountNumber,
  });

  if (updatedParentSubaccountData.childSubaccounts[subaccountNumber]?.assetPositions.USDC == null) {
    throw new Error('USDC Asset Position was improperly modified');
  }

  return {
    operations: [
      SubaccountOperations.ModifyUsdcAssetPosition({
        subaccountNumber,
        changes: updatedParentSubaccountData.childSubaccounts[subaccountNumber].assetPositions.USDC,
      }),
    ],
  };
}

export type UsdcWithdrawArgs = {
  subaccountNumber: number;
  withdrawAmount: string;
};
export function createUsdcWithdrawalOperations(
  parentSubaccount: ParentSubaccountData,
  { subaccountNumber, withdrawAmount }: UsdcWithdrawArgs
): SubaccountBatchedOperations {
  const updatedParentSubaccountData = addUsdcAssetPosition(parentSubaccount, {
    side: IndexerPositionSide.SHORT,
    size: withdrawAmount,
    subaccountNumber,
  });

  if (updatedParentSubaccountData.childSubaccounts[subaccountNumber]?.assetPositions.USDC == null) {
    throw new Error('USDC Asset Position was improperly modified');
  }

  return {
    operations: [
      SubaccountOperations.ModifyUsdcAssetPosition({
        subaccountNumber,
        changes: updatedParentSubaccountData.childSubaccounts[subaccountNumber].assetPositions.USDC,
      }),
    ],
  };
}

function modifyUsdcAssetPosition(
  parentSubaccountData: ParentSubaccountData,
  payload: ModifyUsdcAssetPositionProps
): ParentSubaccountData {
  const { subaccountNumber, changes } = payload;

  return produce(parentSubaccountData, (draftParentSubaccountData) => {
    if (draftParentSubaccountData.childSubaccounts[subaccountNumber]?.assetPositions.USDC != null) {
      draftParentSubaccountData.childSubaccounts[subaccountNumber].assetPositions.USDC = changes;
    }
  });
}

export function applyOperationsToSubaccount(
  parentSubaccount: ParentSubaccountData,
  batchedOperations: SubaccountBatchedOperations
): ParentSubaccountData {
  let parentSubaccountData: ParentSubaccountData = parentSubaccount;

  batchedOperations.operations.forEach((op) => {
    SubaccountOperations.match(op, {
      AddPerpetualPosition: () => {
        // TODO: Implement addPerpetualPosition
      },
      ModifyPerpetualPosition: () => {
        // TODO: Implement modifyPerpetualPosition
      },
      ModifyUsdcAssetPosition: (args) => {
        parentSubaccountData = modifyUsdcAssetPosition(parentSubaccountData, args);
      },
    });
  });

  return parentSubaccountData;
}
