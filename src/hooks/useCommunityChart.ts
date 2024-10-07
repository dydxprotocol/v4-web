import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { IDateStats } from '@/constants/affiliates';
import { AffiliatesProgramMetric, AffiliatesProgramPeriod } from '@/constants/charts';

import { log } from '@/lib/telemetry';

export const useCommunityChart = (selectedChartMetric: AffiliatesProgramMetric) => {
  const [selectedPeriod, setSelectedPeriod] = useState<AffiliatesProgramPeriod>(
    AffiliatesProgramPeriod.PeriodAllTime
  );

  const getStartDate = (): string => {
    const currentTime = new Date();

    switch (selectedPeriod) {
      case AffiliatesProgramPeriod.Period1d:
        return new Date(currentTime.setDate(currentTime.getDate() - 1)).toISOString();
      case AffiliatesProgramPeriod.Period7d:
        return new Date(currentTime.setDate(currentTime.getDate() - 7)).toISOString();
      case AffiliatesProgramPeriod.Period30d:
        return new Date(currentTime.setMonth(currentTime.getMonth() - 1)).toISOString();
      case AffiliatesProgramPeriod.Period90d:
        return new Date(currentTime.setMonth(currentTime.getMonth() - 3)).toISOString();
      case AffiliatesProgramPeriod.PeriodAllTime:
        return new Date(0).toISOString(); // The earliest possible date
      default:
        throw new Error('Invalid rolling window value');
    }
  };

  const fetchCommunityChartMetrics = async () => {
    process.env.VITE_AFFILIATES_SERVER_BASE_URL = 'http://localhost:3000';
    const endpoint = `${process.env.VITE_AFFILIATES_SERVER_BASE_URL}/v1/community/chart-metrics?start_date=${getStartDate()}&end_date=${new Date().toISOString()}`;

    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      });

      const data: IDateStats[] = await response.json();

      const result = data
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((m) => ({
          date: new Date(m.date).getTime(),
          cumulativeAmount: Number(m[selectedChartMetric]),
        }));

      return result;
    } catch (error) {
      log('useAffiliatesCommunityChart', error, { endpoint });
      throw error;
    }
  };

  const communityChartMetricsQuery = useQuery({
    queryKey: ['communityChart'],
    queryFn: fetchCommunityChartMetrics,
  });

  return { communityChartMetricsQuery, selectedPeriod, setSelectedPeriod };
};
