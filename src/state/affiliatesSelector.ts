import { RootState } from './_store';

/**
 * @returns saved latestReferrer for Affiliates
 */
export const getLatestReferrer = (state: RootState) => state.affiliates.latestReferrer;
