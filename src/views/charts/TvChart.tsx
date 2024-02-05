import { useEffect, useRef, useState } from 'react';
import styled, { type AnyStyledComponent, css } from 'styled-components';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

import { MustBigNumber } from '@/lib/numbers';
import { getOrderLineColors } from '@/lib/tradingView/utils';

import type {
  IChartingLibraryWidget,
  IOrderLineAdapter,
  ResolutionString,
} from 'public/tradingview/charting_library';

import {
  AbacusOrderStatus,
  AbacusOrderType,
  KotlinIrEnumValues,
  ORDER_TYPE_LABEL_MAPPING,
} from '@/constants/abacus';
import { DEFAULT_RESOLUTION, RESOLUTION_CHART_CONFIGS } from '@/constants/candles';
import { DEFAULT_MARKETID } from '@/constants/markets';

import { useStringGetter } from '@/hooks';
import { useTradingView, useTradingViewTheme } from '@/hooks/tradingView';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';

import { getCurrentMarketOrders } from '@/state/accountSelectors';
import { getAppTheme, getAppColorMode } from '@/state/configsSelectors';
import { setOrderLines, setTvChartResolution } from '@/state/perpetuals';
import {
  getCurrentMarketId,
  getOrderLines,
  getShouldShowOrderLines,
  getSelectedResolutionForMarket,
} from '@/state/perpetualsSelectors';

import { layoutMixins } from '@/styles/layoutMixins';

type TvWidget = IChartingLibraryWidget & { _id?: string; _ready?: boolean };

export const TvChart = () => {
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();

  const [isChartReady, setIsChartReady] = useState(false);

  const appTheme = useSelector(getAppTheme);
  const appColorMode = useSelector(getAppColorMode);

  const currentMarketId: string = useSelector(getCurrentMarketId) || DEFAULT_MARKETID;
  const currentMarketOrders = useSelector(getCurrentMarketOrders, shallowEqual);

  const showOrderLines = useSelector(getShouldShowOrderLines);
  const orderLines = useSelector(getOrderLines);

  const selectedResolution: string =
    useSelector(getSelectedResolutionForMarket(currentMarketId)) || DEFAULT_RESOLUTION;

  const tvWidgetRef = useRef<TvWidget | null>(null);
  const tvWidget = tvWidgetRef.current;
  const isWidgetReady = tvWidget?._ready;
  const chart = isWidgetReady ? tvWidget?.chart() : undefined;
  const chartResolution = chart?.resolution?.();

  const { savedResolution } = useTradingView({ tvWidgetRef, setIsChartReady });
  useTradingViewTheme({ tvWidget, isWidgetReady });

  const setVisibleRangeForResolution = ({ resolution }: { resolution: ResolutionString }) => {
    // Different resolutions have different timeframes to display data efficiently.
    const { defaultRange } = RESOLUTION_CHART_CONFIGS[resolution];

    // from/to values converted to epoch seconds
    const newRange = {
      from: (Date.now() - defaultRange) / 1000,
      to: Date.now() / 1000,
    };

    tvWidget?.activeChart().setVisibleRange(newRange, { percentRightMargin: 10 });
  };

  /**
   * @description Hooks to handle state of show orders button
   */

  useEffect(() => {
    if (!tvWidgetRef || !tvWidget || !isChartReady) {
      return;
    }

    tvWidget.onChartReady(() => {
      tvWidget.chart().dataReady(() => {
        if (showOrderLines) {
          drawOrderLines();
        } else {
          deleteOrderLines();
        }
      });
    });
  }, [showOrderLines, currentMarketOrders]);

  const drawOrderLines = () => {
    const updatedOrderLines: Record<string, IOrderLineAdapter> = {};
    currentMarketOrders.forEach(
      ({ id, type, status, side, cancelReason, remainingSize, triggerPrice, price }) => {
        const key = `${side.rawValue}-${id}`;
        const orderType = type.rawValue as KotlinIrEnumValues<typeof AbacusOrderType>;
        const quantity = remainingSize ? remainingSize.toString() : '';

        const orderString = stringGetter({
          key: ORDER_TYPE_LABEL_MAPPING[orderType] || '',
        });
        const shouldShow =
          !cancelReason &&
          (status === AbacusOrderStatus.open || status === AbacusOrderStatus.untriggered);

        const maybeOrderLine = key in orderLines ? orderLines[key] : null;

        if (maybeOrderLine) {
          if (!shouldShow) {
            maybeOrderLine.remove();
          } else if (maybeOrderLine.getQuantity() !== quantity) {
            maybeOrderLine.setQuantity(quantity);
          }
          updatedOrderLines[key] = maybeOrderLine;
          return;
        } else if (!shouldShow) {
          return;
        } else {
          const { orderColor, borderColor, backgroundColor, textColor, textButtonColor } =
            getOrderLineColors({ side: side.rawValue, appTheme, appColorMode });

          const orderPrice = triggerPrice ?? price;

          const orderLine = tvWidget
            ?.chart()
            .createOrderLine({ disableUndo: false })
            .setPrice(MustBigNumber(orderPrice).toNumber())
            .setQuantity(quantity)
            .setText(orderString)
            .setLineColor(orderColor)
            .setQuantityBackgroundColor(orderColor)
            .setQuantityBorderColor(borderColor)
            .setBodyBackgroundColor(backgroundColor)
            .setBodyBorderColor(borderColor)
            .setBodyTextColor(textColor)
            .setQuantityTextColor(textButtonColor);

          if (orderLine) {
            updatedOrderLines[key] = orderLine;
          }
        }
      }
    );
    dispatch(
      setOrderLines({
        orderLines: updatedOrderLines,
      })
    );
  };

  const deleteOrderLines = () => {
    Object.values(orderLines).forEach((line) => {
      line.remove();
    });
    dispatch(setOrderLines({ orderLines: {} }));
  };

  useEffect(() => {
    if (chartResolution) {
      if (chartResolution !== selectedResolution) {
        dispatch(setTvChartResolution({ marketId: currentMarketId, resolution: chartResolution }));
      }

      setVisibleRangeForResolution({ resolution: chartResolution });
    }
  }, [chartResolution]);

  /**
   * @description Hook to handle changing markets
   */
  useEffect(() => {
    if (currentMarketId && isWidgetReady) {
      const resolution = savedResolution || selectedResolution;
      tvWidget?.setSymbol(currentMarketId, resolution as ResolutionString, () => {});
    }
  }, [currentMarketId, isWidgetReady]);

  return (
    <Styled.PriceChart isChartReady={isChartReady}>
      {!isChartReady && <LoadingSpace id="tv-chart-loading" />}

      <div id="tv-price-chart" />
    </Styled.PriceChart>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.PriceChart = styled.div<{ isChartReady?: boolean }>`
  ${layoutMixins.stack}

  height: 100%;

  #tv-price-chart {
    ${({ isChartReady }) =>
      !isChartReady &&
      css`
        filter: blur(3px);
        translate: 0 0 1rem;
        opacity: 0;
      `};

    @media (prefers-reduced-motion: no-preference) {
      transition: 0.2s var(--ease-out-expo);
    }
  }
`;
