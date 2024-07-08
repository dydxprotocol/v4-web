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
        // if (maybePositionLine.getPrice() !== formattedPrice) {
        maybePositionLine.setPrice(formattedPrice);
        // }
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

  const drawPositionLines = useCallback(() => {
    if (!currentMarketPositionData) return;

    const entryPrice = currentMarketPositionData.entryPrice?.current;
    const liquidationPrice = currentMarketPositionData.liquidationPrice?.current;
    const size = currentMarketPositionData.size?.current;

    const entryLineKey = `entry-${currentMarketPositionData.id}`;
    const liquidationLineKey = `liquidation-${currentMarketPositionData.id}`;

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
  }, [stringGetter, currentMarketPositionData, maybeDrawPositionLine]);

  const drawOrderLines = useCallback(() => {
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

  const drawChartLines = useCallback(
    (widget: TvWidget) => {
      widget.onChartReady(() => {
        widget.headerReady().then(() => {
          widget.chart().dataReady(() => {
            if (showOrderLines) {
              drawOrderLines();
              drawPositionLines();
            } else {
              deleteChartLines();
            }
          });
        });
      });
    },
    [drawPositionLines, drawOrderLines, showOrderLines]
  );

  const deleteChartLines = () => {
    Object.values(chartLinesRef.current).forEach(({ line }) => {
      line.remove();
    });
    chartLinesRef.current = {};
  };

  useEffect(() => {
    if (isChartReady && displayButton) {
      displayButton.onclick = () => setShowOrderLines(!showOrderLines);
    }
  }, [isChartReady, showOrderLines, displayButton]);

  useEffect(() => {
    if (showOrderLines) {
      displayButton?.classList?.add('order-lines-active');
    } else {
      displayButton?.classList?.remove('order-lines-active');
    }
  }, [showOrderLines, displayButton?.classList]);

  useEffect(() => {
    // Clear lines when switching markets
    return () => deleteChartLines();
  }, [currentMarketId]);

  useEffect(() => {
    if (isChartReady && tvWidget && currentMarketPositionData) {
      // Manual call to draw chart lines on initial render of chart
      if (!initialWidget) {
        drawChartLines(tvWidget);
        setInitialWidget(tvWidget);
        setLastMarket(currentMarketId);
      } else if (currentMarketId && lastMarket !== currentMarketId) {
        // Subscribe to update chart lines whenever symbol has changed
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

  useEffect(() => {
    // Clear lines when disconnecting account
    if (!isAccountConnected) {
      deleteChartLines();
    }
  }, [isAccountConnected]);

  return { chartLines: chartLinesRef.current };
};
