import { useEffect, useRef, useState } from 'react';

import { shallowEqual, useSelector } from 'react-redux';

import { AbacusOrderStatus, ORDER_SIDES, SubaccountOrder } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { ORDER_TYPE_STRINGS, type OrderType } from '@/constants/trade';
import type { ChartLine, PositionLineType, TvWidget } from '@/constants/tvchart';

import {
  getCurrentMarketOrders,
  getCurrentMarketPositionData,
  getIsAccountConnected,
} from '@/state/accountSelectors';
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

  const stringGetter = useStringGetter();

  const chartLinesRef = useRef<Record<string, ChartLine>>({});

  const appTheme = useSelector(getAppTheme);
  const appColorMode = useSelector(getAppColorMode);

  const isAccountConnected = useSelector(getIsAccountConnected);

  const currentMarketId = useSelector(getCurrentMarketId);
  const currentMarketPositionData = useSelector(getCurrentMarketPositionData, shallowEqual);
  const currentMarketOrders: SubaccountOrder[] = useSelector(getCurrentMarketOrders, shallowEqual);

  useEffect(() => {
    return () => deleteChartLines();
  }, [currentMarketId]);

  useEffect(() => {
    if (isChartReady && displayButton) {
      displayButton.onclick = () => setShowOrderLines(!showOrderLines);
    }
  }, [isChartReady, showOrderLines]);

  useEffect(() => {
    if (!isAccountConnected) {
      deleteChartLines();
    }
  }, [isAccountConnected]);

  useEffect(() => {
    if (isChartReady && tvWidget) {
      tvWidget.onChartReady(() => {
        tvWidget.headerReady().then(() => {
          tvWidget.chart().dataReady(() => {
            if (showOrderLines) {
              displayButton?.classList?.add('order-lines-active');
              drawOrderLines();
              drawPositionLines();
            } else {
              displayButton?.classList?.remove('order-lines-active');
              deleteChartLines();
            }
          });
        });
      });
    }
  }, [isChartReady, showOrderLines, currentMarketPositionData, currentMarketOrders]);

  const drawPositionLines = () => {
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
  };

  const maybeDrawPositionLine = ({
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
        const key = id;
        const quantity = (remainingSize ?? size).toString();

        const orderType = type.rawValue as OrderType;
        const orderLabel = stringGetter({
          key: ORDER_TYPE_STRINGS[orderType].orderTypeKey,
        });
        const orderString = trailingPercent ? `${orderLabel} ${trailingPercent}%` : orderLabel;

        const shouldShow =
          !cancelReason &&
          (status === AbacusOrderStatus.open || status === AbacusOrderStatus.untriggered);

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
  };

  const deleteChartLines = () => {
    Object.values(chartLinesRef.current).forEach(({ line }) => {
      line.remove();
    });
    chartLinesRef.current = {};
  };

  const setLineColors = ({ chartLine }: { chartLine: ChartLine }) => {
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
  };

  return { chartLines: chartLinesRef.current };
};
