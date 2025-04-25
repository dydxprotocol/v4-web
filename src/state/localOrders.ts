import { getSimpleOrderStatus } from '@/bonsai/lib/subaccountUtils';
import { OrderStatus, SubaccountOrder } from '@/bonsai/types/summaryTypes';
import { OrderType } from '@dydxprotocol/v4-client-js';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { keyBy } from 'lodash';

import { DEFAULT_SOMETHING_WENT_WRONG_ERROR_PARAMS, ErrorParams } from '@/constants/errors';
import {
  CANCEL_ALL_ORDERS_KEY,
  CancelOrderStatuses,
  LocalCancelAllData,
  LocalCancelOrderData,
  LocalCloseAllPositionsData,
  LocalPlaceOrderData,
  PlaceOrderStatuses,
} from '@/constants/trade';

import { autoBatchAllReducers } from './autoBatchHelpers';

export interface LocalOrdersState {
  // key is client id since it is generated each submission
  localPlaceOrders: Record<string, LocalPlaceOrderData>;
  // key is uuid the submitter decides
  localCancelOrders: Record<string, LocalCancelOrderData>;
  // key is operationId - uuid
  localCancelAlls: Record<string, LocalCancelAllData>;
  // key is a uuid the submitter decides
  localCloseAllPositions: Record<string, LocalCloseAllPositionsData>;
}

export type PlaceOrderSubmissionPayload = {
  marketId: string;
  clientId: string;
  subaccountNumber: number;
  orderType: OrderType;
};

const initialState: LocalOrdersState = {
  localPlaceOrders: {},
  localCancelOrders: {},
  localCancelAlls: {},
  localCloseAllPositions: {},
};

export const localOrdersSlice = createSlice({
  name: 'LocalOrders',
  initialState,
  reducers: {
    clearLocalOrders: () => {
      return initialState;
    },
    ...autoBatchAllReducers<LocalOrdersState>()({
      updateOrders: (state, action: PayloadAction<SubaccountOrder[]>) => {
        const { payload: orders } = action;
        const waitingForCancelConfirmations = Object.values(state.localCancelOrders).filter(
          (o) => o.submissionStatus === CancelOrderStatuses.Submitted
        );
        const waitingForPlaceOrFillOrCancelConfirmations = Object.values(
          state.localPlaceOrders
        ).filter((p) => p.submissionStatus < PlaceOrderStatuses.Filled);

        if (
          waitingForCancelConfirmations.length === 0 &&
          waitingForPlaceOrFillOrCancelConfirmations.length === 0
        ) {
          return;
        }

        const canceledOrders = orders.filter(
          (order) =>
            order.status != null && getSimpleOrderStatus(order.status) === OrderStatus.Canceled
        );

        if (waitingForCancelConfirmations.length > 0) {
          const canceledOrderIds = new Set(canceledOrders.map((order) => order.id));
          waitingForCancelConfirmations.forEach((c) => {
            if (canceledOrderIds.has(c.orderId)) {
              c.submissionStatus = CancelOrderStatuses.Canceled;
            }
          });
        }

        if (waitingForPlaceOrFillOrCancelConfirmations.length > 0) {
          const ordersByClientId = keyBy(
            orders.filter((o) => o.clientId != null),
            (o) => o.clientId!
          );

          waitingForPlaceOrFillOrCancelConfirmations.forEach((p) => {
            if (ordersByClientId[p.clientId] != null) {
              const order = ordersByClientId[p.clientId]!;
              if (
                order.status != null &&
                getSimpleOrderStatus(order.status) === OrderStatus.Canceled
              ) {
                p.submissionStatus = PlaceOrderStatuses.Canceled;
              } else if (order.status === OrderStatus.Filled) {
                p.submissionStatus = PlaceOrderStatuses.Filled;
              } else if (
                order.status != null &&
                getSimpleOrderStatus(order.status) === OrderStatus.Open
              ) {
                p.submissionStatus = PlaceOrderStatuses.Placed;
              }
              p.orderId = order.id;
              p.cachedData = {
                ...p.cachedData,
                status: order.status,
              };
            }
          });
        }
      },
    }),
    placeOrderSubmitted: (state, action: PayloadAction<PlaceOrderSubmissionPayload>) => {
      const { clientId, marketId, orderType, subaccountNumber } = action.payload;
      state.localPlaceOrders[clientId] = {
        clientId,
        submissionStatus: PlaceOrderStatuses.Submitted,
        cachedData: {
          marketId,
          orderType,
          subaccountNumber,
        },
      };
    },
    placeOrderFailed: (
      state,
      action: PayloadAction<{ clientId: string; errorParams: ErrorParams }>
    ) => {
      const { clientId, errorParams } = action.payload;
      if (state.localPlaceOrders[clientId] == null) {
        return;
      }
      state.localPlaceOrders[clientId] = {
        ...state.localPlaceOrders[clientId],
        submissionStatus: PlaceOrderStatuses.FailedSubmission,
        errorParams,
      };
    },
    placeOrderTimeout: (state, action: PayloadAction<string>) => {
      const clientId = action.payload;
      if (
        state.localPlaceOrders[clientId] == null ||
        // only if status is still unknown
        state.localPlaceOrders[clientId].submissionStatus !== PlaceOrderStatuses.Submitted
      ) {
        return;
      }
      state.localPlaceOrders[clientId] = {
        ...state.localPlaceOrders[clientId],
        submissionStatus: PlaceOrderStatuses.FailedSubmission,
        errorParams: DEFAULT_SOMETHING_WENT_WRONG_ERROR_PARAMS,
      };
    },
    cancelOrderSubmitted: (
      state,
      action: PayloadAction<{ uuid: string; orderId: string; order: SubaccountOrder }>
    ) => {
      const { order, orderId, uuid } = action.payload;
      state.localCancelOrders[uuid] = {
        orderId,
        submissionStatus: CancelOrderStatuses.Submitted,
        operationUuid: uuid,
        cachedData: {
          marketId: order.marketId,
          orderType: order.type,
          displayableId: order.displayId,
        },
      };
    },
    cancelOrderFailed: (
      state,
      action: PayloadAction<{ uuid: string; errorParams: ErrorParams }>
    ) => {
      const { errorParams, uuid } = action.payload;
      if (state.localCancelOrders[uuid] == null) {
        return;
      }
      state.localCancelOrders[uuid] = {
        ...state.localCancelOrders[uuid],
        submissionStatus: CancelOrderStatuses.Failed,
        errorParams,
      };
    },
    cancelAllSubmitted: (
      state,
      action: PayloadAction<{
        marketId?: string;
        cancels: Array<{ uuid: string; orderId: string; order: SubaccountOrder }>;
      }>
    ) => {
      const { marketId, cancels } = action.payload;
      // when marketId is undefined, it means cancel all orders globally
      const cancelAllKey = marketId ?? CANCEL_ALL_ORDERS_KEY;
      const uuid = crypto.randomUUID();

      state.localCancelAlls[uuid] = {
        cancelOrderOperationUuids: cancels.map((c) => c.uuid),
        filterKey: cancelAllKey,
        operationUuid: uuid,
      };

      cancels.forEach((cancel) => {
        state.localCancelOrders[cancel.uuid] = {
          operationUuid: cancel.uuid,
          orderId: cancel.orderId,
          isSubmittedThroughCancelAll: true,
          submissionStatus: CancelOrderStatuses.Submitted,
          cachedData: {
            marketId: cancel.order.marketId,
            orderType: cancel.order.type,
            displayableId: cancel.order.displayId,
          },
        };
      });
    },
    closeAllPositionsSubmitted: (state, action: PayloadAction<PlaceOrderSubmissionPayload[]>) => {
      const uuid = crypto.randomUUID();
      const places = action.payload;
      state.localCloseAllPositions[uuid] = {
        clientIds: places.map((p) => p.clientId),
        operationUuid: uuid,
      };
      places.forEach((place) => {
        const { clientId, marketId, orderType, subaccountNumber } = place;
        state.localPlaceOrders[clientId] = {
          clientId,
          submissionStatus: PlaceOrderStatuses.Submitted,
          submittedThroughCloseAll: true,
          cachedData: {
            marketId,
            orderType,
            subaccountNumber,
          },
        };
      });
    },
  },
});

export const {
  clearLocalOrders,

  updateOrders,

  placeOrderSubmitted,
  placeOrderFailed,
  placeOrderTimeout,

  cancelOrderSubmitted,
  cancelOrderFailed,

  cancelAllSubmitted,

  closeAllPositionsSubmitted,
} = localOrdersSlice.actions;
