import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import _ from 'lodash';

import { AbacusOrderStatus, Nullable, SubaccountFill, SubaccountOrder } from '@/constants/abacus';
import { DEFAULT_SOMETHING_WENT_WRONG_ERROR_PARAMS, ErrorParams } from '@/constants/errors';
import {
  CANCEL_ALL_ORDERS_KEY,
  CancelOrderStatuses,
  LocalCancelAllData,
  LocalCancelOrderData,
  LocalCloseAllPositionsData,
  LocalPlaceOrderData,
  PlaceOrderStatuses,
  TradeTypes,
} from '@/constants/trade';

import { isTruthy } from '@/lib/isTruthy';
import { isOrderStatusCanceled } from '@/lib/orders';

export interface LocalOrdersState {
  localPlaceOrders: LocalPlaceOrderData[];
  localCancelOrders: LocalCancelOrderData[];
  localCancelAlls: Record<string, LocalCancelAllData>;
  localCloseAllPositions?: LocalCloseAllPositionsData;
  latestOrder?: Nullable<SubaccountOrder>;
}

const initialState: LocalOrdersState = {
  localPlaceOrders: [],
  localCancelOrders: [],
  localCancelAlls: {},
  localCloseAllPositions: undefined,
  latestOrder: undefined,
};

export const localOrdersSlice = createSlice({
  name: 'LocalOrders',
  initialState,
  reducers: {
    clearLocalOrders: () => {
      return initialState;
    },
    updateOrders: (state, action: PayloadAction<SubaccountOrder[]>) => {
      const { payload: orders } = action;
      let { localCloseAllPositions } = state;
      const canceledOrders = orders.filter((order) => isOrderStatusCanceled(order.status));
      const filledOrderClientIds = orders
        .filter((order) => order.status === AbacusOrderStatus.Filled)
        .map((order) => order.clientId)
        .filter(isTruthy);

      // no relevant cancel or filled orders
      if (!canceledOrders.length && (!localCloseAllPositions || !filledOrderClientIds.length))
        return state;

      const canceledOrderIdsInPayload = canceledOrders.map((order) => order.id);
      // ignore locally canceled orders since it's intentional and already handled
      // by local cancel tracking and notification
      const isOrderCanceledByBackend = (orderId: string) =>
        canceledOrderIdsInPayload.includes(orderId) &&
        !state.localCancelOrders.some((order) => order.orderId === orderId);

      const getNewCanceledOrderIds = (batch: LocalCancelAllData) => {
        const newCanceledOrderIds = _.intersection(batch.orderIds, canceledOrderIdsInPayload);
        return _.uniq([...(batch.canceledOrderIds ?? []), ...newCanceledOrderIds]);
      };

      if (localCloseAllPositions) {
        localCloseAllPositions = {
          ...localCloseAllPositions,
          filledOrderClientIds: _.uniq([
            ..._.intersection(localCloseAllPositions.submittedOrderClientIds, filledOrderClientIds),
            ...localCloseAllPositions.filledOrderClientIds,
          ]),
          failedOrderClientIds: _.uniq([
            ..._.intersection(
              localCloseAllPositions.submittedOrderClientIds,
              canceledOrders.map((order) => order.clientId)?.filter(isTruthy)
            ),
            ...localCloseAllPositions.failedOrderClientIds,
          ]),
        };
      }

      return {
        ...state,
        localPlaceOrders: state.localPlaceOrders.map((order) =>
          order.orderId &&
          canceledOrderIdsInPayload.includes(order.orderId) &&
          isOrderCanceledByBackend(order.orderId)
            ? {
                ...order,
                submissionStatus: PlaceOrderStatuses.Canceled,
              }
            : order
        ),
        localCancelOrders: state.localCancelOrders.map((order) =>
          canceledOrderIdsInPayload.includes(order.orderId)
            ? { ...order, submissionStatus: CancelOrderStatuses.Canceled }
            : order
        ),
        localCancelAlls: _.mapValues(state.localCancelAlls, (batch) => ({
          ...batch,
          canceledOrderIds: getNewCanceledOrderIds(batch),
        })),
        localCloseAllPositions,
      };
    },
    updateFilledOrders: (state, action: PayloadAction<SubaccountFill[]>) => {
      const filledOrderIds = action.payload.map((fill) => fill.orderId).filter(isTruthy);
      if (!filledOrderIds) return state;

      const getFailedToCancelOrderIds = (batch: LocalCancelAllData) => {
        const newFailedCancelOrderIds = _.intersection(batch.orderIds, filledOrderIds);
        return _.uniq([...(batch.failedOrderIds ?? []), ...newFailedCancelOrderIds]);
      };

      return {
        ...state,
        localPlaceOrders: state.localPlaceOrders.map((order) =>
          order.submissionStatus < PlaceOrderStatuses.Filled &&
          order.orderId &&
          filledOrderIds.includes(order.orderId)
            ? {
                ...order,
                submissionStatus: PlaceOrderStatuses.Filled,
              }
            : order
        ),
        localCancelOrders: state.localCancelOrders.filter(
          (order) => !filledOrderIds.includes(order.orderId)
        ),
        localCancelAlls: _.mapValues(state.localCancelAlls, (batch) => ({
          ...batch,
          failedOrderIds: getFailedToCancelOrderIds(batch),
        })),
      };
    },
    setLatestOrder: (state, action: PayloadAction<Nullable<SubaccountOrder>>) => {
      const { clientId, id } = action.payload ?? {};
      state.latestOrder = action.payload;

      if (clientId) {
        state.localPlaceOrders = state.localPlaceOrders.map((order) =>
          order.clientId === clientId && order.submissionStatus < PlaceOrderStatuses.Placed
            ? {
                ...order,
                orderId: id,
                submissionStatus: PlaceOrderStatuses.Placed,
              }
            : order
        );
      }
    },
    placeOrderSubmitted: (
      state,
      action: PayloadAction<{ marketId: string; clientId: string; orderType: TradeTypes }>
    ) => {
      state.localPlaceOrders.push({
        ...action.payload,
        submissionStatus: PlaceOrderStatuses.Submitted,
      });
    },
    placeOrderFailed: (
      state,
      action: PayloadAction<{ clientId: string; errorParams: ErrorParams }>
    ) => {
      state.localPlaceOrders = state.localPlaceOrders.map((order) =>
        order.clientId === action.payload.clientId
          ? {
              ...order,
              errorParams: action.payload.errorParams,
            }
          : order
      );
    },
    placeOrderTimeout: (state, action: PayloadAction<string>) => {
      const uncommitedOrders = state.localPlaceOrders
        .filter(
          (order) => order.submissionStatus === PlaceOrderStatuses.Submitted && !order.errorParams
        )
        .map((order) => order.clientId);
      if (uncommitedOrders.includes(action.payload)) {
        placeOrderFailed({
          clientId: action.payload,
          errorParams: DEFAULT_SOMETHING_WENT_WRONG_ERROR_PARAMS,
        });
      }
    },
    cancelOrderSubmitted: (state, action: PayloadAction<string>) => {
      state.localCancelOrders.push({
        orderId: action.payload,
        submissionStatus: CancelOrderStatuses.Submitted,
      });
    },
    cancelOrderFailed: (
      state,
      action: PayloadAction<{ orderId: string; errorParams: ErrorParams }>
    ) => {
      state.localCancelOrders = state.localCancelOrders.map((order) =>
        order.orderId === action.payload.orderId
          ? {
              ...order,
              errorParams: action.payload.errorParams,
            }
          : order
      );
    },
    cancelAllSubmitted: (
      state,
      action: PayloadAction<{ marketId?: string; orderIds: string[] }>
    ) => {
      const { marketId, orderIds } = action.payload;
      // when marketId is undefined, it means cancel all orders globally
      const cancelAllKey = marketId ?? CANCEL_ALL_ORDERS_KEY;

      state.localCancelAlls[cancelAllKey] = {
        key: cancelAllKey,
        orderIds,
      };

      state.localCancelOrders = [
        ...state.localCancelOrders,
        ...orderIds.map((orderId) => ({
          orderId,
          submissionStatus: CancelOrderStatuses.Submitted,
          isSubmittedThroughCancelAll: true, // track this to skip certain notifications
        })),
      ];
    },
    cancelAllOrderFailed: (
      state,
      action: PayloadAction<{
        order: SubaccountOrder;
        errorParams?: ErrorParams;
      }>
    ) => {
      const { order, errorParams } = action.payload;
      updateCancelAllOrderIds(state, order.id, 'failedOrderIds', order.marketId);
      if (errorParams) cancelOrderFailed({ orderId: order.id, errorParams });
    },
    closeAllPositionsSubmitted: (state, action: PayloadAction<string[]>) => {
      state.localCloseAllPositions = {
        submittedOrderClientIds: action.payload,
        filledOrderClientIds: [],
        failedOrderClientIds: [],
      };
    },
  },
});

export const {
  clearLocalOrders,

  updateOrders,
  updateFilledOrders,

  setLatestOrder,

  placeOrderSubmitted,
  placeOrderFailed,
  placeOrderTimeout,

  cancelOrderSubmitted,
  cancelOrderFailed,

  cancelAllSubmitted,
  cancelAllOrderFailed,

  closeAllPositionsSubmitted,
} = localOrdersSlice.actions;

// helper functions
const updateCancelAllOrderIds = (
  state: LocalOrdersState,
  orderId: string,
  key: 'canceledOrderIds' | 'failedOrderIds',
  cancelAllKey: string
) => {
  const getNewOrderIds = (cancelAll: LocalCancelAllData) => {
    const existingOrderIds = cancelAll[key] ?? [];
    return cancelAll.orderIds.includes(orderId) && !existingOrderIds.includes(orderId)
      ? [...existingOrderIds, orderId]
      : existingOrderIds;
  };

  const updateKey = (currentKey: string) => ({
    ...state.localCancelAlls[currentKey],
    [key]: getNewOrderIds(state.localCancelAlls[currentKey]),
  });

  state.localCancelAlls = {
    ...state.localCancelAlls,
    ...(state.localCancelAlls[CANCEL_ALL_ORDERS_KEY] && {
      [CANCEL_ALL_ORDERS_KEY]: updateKey(CANCEL_ALL_ORDERS_KEY),
    }),
    ...(state.localCancelAlls[cancelAllKey] && {
      [cancelAllKey]: updateKey(cancelAllKey),
    }),
  };
};
