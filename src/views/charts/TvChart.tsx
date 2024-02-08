import { useEffect, useRef, useState } from 'react';

import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import styled, { type AnyStyledComponent, css } from 'styled-components';

import type {
  IChartingLibraryWidget,
  IOrderLineAdapter,
  IPositionLineAdapter,
  ResolutionString,
} from 'public/tradingview/charting_library';

import { AbacusOrderStatus } from '@/constants/abacus';
import { DEFAULT_RESOLUTION, RESOLUTION_CHART_CONFIGS } from '@/constants/candles';
import { STRING_KEYS } from '@/constants/localization';
import { DEFAULT_MARKETID } from '@/constants/markets';
import { type OrderType, ORDER_TYPE_STRINGS } from '@/constants/trade';

import { useStringGetter } from '@/hooks';
import { useTradingView, useTradingViewTheme } from '@/hooks/tradingView';

import { LoadingSpace } from '@/components/Loading/LoadingSpinner';

import { getCurrentMarketOrders, getCurrentMarketPositionData } from '@/state/accountSelectors';
import { getAppTheme, getAppColorMode } from '@/state/configsSelectors';
import { setTvChartResolution } from '@/state/perpetuals';
import { getCurrentMarketId, getSelectedResolutionForMarket } from '@/state/perpetualsSelectors';

import { layoutMixins } from '@/styles/layoutMixins';

import { MustBigNumber } from '@/lib/numbers';
import { getOrderLineColors } from '@/lib/tradingView/utils';

type TvWidget = IChartingLibraryWidget & { _id?: string; _ready?: boolean };

let chartLines: Record<string, IOrderLineAdapter | IPositionLineAdapter> = {};

export const TvChart = () => {
  const dispatch = useDispatch();
  const stringGetter = useStringGetter();

  const [isChartReady, setIsChartReady] = useState(false);
  const [showOrderLines, setShowOrderLines] = useState(false);

  const displayButtonRef = useRef<HTMLElement | null>(null);

  const appTheme = useSelector(getAppTheme);
  const appColorMode = useSelector(getAppColorMode);

  const currentMarketId: string = useSelector(getCurrentMarketId) || DEFAULT_MARKETID;
  const currentMarketOrders = useSelector(getCurrentMarketOrders, shallowEqual);
  const currentMarketPositionData = useSelector(getCurrentMarketPositionData, shallowEqual);

  const selectedResolution: string =
    useSelector(getSelectedResolutionForMarket(currentMarketId)) || DEFAULT_RESOLUTION;

  const tvWidgetRef = useRef<TvWidget | null>(null);
  const tvWidget = tvWidgetRef.current;
  const isWidgetReady = tvWidget?._ready;
  const chart = isWidgetReady ? tvWidget?.chart() : undefined;
  const chartResolution = chart?.resolution?.();

  const { savedResolution } = useTradingView({ tvWidgetRef, displayButtonRef, setIsChartReady });
  useTradingViewTheme({ tvWidget, isWidgetReady, orderLines: chartLines });

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
   * @description Hook to handle changing chart resolution
   */
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

  /**
   * @description Hook to handle order line toggle state
   */
  useEffect(() => {
    if (isChartReady && displayButtonRef && displayButtonRef.current) {
      displayButtonRef.current.onclick = () => {
        const newShowOrderLinesState = !showOrderLines;
        if (newShowOrderLinesState) {
          displayButtonRef.current?.classList?.add('order-lines-active');
        } else {
          displayButtonRef.current?.classList?.remove('order-lines-active');
        }
        setShowOrderLines(newShowOrderLinesState);
      };
    }
  }, [isChartReady, showOrderLines]);

  /**
   * @description Hook to handle drawing chart lines
   */
  useEffect(() => {
    if (tvWidget && isChartReady) {
      tvWidget.onChartReady(() => {
        tvWidget.chart().dataReady(() => {
          if (showOrderLines) {
            drawOrderLines();
            drawPositionLine();
          } else {
            deleteChartLines();
          }
        });
      });
    }
  }, [
    isChartReady,
    showOrderLines,
    currentMarketOrders,
    currentMarketPositionData,
    currentMarketId,
  ]);

  const drawPositionLine = () => {
    if (!currentMarketPositionData) return;
    const { current: entryPrice } = currentMarketPositionData.entryPrice;
    const { current: quantity } = currentMarketPositionData.size;

    const key = `position-${currentMarketPositionData.id}`;
    const price = MustBigNumber(entryPrice).toNumber();

    const maybePositionLine = chartLines[key];
    const shouldShow = quantity !== 0;

    if (maybePositionLine) {
      if (!shouldShow) {
        maybePositionLine.remove();
        delete chartLines[key];
        return;
      }
      if (maybePositionLine.getQuantity() !== quantity) {
        maybePositionLine.setQuantity(quantity);
      }
      if (maybePositionLine.getPrice() !== price) {
        maybePositionLine.setPrice(price);
      }
    } else if (shouldShow) {
      const { borderColor, backgroundColor, textColor, textButtonColor } = getChartLineColors({
        appTheme,
        appColorMode,
        key: 'position',
      });

      const positionLine = tvWidget
        ?.chart()
        .createPositionLine({ disableUndo: false })
        .setText(stringGetter({ key: STRING_KEYS.ENTRY_PRICE_SHORT }))
        .setPrice(price)
        .setQuantity(quantity)
        .setQuantityBorderColor(borderColor)
        .setBodyBackgroundColor(backgroundColor)
        .setBodyBorderColor(borderColor)
        .setBodyTextColor(textColor)
        .setQuantityTextColor(textButtonColor);

      if (positionLine) {
        chartLines[key] = positionLine;
      }
    }
  };

  const drawOrderLines = () => {
    if (!currentMarketOrders) return;
    currentMarketOrders.forEach(
      ({
        id,
        type,
        status,
        side,
        cancelReason,
        remainingSize,
        size,
        triggerPrice,
        price,
        trailingPercent,
      }) => {
        const key = `${side.rawValue}-${id}`;
        const quantity = (remainingSize ?? size).toString();

        const orderType = type.rawValue as OrderType;
        const orderLabel = stringGetter({
          key: ORDER_TYPE_STRINGS[orderType].orderTypeKey,
        });
        const orderString = trailingPercent ? `${orderLabel} ${trailingPercent}%` : orderLabel;

        const shouldShow =
          !cancelReason &&
          (status === AbacusOrderStatus.open || status === AbacusOrderStatus.untriggered);

        const maybeOrderLine = key in chartLines ? chartLines[key] : null;
        if (maybeOrderLine) {
          if (!shouldShow) {
            maybeOrderLine.remove();
            delete chartLines[key];
            return;
          } else if (maybeOrderLine.getQuantity() !== quantity) {
            maybeOrderLine.setQuantity(quantity);
            return;
          }
        } else if (shouldShow) {
          const { maybeQuantityColor, borderColor, backgroundColor, textColor, textButtonColor } =
            getChartLineColors({ key: side.rawValue, appTheme, appColorMode });
          const orderLine = tvWidget
            ?.chart()
            .createOrderLine({ disableUndo: false })
            .setPrice(MustBigNumber(triggerPrice ?? price).toNumber())
            .setQuantity(quantity)
            .setText(orderString)
            .setLineColor(maybeQuantityColor)
            .setQuantityBackgroundColor(maybeQuantityColor)
            .setQuantityBorderColor(borderColor)
            .setBodyBackgroundColor(backgroundColor)
            .setBodyBorderColor(borderColor)
            .setBodyTextColor(textColor)
            .setQuantityTextColor(textButtonColor);

          if (orderLine) {
            chartLines[key] = orderLine;
          }
        }
      }
    );
  };

  const deleteChartLines = () => {
    Object.values(chartLines).forEach((line) => {
      line.remove();
    });
    chartLines = {};
  };

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
