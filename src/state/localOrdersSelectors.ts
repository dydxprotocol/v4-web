import { PlaceOrderStatuses } from '@/constants/trade';

import { type RootState } from './_store';
import { createAppSelector } from './appTypes';

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
 * @returns the local close all positions data for the current FE session
 */
export const getLocalCloseAllPositions = (state: RootState) =>
  state.localOrders.localCloseAllPositions;

/**
 * @returns whether the subaccount has uncommitted orders (local orders that are only submitted and not placed)
 */
export const getHasUncommittedOrders = createAppSelector([getLocalPlaceOrders], (placeOrders) =>
  Object.values(placeOrders).some(
    (order) => order.submissionStatus === PlaceOrderStatuses.Submitted
  )
);
