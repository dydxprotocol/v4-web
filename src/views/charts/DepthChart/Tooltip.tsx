import { useMemo } from 'react';

import { OrderSide } from '@dydxprotocol/v4-client-js';
import type { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';
import { shallowEqual } from 'react-redux';
import styled from 'styled-components';

import type { Nullable } from '@/constants/abacus';
import {
  DepthChartDatum,
  DepthChartPoint,
  DepthChartSeries,
  SERIES_KEY_FOR_ORDER_SIDE,
} from '@/constants/charts';
import { STRING_KEYS } from '@/constants/localization';

import { useOrderbookValuesForDepthChart } from '@/hooks/Orderbook/useOrderbookValues';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Details } from '@/components/Details';
import { Output, OutputType } from '@/components/Output';
import { TooltipContent } from '@/components/visx/TooltipContent';

import { useAppSelector } from '@/state/appTypes';
import { getCurrentMarketAssetData } from '@/state/assetsSelectors';

import { MustBigNumber } from '@/lib/numbers';

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
  const { nearestDatum } = tooltipData ?? {};
  const stringGetter = useStringGetter();
  const { spread, spreadPercent, midMarketPrice } = useOrderbookValuesForDepthChart();
  const { id = '' } = useAppSelector(getCurrentMarketAssetData, shallowEqual) ?? {};

  const priceImpact = useMemo(() => {
    if (nearestDatum && midMarketPrice) {
      const depthChartSeries = nearestDatum.key as DepthChartSeries;

      return {
        [DepthChartSeries.Bids]: MustBigNumber(midMarketPrice)
          .minus(nearestDatum?.datum.price)
          .div(midMarketPrice),
        [DepthChartSeries.Asks]: MustBigNumber(nearestDatum?.datum.price)
          .minus(midMarketPrice)
          .div(midMarketPrice),
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
          ? stringGetter({ key: STRING_KEYS.RELEASE_TO_EDIT })
          : nearestDatum &&
            {
              [DepthChartSeries.Bids]: stringGetter({ key: STRING_KEYS.BIDS }),
              [DepthChartSeries.Asks]: stringGetter({ key: STRING_KEYS.ASKS }),
              [DepthChartSeries.MidMarket]: stringGetter({ key: STRING_KEYS.MID_MARKET }),
            }[nearestDatum.key]}
      </h4>

      <$Details
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
                        value={nearestDatum != null ? nearestDatum.datum.depthCost : undefined}
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

const $Details = styled(Details)`
  --details-item-vertical-padding: 0.2rem;
`;
