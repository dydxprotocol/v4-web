import { PlaceOrderStatuses } from '@/constants/trade';

import { type RootState } from './_store';
import { createAppSelector } from './appTypes';

/**
 * @param state
 * @returns latestOrder of the currently connected subaccount throughout this session
 */
export const getLatestOrder = (state: RootState) => state.localOrders?.latestOrder;

/**
 * @returns the clientId of the latest order
 */
export const getLatestOrderClientId = createAppSelector(
  [getLatestOrder],
  (order) => order?.clientId
);

/**
 * @returns a list of locally placed orders for the current FE session
 */
export const getLocalPlaceOrders = (state: RootState) => state.localOrders.localPlaceOrders;

/**
 * @returns a list of locally canceled orders for the current FE session
 */
export const getLocalCancelOrders = (state: RootState) => state.localOrders.localCancelOrders;

/**
 * @returns a list of locally batch canceled orders for the current FE session
 */
export const getLocalCancelAlls = (state: RootState) => state.localOrders.localCancelAlls;

/**
 * @returns whether the subaccount has uncommitted orders (local orders that are only submitted and not placed)
 */
export const getHasUncommittedOrders = createAppSelector([getLocalPlaceOrders], (placeOrders) =>
  placeOrders.some(
    (order) => order.submissionStatus === PlaceOrderStatuses.Submitted && !order.errorParams
  )
);
