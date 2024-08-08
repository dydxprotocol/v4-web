import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

import { shallowEqual } from 'react-redux';

import { ORDER_SIDES, SubaccountOrder } from '@/constants/abacus';
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
import { isOrderStatusOpen } from '@/lib/orders';
import { getChartLineColors } from '@/lib/tradingView/utils';

import { useStringGetter } from '../useStringGetter';

/**
 * @description Hook to handle drawing chart lines
 */

export const useChartLines = ({
  tvWidget,
  orderLineToggle,
  isChartReady,
  orderLinesToggleOn,
  setOrderLinesToggleOn,
}: {
  tvWidget: TvWidget | null;
  orderLineToggle: HTMLElement | null;
  isChartReady: boolean;
  orderLinesToggleOn: boolean;
  setOrderLinesToggleOn: Dispatch<SetStateAction<boolean>>;
}) => {
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

  const runOnChartReady = useCallback(
    (callback: () => void) => {
      if (tvWidget) {
        tvWidget.onChartReady(() => {
          tvWidget.headerReady().then(() => {
            tvWidget.chart().dataReady(() => {
              callback();
            });
          });
        });
      }
    },
    [tvWidget]
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
      ({ id, type, status, side, cancelReason, size, triggerPrice, price, trailingPercent }) => {
        const key = id;
        const quantity = size.toString();

        const orderType = type.rawValue as OrderType;
        const orderLabel = stringGetter({
          key: ORDER_TYPE_STRINGS[orderType].orderTypeKey,
        });
        const orderString = trailingPercent ? `${orderLabel} ${trailingPercent}%` : orderLabel;

        const shouldShow = !cancelReason && isOrderStatusOpen(status);
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

  const drawChartLines = useCallback(() => {
    if (orderLinesToggleOn) {
      updateOrderLines();
      updatePositionLines();
    } else {
      clearChartLines();
    }
  }, [updatePositionLines, updateOrderLines, clearChartLines, orderLinesToggleOn]);

  // Effects

  useEffect(() => {
    // Initialize onClick for order line toggle
    if (isChartReady && orderLineToggle) {
      orderLineToggle.onclick = () => setOrderLinesToggleOn((prev) => !prev);
    }
  }, [isChartReady, orderLineToggle, setOrderLinesToggleOn]);

  useEffect(
    // Update display button on toggle
    () => {
      runOnChartReady(() => {
        if (orderLinesToggleOn) {
          orderLineToggle?.classList?.add('order-lines-active');
        } else {
          orderLineToggle?.classList?.remove('order-lines-active');
        }
      });
    },
    [orderLinesToggleOn, orderLineToggle, runOnChartReady]
  );

  useEffect(
    () => {
      if (isChartReady && tvWidget) {
        // Manual call to draw chart lines on initial render of chart
        if (!initialWidget) {
          runOnChartReady(drawChartLines);
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
                runOnChartReady(drawChartLines);
              },
              true
            );
          setLastMarket(currentMarketId);
        } else {
          // Update chart lines if market has not changed. If the market has changed, we want the chart lines to be handled by the subscribe so
          // that it is guaranteed to run after the tick size of the market has been updated.
          runOnChartReady(drawChartLines);
        }
      }
    },
    // We intentionally do not want the hook to re-run when lastMarket is updated since it is set in the subscribe condition; only the
    // subscribe condition OR else condition should run (otherwise the else will run before the subscribe, resulting in an incorrect tick size)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      initialWidget,
      tvWidget,
      isChartReady,
      currentMarketId,
      // lastMarket,
      drawChartLines,
      runOnChartReady,
    ]
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
