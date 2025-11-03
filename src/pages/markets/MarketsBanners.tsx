import { RefObject } from 'react';

export const MarketsBanners = ({
  marketsTableRef: _marketsTableRef,
}: {
  marketsTableRef?: RefObject<HTMLElement>;
}) => {
  // NOTE: Banners disabled for demo
  return null;
};

/*
 * Previous banner implementation commented out - can be restored if needed
 * This included PML (Instant Market Listings) and PUMP market banners
 */
