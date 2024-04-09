import { useMemo } from 'react';

import { ResolutionString } from 'public/tradingview/charting_library';
import { useQueries } from 'react-query';
import { shallowEqual, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useDydxClient, useStringGetter } from '@/hooks';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { Output, OutputType } from '@/components/Output';
import { Tag } from '@/components/Tag';
import { SparklineChart } from '@/components/visx/SparklineChart';

import { getPerpetualMarkets } from '@/state/perpetualsSelectors';

import { log } from '@/lib/telemetry';

type ExchangeBillboardsProps = {
  className?: string;
};

export const ExchangeBillboards: React.FC<ExchangeBillboardsProps> = ({ className }) => {
  const stringGetter = useStringGetter();

  const perpetualMarkets = useSelector(getPerpetualMarkets, shallowEqual) ?? {};
  const { getCandles, compositeClient } = useDydxClient();

  const markets = useMemo(
    () => Object.values(perpetualMarkets).filter(Boolean),
    [perpetualMarkets]
  );

  const results = useQueries(
    markets.map((market) => ({
      enabled: !!compositeClient && markets.length > 0,
      queryKey: ['perpetualMarketCandles', market.id, '1HOUR'],
      queryFn: () => {
        try {
          return getCandles({
            marketId: market.id,
            resolution: '60' as ResolutionString,
            limit: 24,
          });
        } catch (error) {
          log('ExchangeBillboards getCandles', error);
        }
      },
      refetchOnWindowFocus: false,
    }))
  );

  const volume24HUSDCChart = useMemo(() => {
    const data = results.map((result) => result.data);

    if (data && data[0]) {
      const sum: number[] = data[0].map((_, columnIndex) =>
        data.reduce((acc, row) => acc + parseFloat(row?.[columnIndex].usdVolume ?? '0'), 0)
      );

      const candles = sum.map((y, x) => ({ x: x + 1, y }));

      return candles;
    }

    return [];
  }, [results]);

  const openInterestUSDCChart = useMemo(() => {
    const data = results.map((result) => result.data);

    if (data && data[0]) {
      const sum: number[] = data[0].map((_, columnIndex) =>
        data.reduce(
          (acc, row) => acc + parseFloat(row?.[columnIndex].startingOpenInterest ?? '0'),
          0
        )
      );

      const candles = sum.map((y, x) => ({ x: x + 1, y }));

      return candles;
    }

    return [];
  }, [results]);

  const { volume24HUSDC, totalTrades24H, openInterestUSDC } = useMemo(() => {
    let volume24HUSDC = 0;
    let totalTrades24H = 0;
    let openInterestUSDC = 0;

    for (const { oraclePrice, perpetual } of markets) {
      const { volume24H, trades24H, openInterest = 0 } = perpetual || {};
      volume24HUSDC += volume24H ?? 0;
      totalTrades24H += trades24H ?? 0;
      if (oraclePrice) openInterestUSDC += openInterest * oraclePrice;
    }

    return {
      volume24HUSDC,
      totalTrades24H,
      openInterestUSDC,
    };
  }, [markets]);

  return (
    <Styled.MarketBillboardsWrapper className={className}>
      {[
        {
          key: 'volume',
          labelKey: STRING_KEYS.TRADING_VOLUME,
          tagKey: STRING_KEYS._24H,
          value: volume24HUSDC || undefined,
          fractionDigits: 0,
          type: OutputType.CompactFiat,
          chartData: volume24HUSDCChart,
        },
        {
          key: 'open-interest',
          labelKey: STRING_KEYS.OPEN_INTEREST,
          tagKey: STRING_KEYS.CURRENT,
          value: openInterestUSDC || undefined,
          fractionDigits: 0,
          type: OutputType.CompactFiat,
          chartData: openInterestUSDCChart,
        },
        {
          key: 'fee-earned-stakers',
          labelKey: STRING_KEYS.EARNED,
          tagKey: STRING_KEYS._24H,
          value: totalTrades24H || undefined,
          type: OutputType.CompactNumber,
          chartData: [],
        },
      ].map(({ key, labelKey, tagKey, value, fractionDigits, type, chartData }) => (
        <Styled.BillboardContainer key={key}>
          <Styled.BillboardStat>
            <Styled.BillboardTitle>
              <label>{stringGetter({ key: labelKey })}</label>
              <Tag>{stringGetter({ key: tagKey })}</Tag>
            </Styled.BillboardTitle>
            <Styled.Output
              useGrouping
              fractionDigits={fractionDigits}
              type={type}
              value={value}
              withBaseFont
            />
          </Styled.BillboardStat>
          <Styled.BillboardChart>
            <SparklineChart
              data={chartData}
              xAccessor={(datum) => datum.x}
              yAccessor={(datum) => datum.y}
              positive={true}
            />
          </Styled.BillboardChart>
        </Styled.BillboardContainer>
      ))}
    </Styled.MarketBillboardsWrapper>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.MarketBillboardsWrapper = styled.div`
  ${layoutMixins.column}

  gap: 1rem;
`;

Styled.BillboardContainer = styled.div`
  ${layoutMixins.row}
  flex: 1;
  justify-content: space-between;

  background-color: var(--color-layer-3);
  padding: 1.5rem;
  border-radius: 0.625rem;
`;

Styled.BillboardChart = styled.div`
  width: 130px;
  height: 40px;
`;

Styled.BillboardTitle = styled.div`
  ${layoutMixins.row}

  gap: 0.375rem;
`;

Styled.BillboardStat = styled.div`
  ${layoutMixins.column}

  gap: 0.5rem;

  label {
    color: var(--color-text-0);
    font: var(--font-base-medium);
  }

  output {
    color: var(--color-text-1);
    font: var(--font-large-medium);
  }
`;

Styled.Output = styled(Output)`
  font: var(--font-extra-book);
  color: var(--color-text-2);

  @media ${breakpoints.tablet} {
    font: var(--font-base-book);
  }
`;
