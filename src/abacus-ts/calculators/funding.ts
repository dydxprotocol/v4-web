import { FundingDirection } from '@/constants/markets';
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

export const mapFundingChartObject = (funding: IndexerHistoricalFundingResponseObject) => ({
  fundingRate: MustBigNumber(funding.rate).toNumber(),
  time: new Date(funding.effectiveAt).getTime(),
  direction: getDirectionFromFundingRate(funding.rate),
});
