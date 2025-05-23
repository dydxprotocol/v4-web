import { MarginMode } from '@/bonsai/forms/trade/types';
import { OrderFlags, SubaccountOrder } from '@/bonsai/types/summaryTypes';

import { NUM_PARENT_SUBACCOUNTS } from '@/constants/account';
import { USD_DECIMALS } from '@/constants/numbers';
import { PositionSide } from '@/constants/trade';

import { MustBigNumber } from '@/lib/numbers';
import { Nullable } from '@/lib/typeUtils';

export const hasPositionSideChanged = ({
  currentSize,
  postOrderSize,
}: {
  currentSize?: Nullable<number>;
  postOrderSize?: Nullable<number>;
}) => {
  const currentSizeBN = MustBigNumber(currentSize);
  const postOrderSizeBN = MustBigNumber(postOrderSize);

  const currentPositionSide = currentSizeBN.gt(0)
    ? PositionSide.Long
    : currentSizeBN.lt(0)
      ? PositionSide.Short
      : PositionSide.None;

  const newPositionSide = postOrderSizeBN.gt(0)
    ? PositionSide.Long
    : postOrderSizeBN.lt(0)
      ? PositionSide.Short
      : PositionSide.None;

  return {
    currentPositionSide,
    newPositionSide,
    positionSideHasChanged: postOrderSize !== undefined && currentPositionSide !== newPositionSide,
  };
};

export const calculateCrossPositionMargin = ({
  notionalTotal,
  adjustedImf,
}: {
  notionalTotal?: Nullable<number>;
  adjustedImf?: Nullable<number>;
}) => {
  const notionalTotalBN = MustBigNumber(notionalTotal);
  const adjustedImfBN = MustBigNumber(adjustedImf);
  return notionalTotalBN.times(adjustedImfBN).toFixed(USD_DECIMALS);
};

/**
 * @param subaccountNumber
 * @returns marginMode from subaccountNumber, defaulting to cross margin if subaccountNumber is undefined or null.
 * @note v4-web is assuming that subaccountNumber >= 128 is used as childSubaccounts. API Traders may utilize these subaccounts differently.
 */
export const getMarginModeFromSubaccountNumber = (subaccountNumber: Nullable<number>) => {
  if (!subaccountNumber) return MarginMode.CROSS;

  return subaccountNumber >= NUM_PARENT_SUBACCOUNTS ? MarginMode.ISOLATED : MarginMode.CROSS;
};

export const getDoubleValuesHasDiff = (current: Nullable<number>, post: Nullable<number>) => {
  return post != null && current !== post;
};

export const getIsShortTermOrder = (order: SubaccountOrder) => {
  return order.orderFlags?.toString() === OrderFlags.SHORT_TERM.toString();
};
