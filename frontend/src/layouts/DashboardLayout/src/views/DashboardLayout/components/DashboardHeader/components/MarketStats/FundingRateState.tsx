import { type FC, useEffect, useMemo, useState } from 'react';
import type { FundingInfo } from 'fuel-ts-sdk';
import { type RequestStatus } from 'fuel-ts-sdk';
import { useSdk, useSdkQuery } from '@/lib/fuel-ts-sdk';
import { MarketStat } from './_MarketStatsBase';

const FUNDING_RATE_FACTOR = 23n;
const FUNDING_RATE_FACTOR_BASE = 1_000_000_000n;
const SECONDS_PER_HOUR = 3600n;

export const FundingRateStat: FC = () => {
  const sdk = useSdk();
  const watchedAsset = useSdkQuery(sdk.trading.getWatchedAsset);
  const [fetchStatus, setFetchStatus] = useState<RequestStatus>('uninitialized');
  const [fundingInfo, setFundingInfo] = useState<FundingInfo>();

  useEffect(() => {
    if (!watchedAsset) return;
    if (
      (fetchStatus === 'fulfilled' && fundingInfo?.assetId !== watchedAsset.assetId) ||
      fetchStatus === 'uninitialized'
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFetchStatus('pending');
      sdk.__extra
        .getFundingInfo(watchedAsset?.assetId)
        .then((info) => {
          setFundingInfo(info);
          setFetchStatus('fulfilled');
        })
        .catch(() => {
          setFetchStatus('rejected');
        });
    }
  }, [fetchStatus, fundingInfo?.assetId, sdk.__extra, watchedAsset]);

  const { formattedRate, variant } = useMemo(() => {
    if (!fundingInfo || fetchStatus !== 'fulfilled') {
      return { formattedRate: '--%', variant: 'default' as const };
    }

    const { rate, direction } = calculateHourlyFundingRate(fundingInfo);

    if (direction === 'neutral') {
      return { formattedRate: '0.0000%', variant: 'default' as const };
    }

    const sign = direction === 'positive' ? '+' : '-';
    const formattedRate = `${sign}${rate.toFixed(4)}%`;
    const variant = direction === 'positive' ? 'positive' : 'negative';

    return { formattedRate, variant } as const;
  }, [fundingInfo, fetchStatus]);

  return <MarketStat label="1H Funding" value={formattedRate} variant={variant} />;
};

function calculateHourlyFundingRate(fundingInfo: FundingInfo): {
  rate: number;
  direction: 'positive' | 'negative' | 'neutral';
} {
  const totalLongs = BigInt(fundingInfo.totalLongSizes);
  const totalShorts = BigInt(fundingInfo.totalShortSizes);

  if (totalLongs === 0n && totalShorts === 0n) {
    return { rate: 0, direction: 'neutral' };
  }

  const rateNumerator = FUNDING_RATE_FACTOR * SECONDS_PER_HOUR * 100n * 100000n;
  const baseRatePercent = Number(rateNumerator / FUNDING_RATE_FACTOR_BASE) / 100000;

  if (totalLongs > totalShorts) {
    return { rate: baseRatePercent, direction: 'negative' };
  } else if (totalShorts > totalLongs) {
    return { rate: baseRatePercent, direction: 'positive' };
  }

  return { rate: 0, direction: 'neutral' };
}
