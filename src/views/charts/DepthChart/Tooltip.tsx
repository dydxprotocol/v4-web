import { OrderSide } from '@dydxprotocol/v4-client-js';
import type { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';
import { shallowEqual, useSelector } from 'react-redux';

import type { Nullable } from '@/constants/abacus';
import {
  DepthChartDatum,
  DepthChartPoint,
  DepthChartSeries,
  SERIES_KEY_FOR_ORDER_SIDE,
} from '@/constants/charts';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';

import { TooltipContent } from '@/components/visx/TooltipContent';
import { Details } from '@/components/Details';
import { Output, OutputType } from '@/components/Output';

import { MustBigNumber } from '@/lib/numbers';
import { useOrderbookValuesForDepthChart } from '@/hooks/useOrderbookValues';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';
import { useMemo } from 'react';

type DepthChartTooltipProps = {
  chartPointAtPointer: DepthChartPoint;
  isEditingOrder?: boolean;
  stepSizeDecimals: Nullable<number>;
  tickSizeDecimals: Nullable<number>;
} & Pick<RenderTooltipParams<DepthChartDatum>, 'colorScale' | 'tooltipData'>;

export const DepthChartTooltipContent = ({
  chartPointAtPointer,
  colorScale,
  isEditingOrder,
  stepSizeDecimals,
  tickSizeDecimals,
  tooltipData,
}: DepthChartTooltipProps) => {
  const { nearestDatum } = tooltipData || {};
  const stringGetter = useStringGetter();
  const { spread, spreadPercent, midMarketPrice } = useOrderbookValuesForDepthChart();
  const { id = '' } = useSelector(getCurrentMarketAssetData, shallowEqual) ?? {};

  const priceImpact = useMemo(() => {
    if (nearestDatum) {
      const depthChartSeries = nearestDatum.key as DepthChartSeries;

      return {
        [DepthChartSeries.Bids]: MustBigNumber(nearestDatum?.datum.price)
          .minus(chartPointAtPointer.price)
          .div(nearestDatum?.datum.price),
        [DepthChartSeries.Asks]: MustBigNumber(chartPointAtPointer.price)
          .minus(nearestDatum?.datum.price)
          .div(chartPointAtPointer.price),
        [DepthChartSeries.MidMarket]: undefined,
      }[depthChartSeries];
    }
    return undefined;
  }, [nearestDatum, chartPointAtPointer.price]);

  if (!isEditingOrder && !nearestDatum?.datum) return null;

  return (
    <TooltipContent
      accentColor={
        nearestDatum?.key &&
        colorScale?.(
          isEditingOrder ? SERIES_KEY_FOR_ORDER_SIDE[chartPointAtPointer.side] : nearestDatum.key
        )
      }
    >
      <h4>
        {isEditingOrder
          ? 'Release mouse to edit order'
          : nearestDatum &&
            {
              [DepthChartSeries.Bids]: 'Bids',
              [DepthChartSeries.Asks]: 'Asks',
              [DepthChartSeries.MidMarket]: 'Mid-Market',
            }[nearestDatum.key]}
      </h4>

      <Details
        layout="column"
        items={
          isEditingOrder
            ? [
                {
                  key: 'side',
                  label: stringGetter({ key: STRING_KEYS.SIDE }),
                  value: (
                    <Output
                      type={OutputType.Text}
                      value={
                        {
                          [OrderSide.BUY]: stringGetter({
                            key: STRING_KEYS.BUY,
                          }),
                          [OrderSide.SELL]: stringGetter({
                            key: STRING_KEYS.SELL,
                          }),
                        }[chartPointAtPointer.side]
                      }
                    />
                  ),
                },
                {
                  key: 'limitPrice',
                  label: stringGetter({ key: STRING_KEYS.LIMIT_PRICE }),
                  value: (
                    <Output
                      type={OutputType.Fiat}
                      value={chartPointAtPointer.price}
                      useGrouping={false}
                    />
                  ),
                },
                {
                  key: 'size',
                  label: stringGetter({ key: STRING_KEYS.AMOUNT }),
                  value: (
                    <Output
                      type={OutputType.Asset}
                      value={chartPointAtPointer.size}
                      fractionDigits={stepSizeDecimals}
                      tag={id}
                      useGrouping={false}
                    />
                  ),
                },
              ]
            : nearestDatum?.key === DepthChartSeries.MidMarket
            ? [
                {
                  key: 'midMarketPrice',
                  // label: stringGetter({ key: STRING_KEYS.ORDERBOOK_MID_MARKET_PRICE }),
                  label: stringGetter({ key: STRING_KEYS.PRICE }),
                  value: (
                    <Output type={OutputType.Fiat} value={midMarketPrice} useGrouping={false} />
                  ),
                },
                {
                  key: 'spread',
                  label: stringGetter({ key: STRING_KEYS.ORDERBOOK_SPREAD }),
                  value: (
                    <>
                      <Output
                        type={OutputType.Fiat}
                        value={spread}
                        fractionDigits={tickSizeDecimals}
                        useGrouping={false}
                      />
                      <Output
                        type={OutputType.SmallPercent}
                        value={spreadPercent}
                        withParentheses
                      />
                    </>
                  ),
                },
              ]
            : [
                {
                  key: 'price',
                  label: stringGetter({ key: STRING_KEYS.PRICE }),
                  value: (
                    <>
                      {nearestDatum &&
                        {
                          [DepthChartSeries.Bids]: '≥',
                          [DepthChartSeries.Asks]: '≤',
                        }[nearestDatum.key]}
                      <Output
                        type={OutputType.Fiat}
                        value={nearestDatum?.datum.price}
                        useGrouping={false}
                      />
                    </>
                  ),
                },
                {
                  key: 'depth',
                  label: stringGetter({ key: STRING_KEYS.TOTAL_SIZE }),
                  value: (
                    <Output
                      type={OutputType.Asset}
                      value={nearestDatum?.datum.depth}
                      fractionDigits={stepSizeDecimals}
                      tag={id}
                      useGrouping={false}
                    />
                  ),
                },
                {
                  key: 'cost',
                  label: stringGetter({ key: STRING_KEYS.TOTAL_COST }),
                  value: (
                    <Output
                      useGrouping
                      type={OutputType.Fiat}
                      value={
                        nearestDatum
                          ? nearestDatum?.datum.price * nearestDatum?.datum.depth
                          : undefined
                      }
                    />
                  ),
                },
                {
                  key: 'priceImpact',
                  label: stringGetter({ key: STRING_KEYS.PRICE_IMPACT }),
                  value: <Output useGrouping type={OutputType.Percent} value={priceImpact} />,
                },
              ]
        }
      />
    </TooltipContent>
  );
};
