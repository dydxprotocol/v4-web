import { FundingDirection } from '@/constants/charts';
import { IndexerHistoricalFundingResponseObject } from '@/types/indexer/indexerApiGen';

import { MustBigNumber } from '@/lib/numbers';

export const getDirectionFromFundingRate = (fundingRate: string) => {
  const fundingRateBN = MustBigNumber(fundingRate);

  return fundingRateBN.isZero()
    ? FundingDirection.None
    : fundingRateBN.isPositive()
      ? FundingDirection.ToShort
      : FundingDirection.ToLong;
};

export type HistoricalFundingObject = {
  fundingRate: number;
  time: number;
  direction: FundingDirection;
};
export const mapFundingChartObject = (
  funding: IndexerHistoricalFundingResponseObject
): HistoricalFundingObject => ({
  fundingRate: MustBigNumber(funding.rate).toNumber(),
  time: new Date(funding.effectiveAt).getTime(),
  direction: getDirectionFromFundingRate(funding.rate),
});
