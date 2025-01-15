import { produce } from 'immer';

import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { MustBigNumber } from '@/lib/numbers';

import { freshChildSubaccount } from '../lib/subaccountUtils';
import {
  ModifyUsdcAssetPositionProps,
  SubaccountBatchedOperations,
  SubaccountOperations,
} from '../types/operationTypes';
import { ChildSubaccountData, ParentSubaccountData } from '../types/rawTypes';

export function createUsdcDepositOperations({
  subaccountNumber,
  depositAmount,
}: {
  subaccountNumber: number;
  depositAmount: string;
}): SubaccountBatchedOperations {
  return {
    operations: [
      SubaccountOperations.ModifyUsdcAssetPosition({
        subaccountNumber,
        changes: {
          size: depositAmount,
        },
      }),
    ],
  };
}

export function createUsdcWithdrawalOperations({
  subaccountNumber,
  withdrawAmount,
}: {
  subaccountNumber: number;
  withdrawAmount: string;
}): SubaccountBatchedOperations {
  return {
    operations: [
      SubaccountOperations.ModifyUsdcAssetPosition({
        subaccountNumber,
        changes: {
          size: MustBigNumber(withdrawAmount).negated().toString(),
        },
      }),
    ],
  };
}

function modifyUsdcAssetPosition(
  parentSubaccountData: ParentSubaccountData,
  payload: ModifyUsdcAssetPositionProps
): ParentSubaccountData {
  const { subaccountNumber, changes } = payload;
  if (!changes.size) return parentSubaccountData;

  return produce(parentSubaccountData, (draftParentSubaccountData) => {
    const sizeBN = MustBigNumber(changes.size);

    let childSubaccount: ChildSubaccountData | undefined =
      draftParentSubaccountData.childSubaccounts[subaccountNumber];

    if (childSubaccount != null) {
      // Modify childSubaccount
      if (childSubaccount.assetPositions.USDC != null) {
        const size = MustBigNumber(childSubaccount.assetPositions.USDC.size)
          .plus(sizeBN)
          .toString();

        childSubaccount.assetPositions.USDC.size = size;
      } else if (sizeBN.gt(0)) {
        // Upsert USDC Asset Position
        childSubaccount.assetPositions.USDC = {
          assetId: '0',
          symbol: 'USDC',
          size: sizeBN.toString(),
          side: IndexerPositionSide.LONG,
          subaccountNumber,
        };
      }
    } else {
      // Upsert ChildSubaccountData into parentSubaccountData.childSubaccounts
      childSubaccount = freshChildSubaccount({
        address: parentSubaccountData.address,
        subaccountNumber,
      });

      childSubaccount.assetPositions.USDC = {
        assetId: '0',
        symbol: 'USDC',
        size: sizeBN.toString(),
        side: IndexerPositionSide.LONG,
        subaccountNumber,
      };
    }

    draftParentSubaccountData.childSubaccounts[subaccountNumber] = childSubaccount;
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
