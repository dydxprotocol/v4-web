import { useCallback, useEffect, useRef, useState } from 'react';

import { shallowEqual } from 'react-redux';

import { AbacusOrderStatus, ORDER_SIDES, SubaccountOrder } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { ORDER_TYPE_STRINGS, type OrderType } from '@/constants/trade';
import type { ChartLine, PositionLineType, TvWidget } from '@/constants/tvchart';

import {
  getCurrentMarketOrders,
  getCurrentMarketPositionData,
  getIsAccountConnected,
} from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getAppColorMode, getAppTheme } from '@/state/configsSelectors';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

import { MustBigNumber } from '@/lib/numbers';
import { getChartLineColors } from '@/lib/tradingView/utils';

import { useStringGetter } from '../useStringGetter';

/**
 * @description Hook to handle drawing chart lines
 */

export const useChartLines = ({
  tvWidget,
  displayButton,
  isChartReady,
}: {
  tvWidget: TvWidget | null;
  displayButton: HTMLElement | null;
  isChartReady: boolean;
}) => {
  const [showOrderLines, setShowOrderLines] = useState(true);
  const [initialWidget, setInitialWidget] = useState<TvWidget | null>(null);
  const [lastMarket, setLastMarket] = useState<string | undefined>(undefined);

  const stringGetter = useStringGetter();

  const chartLinesRef = useRef<Record<string, ChartLine>>({});

  const appTheme = useAppSelector(getAppTheme);
  const appColorMode = useAppSelector(getAppColorMode);

  const isAccountConnected = useAppSelector(getIsAccountConnected);

  const currentMarketId = useAppSelector(getCurrentMarketId);
  const currentMarketPositionData = useAppSelector(getCurrentMarketPositionData, shallowEqual);
  const currentMarketOrders: SubaccountOrder[] = useAppSelector(
    getCurrentMarketOrders,
    shallowEqual
  );

  const setLineColors = useCallback(
    ({ chartLine }: { chartLine: ChartLine }) => {
      const { line, chartLineType } = chartLine;
      const { maybeQuantityColor, borderColor, backgroundColor, textColor, textButtonColor } =
        getChartLineColors({
          appTheme,
          appColorMode,
          chartLineType,
        });

      line
        .setQuantityBorderColor(borderColor)
        .setBodyBackgroundColor(backgroundColor)
        .setBodyBorderColor(borderColor)
        .setBodyTextColor(textColor)
        .setQuantityTextColor(textButtonColor);

      if (maybeQuantityColor != null) {
        line.setLineColor(maybeQuantityColor).setQuantityBackgroundColor(maybeQuantityColor);
      }
    },
    [appColorMode, appTheme]
  );

  const maybeDrawPositionLine = useCallback(
    ({
      key,
      label,
      chartLineType,
      price,
      size,
    }: {
      key: string;
      label: string;
      chartLineType: PositionLineType;
      price?: number | null;
      size?: number | null;
    }) => {
      const shouldShow = !!(size && price);
      const maybePositionLine = chartLinesRef.current[key]?.line;

      if (!shouldShow) {
        if (maybePositionLine) {
          maybePositionLine.remove();
          delete chartLinesRef.current[key];
        }
        return;
      }
      const formattedPrice = MustBigNumber(price).toNumber();
      const quantity = Math.abs(size).toString();

      if (maybePositionLine) {
        if (maybePositionLine.getPrice() !== formattedPrice) {
          maybePositionLine.setPrice(formattedPrice);
        }
        if (maybePositionLine.getQuantity() !== quantity) {
          maybePositionLine.setQuantity(quantity);
        }
      } else {
        const positionLine = tvWidget
          ?.chart()
          .createPositionLine({ disableUndo: false })
          .setPrice(formattedPrice)
          .setQuantity(quantity)
          .setText(label);

        if (positionLine) {
          const chartLine: ChartLine = { line: positionLine, chartLineType };
          setLineColors({ chartLine });
          chartLinesRef.current[key] = chartLine;
        }
      }
    },
    [setLineColors, tvWidget]
  );

  const updatePositionLines = useCallback(() => {
    const entryLineKey = `entry-${currentMarketId}`;
    const liquidationLineKey = `liquidation-${currentMarketId}`;

    if (!currentMarketPositionData) {
      // Clear position and liquidation lines if market position has been cleared
      [entryLineKey, liquidationLineKey].forEach((key) => {
        const maybePositionLine = chartLinesRef.current[key]?.line;
        if (maybePositionLine) {
          maybePositionLine.remove();
          delete chartLinesRef.current[key];
        }
      });
      return;
    }

    const entryPrice = currentMarketPositionData.entryPrice?.current;
    const liquidationPrice = currentMarketPositionData.liquidationPrice?.current;
    const size = currentMarketPositionData.size?.current;

    maybeDrawPositionLine({
      key: entryLineKey,
      label: stringGetter({ key: STRING_KEYS.ENTRY_PRICE_SHORT }),
      chartLineType: 'entry',
      price: entryPrice,
      size,
    });

    maybeDrawPositionLine({
      key: liquidationLineKey,
      label: stringGetter({ key: STRING_KEYS.LIQUIDATION }),
      chartLineType: 'liquidation',
      price: liquidationPrice,
      size,
    });
  }, [stringGetter, currentMarketId, currentMarketPositionData, maybeDrawPositionLine]);

  const updateOrderLines = useCallback(() => {
    // We don't need to worry about clearing chart lines for cancelled market orders since they will persist in
    // currentMarketOrders, just with a cancelReason
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
        const key = id;
        const quantity = (remainingSize ?? size).toString();

        const orderType = type.rawValue as OrderType;
        const orderLabel = stringGetter({
          key: ORDER_TYPE_STRINGS[orderType].orderTypeKey,
        });
        const orderString = trailingPercent ? `${orderLabel} ${trailingPercent}%` : orderLabel;

        const shouldShow =
          !cancelReason &&
          (status === AbacusOrderStatus.Open || status === AbacusOrderStatus.Untriggered);

        const maybeOrderLine = chartLinesRef.current[key]?.line;
        const formattedPrice = MustBigNumber(triggerPrice ?? price).toNumber();

        if (!shouldShow) {
          if (maybeOrderLine) {
            maybeOrderLine.remove();
            delete chartLinesRef.current[key];
          }
        } else {
          if (maybeOrderLine) {
            if (maybeOrderLine.getPrice() !== formattedPrice) {
              maybeOrderLine.setPrice(formattedPrice);
            }
            if (maybeOrderLine.getQuantity() !== quantity) {
              maybeOrderLine.setQuantity(quantity);
            }
          } else {
            const orderLine = tvWidget
              ?.chart()
              .createOrderLine({ disableUndo: false })
              .setPrice(formattedPrice)
              .setQuantity(quantity)
              .setText(orderString);

            if (orderLine) {
              const chartLine: ChartLine = {
                line: orderLine,
                chartLineType: ORDER_SIDES[side.name],
              };
              setLineColors({ chartLine });
              chartLinesRef.current[key] = chartLine;
            }
          }
        }
      }
    );
  }, [setLineColors, stringGetter, currentMarketOrders, tvWidget]);

  const clearChartLines = useCallback(() => {
    Object.values(chartLinesRef.current).forEach(({ line }) => {
      line.remove();
    });
    chartLinesRef.current = {};
  }, []);

  const drawChartLines = useCallback(
    (widget: TvWidget) => {
      widget.onChartReady(() => {
        widget.headerReady().then(() => {
          widget.chart().dataReady(() => {
            if (showOrderLines) {
              updateOrderLines();
              updatePositionLines();
            } else {
              clearChartLines();
            }
          });
        });
      });
    },
    [updatePositionLines, updateOrderLines, clearChartLines, showOrderLines]
  );

  // Effects

  useEffect(() => {
    // Initialize onClick for chart line toggle
    if (isChartReady && displayButton) {
      displayButton.onclick = () => setShowOrderLines((prev) => !prev);
    }
  }, [isChartReady, displayButton]);

  useEffect(() => {
    if (isChartReady && tvWidget && currentMarketPositionData) {
      // Manual call to draw chart lines on initial render of chart
      if (!initialWidget) {
        drawChartLines(tvWidget);
        setInitialWidget(tvWidget);
        setLastMarket(currentMarketId);
      } else if (currentMarketId && lastMarket !== currentMarketId) {
        // Subscribe to update chart lines whenever market (symbol) has changed
        tvWidget
          .activeChart()
          .onSymbolChanged()
          .subscribe(
            null,
            () => {
              drawChartLines(tvWidget);
            },
            true
          );
        setLastMarket(currentMarketId);
      }
    }
  }, [
    initialWidget,
    tvWidget,
    isChartReady,
    currentMarketId,
    lastMarket,
    currentMarketPositionData,
    drawChartLines,
  ]);

  useEffect(
    // Update chart lines on toggle
    () => {
      if (showOrderLines) {
        displayButton?.classList?.add('order-lines-active');
        updateOrderLines();
        if (lastMarket === currentMarketId) {
          // We only want to update the position lines if the market has not changed (the changed market
          // scenario is handled in the effect above; if we trigger it here, it'll run before the onSubscribe
          // callback with the incorrect tick precision)
          updatePositionLines();
        }
      } else {
        displayButton?.classList?.remove('order-lines-active');
        clearChartLines();
      }
    },
    // We intentionally can avoid calling this hook when currentMarketId/lastMarket/market position deps change since
    // these scenarios are handled in the above hooks
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showOrderLines, displayButton?.classList, updateOrderLines, clearChartLines]
  );

  useEffect(() => {
    // Clear lines when switching markets
    return () => clearChartLines();
  }, [currentMarketId, clearChartLines]);

  useEffect(() => {
    // Clear lines when disconnecting account
    if (!isAccountConnected) {
      clearChartLines();
    }
  }, [isAccountConnected, clearChartLines]);

  return { chartLines: chartLinesRef.current };
};
