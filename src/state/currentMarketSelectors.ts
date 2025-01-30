import { type RootState } from './_store';

/**
 * @returns marketId of the market the user is currently viewing (Internal)
 */
export const getCurrentMarketId = (state: RootState) => state.perpetuals.currentMarketId;

/**
 * @returns marketId of the market the user is currently viewing if it is tradeable (Internal)
 */
export const getCurrentMarketIdIfTradeable = (state: RootState) =>
  state.perpetuals.currentMarketIdIfTradeable;
