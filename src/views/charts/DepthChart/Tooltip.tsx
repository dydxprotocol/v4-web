import { useMemo } from 'react';

import { BonsaiHelpers } from '@/bonsai/ontology';
import { OrderSide } from '@dydxprotocol/v4-client-js';
import type { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';

import type { Nullable } from '@/constants/abacus';
import {
  DepthChartDatum,
  DepthChartPoint,
  DepthChartSeries,
  SERIES_KEY_FOR_ORDER_SIDE,
} from '@/constants/charts';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Details } from '@/components/Details';
import { Output, OutputType } from '@/components/Output';
import { TooltipContent } from '@/components/visx/TooltipContent';

import { useAppSelector } from '@/state/appTypes';

import { MustBigNumber } from '@/lib/numbers';
import { orEmptyObj } from '@/lib/typeUtils';

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
  const id = useAppSelector(BonsaiHelpers.currentMarket.assetId) ?? '';
  const { spread, spreadPercent, midPrice } = orEmptyObj(
    useAppSelector(BonsaiHelpers.currentMarket.depthChart.data)
  );

  const priceImpact = useMemo(() => {
    if (nearestDatum && midPrice) {
      const depthChartSeries = nearestDatum.key as DepthChartSeries;

      return {
        [DepthChartSeries.Bids]: MustBigNumber(midPrice)
          .minus(nearestDatum.datum.price)
          .div(midPrice),
        [DepthChartSeries.Asks]: MustBigNumber(nearestDatum.datum.price)
          .minus(midPrice)
          .div(midPrice),
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
                    key: 'midPrice',
                    label: stringGetter({ key: STRING_KEYS.PRICE }),
                    value: <Output type={OutputType.Fiat} value={midPrice} useGrouping={false} />,
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
                          fractionDigits={tickSizeDecimals}
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
        tw="[--details-item-vertical-padding:0.2rem]"
      />
    </TooltipContent>
  );
};
