import { produce } from 'immer';

import {
  IndexerAssetPositionResponseObject,
  IndexerPositionSide,
} from '@/types/indexer/indexerApiGen';

import { MustBigNumber } from '@/lib/numbers';

import { SubaccountBatchedOperations, SubaccountOperations } from '../types/operationTypes';
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
  payload: {
    subaccountNumber: number;
    changes: Partial<Pick<IndexerAssetPositionResponseObject, 'size'>>;
  }
): ParentSubaccountData {
  const { subaccountNumber, changes } = payload;
  if (!changes.size) return parentSubaccountData;
  const sizeBN = MustBigNumber(changes.size);

  let childSubaccount: ChildSubaccountData | undefined =
    parentSubaccountData.childSubaccounts[subaccountNumber];

  if (childSubaccount != null) {
    // Modify childSubaccount
    if (childSubaccount.assetPositions.USDC != null) {
      const size = MustBigNumber(childSubaccount.assetPositions.USDC.size).plus(sizeBN).toString();

      const updatedChildSubaccount = produce(childSubaccount, (draftChildSubaccount) => {
        if (draftChildSubaccount.assetPositions.USDC) {
          draftChildSubaccount.assetPositions.USDC.size = size;
        }
      });

      childSubaccount = updatedChildSubaccount;
    } else {
      if (sizeBN.gt(0)) {
        const updatedChildSubaccount = produce(childSubaccount, (draftChildSubaccount) => {
          draftChildSubaccount.assetPositions.USDC = {
            assetId: '0',
            symbol: 'USDC',
            size: sizeBN.toString(),
            side: IndexerPositionSide.LONG,
            subaccountNumber,
          };
        });

        childSubaccount = updatedChildSubaccount;
      }
    }
  } else {
    // Upsert ChildSubaccountData into parentSubaccountData.childSubaccounts
    childSubaccount = {
      address: parentSubaccountData.address,
      subaccountNumber,
      openPerpetualPositions: {},
      assetPositions: {
        USDC: {
          assetId: '0',
          symbol: 'USDC',
          size: sizeBN.toString(),
          side: IndexerPositionSide.LONG,
          subaccountNumber,
        },
      },
    } satisfies ChildSubaccountData;
  }

  return produce(parentSubaccountData, (draftParentSubaccountData) => {
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
