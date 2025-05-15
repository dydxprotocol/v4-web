import { OrderSide } from '@dydxprotocol/v4-client-js';
import BigNumber from 'bignumber.js';
import { produce } from 'immer';

import {
  IndexerAssetPositionResponseObject,
  IndexerPerpetualPositionResponseObject,
  IndexerPerpetualPositionStatus,
  IndexerPositionSide,
} from '@/types/indexer/indexerApiGen';

import { AttemptNumber, BIG_NUMBERS, MustBigNumber, MustNumber } from '@/lib/numbers';

import { freshChildSubaccount, newUsdcAssetPosition } from '../lib/subaccountUtils';
import {
  ApplyTradeProps,
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

function getSimpleQuoteBalanceAdjustment({
  averagePrice,
  fee,
  side,
  size,
}: {
  side: OrderSide;
  size: number;
  averagePrice: number;
  fee: number;
}): BigNumber {
  return MustBigNumber(size)
    .times(averagePrice)
    .times(side === OrderSide.BUY ? -1 : 1)
    .minus(fee);
}

function createNewPositionFromTrade(
  tradeProps: Omit<ApplyTradeProps, 'fee' | 'reduceOnly'>
): IndexerPerpetualPositionResponseObject {
  const { marketId, side, size, averagePrice, subaccountNumber } = tradeProps;

  const sizeBn = MustBigNumber(size);
  const averagePriceStr = MustBigNumber(averagePrice).toString(10);
  const operationMultiplier = side === OrderSide.BUY ? 1 : -1;
  const signedSizeStr = sizeBn.times(operationMultiplier).toString(10);

  return {
    market: marketId,
    status: IndexerPerpetualPositionStatus.OPEN,
    side: side === OrderSide.BUY ? IndexerPositionSide.LONG : IndexerPositionSide.SHORT,
    size: signedSizeStr,
    maxSize: signedSizeStr,
    entryPrice: averagePriceStr,
    realizedPnl: '0',
    createdAt: new Date().toISOString(),
    createdAtHeight: '0', // wrong, but should be fine for our calculations
    sumOpen: sizeBn.toString(10),
    sumClose: '0',
    netFunding: '0',
    unrealizedPnl: '0',
    closedAt: undefined,
    exitPrice: undefined,
    subaccountNumber,
  };
}

function increasePosition(
  currentPosition: IndexerPerpetualPositionResponseObject,
  tradeProps: ApplyTradeProps
): IndexerPerpetualPositionResponseObject {
  const { side, size, averagePrice, marketOraclePrice } = tradeProps;

  const sizeBn = MustBigNumber(size);
  const averagePriceBn = MustBigNumber(averagePrice);
  const operationMultiplier = side === OrderSide.BUY ? 1 : -1;
  const slippageGainsOrLosses = sizeBn.times(
    averagePriceBn.minus(marketOraclePrice).times(side === OrderSide.BUY ? -1 : 1)
  );
  const newSizeBn = MustBigNumber(currentPosition.size).plus(sizeBn.times(operationMultiplier));

  return {
    ...currentPosition,
    size: newSizeBn.toString(10),
    maxSize: (currentPosition.side === IndexerPositionSide.LONG
      ? BigNumber.max(currentPosition.maxSize, newSizeBn)
      : BigNumber.min(currentPosition.maxSize, newSizeBn)
    ).toString(10),
    entryPrice: sizeBn
      .times(averagePriceBn)
      .plus(MustBigNumber(currentPosition.size).abs().times(currentPosition.entryPrice))
      .div(MustBigNumber(currentPosition.size).abs().plus(sizeBn))
      .toString(10),
    sumOpen: sizeBn.abs().plus(currentPosition.sumOpen).toString(10),
    // technically slippage can incur unrealized gains or losses
    unrealizedPnl: slippageGainsOrLosses.plus(currentPosition.unrealizedPnl).toString(10),
  };
}

// only decreases up to close
function decreasePosition(
  currentPosition: IndexerPerpetualPositionResponseObject,
  tradeProps: ApplyTradeProps
): {
  position: IndexerPerpetualPositionResponseObject;
  remainingSize: string;
  appliedSize: string;
  quoteAdjustment: string;
  isClosed: boolean;
} {
  const { side, size, averagePrice } = tradeProps;

  const actualOperationSize = BigNumber.min(size, MustBigNumber(currentPosition.size).abs());
  const averagePriceBn = MustBigNumber(averagePrice);

  // -1 if long and selling, 1 if short and buying
  const operationMultiplier = side === OrderSide.BUY ? 1 : -1;
  const newSizeBn = MustBigNumber(currentPosition.size).plus(
    actualOperationSize.times(operationMultiplier)
  );
  const signedSizeBn = newSizeBn.times(currentPosition.side === IndexerPositionSide.LONG ? 1 : -1);

  const newPosition = {
    ...currentPosition,
    size: newSizeBn.toString(10),
    realizedPnl: MustBigNumber(currentPosition.realizedPnl)
      .plus(
        actualOperationSize.times(
          averagePriceBn.minus(currentPosition.entryPrice).times(operationMultiplier * -1)
        )
      )
      .toString(10),

    sumClose: actualOperationSize.plus(currentPosition.sumClose).toString(10),
    // decreasing doesn't change entry price
    entryPrice: currentPosition.entryPrice,
    // recalculate from scratch with new size
    unrealizedPnl: signedSizeBn
      .times(tradeProps.marketOraclePrice)
      .minus(signedSizeBn.times(currentPosition.entryPrice))
      .toString(10),
  };

  return {
    position: newPosition,
    isClosed: newSizeBn.eq(0),
    appliedSize: actualOperationSize.toString(10),
    remainingSize: MustBigNumber(size).minus(actualOperationSize).toString(10),
    quoteAdjustment: actualOperationSize
      .times(averagePriceBn)
      .times(operationMultiplier * -1)
      .toString(10),
  };
}

function applyTradeToSubaccount(
  parentSubaccount: ParentSubaccountDataBase,
  tradeProps: ApplyTradeProps
): ParentSubaccountDataBase {
  const { subaccountNumber, marketId, side, reduceOnly } = tradeProps;

  // do perpetual position
  let finalAmountToAddToQuoteBalance = BIG_NUMBERS.ZERO;
  const withPerp = produce(parentSubaccount, (draftParentSubaccount) => {
    if (draftParentSubaccount.childSubaccounts[subaccountNumber] == null) {
      draftParentSubaccount.childSubaccounts[subaccountNumber] = freshChildSubaccount({
        address: draftParentSubaccount.address,
        subaccountNumber,
      });
    }

    const subaccount = draftParentSubaccount.childSubaccounts[subaccountNumber]!;
    if (
      subaccount.openPerpetualPositions[marketId] == null ||
      subaccount.openPerpetualPositions[marketId].status !== IndexerPerpetualPositionStatus.OPEN
    ) {
      // handle brand new position, easy case
      if (!reduceOnly) {
        subaccount.openPerpetualPositions[marketId] = createNewPositionFromTrade(tradeProps);
        finalAmountToAddToQuoteBalance = getSimpleQuoteBalanceAdjustment(tradeProps);
      }
    } else {
      const currentPosition = subaccount.openPerpetualPositions[marketId];
      const positionSide = currentPosition.side;
      const isIncreasingPosition =
        (side === OrderSide.BUY && positionSide === IndexerPositionSide.LONG) ||
        (side === OrderSide.SELL && positionSide === IndexerPositionSide.SHORT);
      if (isIncreasingPosition) {
        if (!reduceOnly) {
          subaccount.openPerpetualPositions[marketId] = increasePosition(
            currentPosition,
            tradeProps
          );
          finalAmountToAddToQuoteBalance = getSimpleQuoteBalanceAdjustment(tradeProps);
        }
      } else {
        // we are decreasing position size
        // first we reduce to (at most) closing the position
        const reductionResult = decreasePosition(currentPosition, tradeProps);
        const quoteAdjustmentForReductionWithoutFees = MustBigNumber(
          reductionResult.quoteAdjustment
        );
        const remainingSize = MustBigNumber(reductionResult.remainingSize);
        if (reductionResult.isClosed) {
          delete subaccount.openPerpetualPositions[marketId];
        } else {
          subaccount.openPerpetualPositions[marketId] = reductionResult.position;
        }
        if (remainingSize.gt(0) && !reduceOnly) {
          subaccount.openPerpetualPositions[marketId] = createNewPositionFromTrade({
            ...tradeProps,
            size: MustNumber(reductionResult.remainingSize),
          });
          // simple adjustment contains fees and adjustment for new position
          // so we just add the quote adjustment from the reduce
          finalAmountToAddToQuoteBalance = getSimpleQuoteBalanceAdjustment(tradeProps);
        } else {
          // just remove fees
          finalAmountToAddToQuoteBalance = quoteAdjustmentForReductionWithoutFees.minus(
            tradeProps.fee
          );
        }
      }
    }
  });

  // do asset position
  return modifyUsdcAssetPosition(withPerp, {
    subaccountNumber,
    size: finalAmountToAddToQuoteBalance.abs().toString(10),
    side: finalAmountToAddToQuoteBalance.gte(0)
      ? IndexerPositionSide.LONG
      : IndexerPositionSide.SHORT,
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
        SubaccountTransferFull: (args) => {
          const sourceAccount =
            currentParentSubaccount.childSubaccounts[args.senderSubaccountNumber];
          if (sourceAccount == null) {
            // eslint-disable-next-line no-console
            console.error(
              "applyOperationsToSubaccount: can't empty subaccount because subaccount does not exist"
            );
            return currentParentSubaccount;
          }
          if (
            Object.values(sourceAccount.openPerpetualPositions).filter(
              (p) => !MustBigNumber(p.size).isZero()
            ).length > 0
          ) {
            // eslint-disable-next-line no-console
            console.error(
              "applyOperationsToSubaccount: can't empty subaccount because there are open perpetual positions"
            );
            return currentParentSubaccount;
          }
          const amount = sourceAccount.assetPositions.USDC?.size;
          if (amount == null || (AttemptNumber(amount) ?? -1) < 0) {
            // eslint-disable-next-line no-console
            console.error(
              "applyOperationsToSubaccount: can't empty subaccount because quote balance is negative or not present"
            );
            return currentParentSubaccount;
          }
          return applyOperationsToSubaccount(currentParentSubaccount, {
            operations: [SubaccountOperations.SubaccountTransfer({ ...args, amount })],
          });
        },
        ApplyTrade: (tradeProps) => applyTradeToSubaccount(currentParentSubaccount, tradeProps),
      }),
    parentSubaccount
  );
}
