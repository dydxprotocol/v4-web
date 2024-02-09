import { useEffect, useState } from 'react';

import { shallowEqual, useSelector } from 'react-redux';

import { AbacusOrderStatus } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';
import { type OrderType, ORDER_TYPE_STRINGS } from '@/constants/trade';
import type { ChartLine, ChartLineType, TvWidget } from '@/constants/tvchart';

import { useStringGetter } from '@/hooks';

import { getCurrentMarketOrders, getCurrentMarketPositionData } from '@/state/accountSelectors';
import { getAppTheme, getAppColorMode } from '@/state/configsSelectors';

import { MustBigNumber } from '@/lib/numbers';
import { getChartLineColors } from '@/lib/tradingView/utils';

let chartLines: Record<string, ChartLine> = {};

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
  isChartReady?: boolean;
}) => {
  const [showOrderLines, setShowOrderLines] = useState(false);

  const stringGetter = useStringGetter();

  const appTheme = useSelector(getAppTheme);
  const appColorMode = useSelector(getAppColorMode);

  const currentMarketPositionData = useSelector(getCurrentMarketPositionData, shallowEqual);
  const currentMarketOrders = useSelector(getCurrentMarketOrders, shallowEqual);

  useEffect(() => {
    if (isChartReady && displayButton) {
      displayButton.onclick = () => {
        const newShowOrderLinesState = !showOrderLines;
        if (newShowOrderLinesState) {
          displayButton?.classList?.add('order-lines-active');
        } else {
          displayButton?.classList?.remove('order-lines-active');
        }
        setShowOrderLines(newShowOrderLinesState);
      };
    }
  }, [isChartReady, showOrderLines]);

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
  }, [isChartReady, showOrderLines, currentMarketPositionData, currentMarketOrders]);

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
      const positionLine = tvWidget
        ?.chart()
        .createPositionLine({ disableUndo: false })
        .setText(stringGetter({ key: STRING_KEYS.ENTRY_PRICE_SHORT }))
        .setPrice(price)
        .setQuantity(quantity);

      if (positionLine) {
        setLineColors({ chartLineType: 'position', line: positionLine });
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
          }
          if (maybeOrderLine.getQuantity() !== quantity) {
            maybeOrderLine.setQuantity(quantity);
          }
        } else if (shouldShow) {
          const orderLine = tvWidget
            ?.chart()
            .createOrderLine({ disableUndo: false })
            .setPrice(MustBigNumber(triggerPrice ?? price).toNumber())
            .setQuantity(quantity)
            .setText(orderString);

          if (orderLine) {
            setLineColors({ chartLineType: side.rawValue, line: orderLine });
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

  const setLineColors = ({
    chartLineType,
    line,
  }: {
    chartLineType: ChartLineType;
    line: ChartLine;
  }) => {
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

    maybeQuantityColor &&
      line.setLineColor(maybeQuantityColor).setQuantityBackgroundColor(maybeQuantityColor);
  };

  return { chartLines };
};
