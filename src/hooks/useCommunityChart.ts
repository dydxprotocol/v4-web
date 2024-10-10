// };
import { useEffect, useState } from 'react';

import { IDateStats } from '@/constants/affiliates';
import { AffiliatesProgramMetric, AffiliatesProgramPeriod } from '@/constants/charts';

import { log } from '@/lib/telemetry';

export const useCommunityChart = (selectedChartMetric: AffiliatesProgramMetric) => {
  // State to keep track of selected period
  const [selectedPeriod, setSelectedPeriod] = useState<AffiliatesProgramPeriod>(
    AffiliatesProgramPeriod.PeriodAllTime
  );

  // State to store the metric data for the currently selected period
  const [metricData, setMetricData] = useState<{ date: number; cumulativeAmount: number }[]>([]);

  useEffect(() => {
    fetchMetricData();
  }, [selectedChartMetric, selectedPeriod]);

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

  // TODO: Leverage react-query with a refactor of the chart. Implementation is the same as trading rewards chart
  const fetchMetricData = async () => {
    // process.env.VITE_AFFILIATES_SERVER_BASE_URL = 'http://localhost:3000'; // Local

    const endpoint = `${process.env.VITE_AFFILIATES_SERVER_BASE_URL}/v1/community/chart-metrics?start_date=${getStartDate()}&end_date=${new Date().toISOString()}`;
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const periodData: IDateStats[] = await response.json();

      setMetricData(
        periodData
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map((m) => ({
            date: new Date(m.date).getTime(),
            cumulativeAmount: Number(m[selectedChartMetric]),
          }))
      );
    } catch (e) {
      log('useCommunityChart/fetchMetricData', e, { endpoint });
    }
  };

  return { metricData, selectedPeriod, setSelectedPeriod };
};
