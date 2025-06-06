import { useCallback, useEffect, useRef, useState } from 'react';

import { accountTransactionManager } from '@/bonsai/AccountTransactionSupervisor';
import { PlaceOrderPayload } from '@/bonsai/forms/triggers/types';
import { isOperationFailure } from '@/bonsai/lib/operationResult';
import { SubaccountOrder } from '@/bonsai/types/summaryTypes';
import { OrderSide } from '@dydxprotocol/v4-client-js';
import { IOrderLineAdapter } from 'public/tradingview/charting_library';
import { shallowEqual } from 'react-redux';
import tw from 'twin.macro';

import { AnalyticsEvents } from '@/constants/analytics';
import { TOGGLE_ACTIVE_CLASS_NAME } from '@/constants/charts';
import { STRING_KEYS } from '@/constants/localization';
import { ORDER_TYPE_STRINGS } from '@/constants/trade';
import type { ChartLine, PositionLineType, TvWidget } from '@/constants/tvchart';
import { IndexerOrderSide } from '@/types/indexer/indexerApiGen';

import { Icon, IconName } from '@/components/Icon';

import {
  getCurrentMarketOrders,
  getCurrentMarketPositionData,
  getIsAccountConnected,
} from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getAppColorMode, getAppTheme } from '@/state/appUiConfigsSelectors';
import { getCurrentMarketId } from '@/state/currentMarketSelectors';
import { placeOrderFailed } from '@/state/localOrders';

import { track } from '@/lib/analytics/analytics';
import { operationFailureToErrorParams } from '@/lib/errorHelpers';
import { MustBigNumber } from '@/lib/numbers';
import {
  canModifyOrderTypeFromChart,
  createPlaceOrderPayloadFromExistingOrder,
  getOrderModificationError,
} from '@/lib/orderModification';
import { isNewOrderStatusOpen } from '@/lib/orders';
import { getChartLineColors } from '@/lib/tradingView/utils';

import { useCustomNotification } from '../useCustomNotification';
import { useStringGetter } from '../useStringGetter';

const CHART_LINE_FONT = 'bold 10px Satoshi';

/**
 * @description Hook to handle drawing chart lines
 */

export const useChartLines = ({
  tvWidget,
  orderLineToggle,
  orderLinesToggleOn,
}: {
  tvWidget?: TvWidget;
  orderLineToggle: HTMLElement | null;
  orderLinesToggleOn: boolean;
}) => {
  const [initialWidget, setInitialWidget] = useState<TvWidget | null>(null);
  const [lastMarket, setLastMarket] = useState<string | undefined>(undefined);

  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  const chartLinesRef = useRef<Record<string, ChartLine>>({});

  const appTheme = useAppSelector(getAppTheme);
  const appColorMode = useAppSelector(getAppColorMode);

  const isAccountConnected = useAppSelector(getIsAccountConnected);

  const currentMarketId = useAppSelector(getCurrentMarketId);
  const currentMarketPositionData = useAppSelector(getCurrentMarketPositionData);
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

  const setLineColorsAndFont = useCallback(
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
        .setQuantityTextColor(textButtonColor)
        .setBodyFont(CHART_LINE_FONT)
        .setQuantityFont(CHART_LINE_FONT);

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
          setLineColorsAndFont({ chartLine });
          chartLinesRef.current[key] = chartLine;
        }
      }
    },
    [setLineColorsAndFont, tvWidget]
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

    const entryPrice = currentMarketPositionData.entryPrice.toNumber();
    const liquidationPrice = currentMarketPositionData.liquidationPrice?.toNumber();
    const size = currentMarketPositionData.signedSize.toNumber();

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

  // Cache for order modification that stores the new orders that are submitted but not yet placed
  const pendingOrderAdjustmentsRef = useRef<{
    [clientId: string]: { orderPayload: PlaceOrderPayload; oldOrderId: string };
  }>({});

  const removePendingOrderAdjustment = (clientId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [clientId]: removed, ...withoutOrderId } = pendingOrderAdjustmentsRef.current;
    pendingOrderAdjustmentsRef.current = withoutOrderId;
  };

  const addPendingOrderAdjustment = (orderPayload: PlaceOrderPayload, oldOrderId: string) => {
    pendingOrderAdjustmentsRef.current = {
      ...pendingOrderAdjustmentsRef.current,
      [orderPayload.clientId]: { orderPayload, oldOrderId },
    };
  };

  const notify = useCustomNotification();
  const onMoveOrderLine = useCallback(
    async (order: SubaccountOrder, orderLine?: IOrderLineAdapter) => {
      if (!orderLine || !canModifyOrderTypeFromChart(order)) return;

      const oldPrice = (order.triggerPrice ?? order.price).toNumber();
      const newPrice = orderLine.getPrice();

      const priceError = getOrderModificationError(order, newPrice);
      if (priceError) {
        notify({
          title: stringGetter({ key: priceError.title }),
          body: priceError.body && stringGetter({ key: priceError.body }),
          icon: <$WarningIcon iconName={IconName.Warning} />,
        });
        orderLine.setPrice(oldPrice);
        return;
      }

      const orderPayload = createPlaceOrderPayloadFromExistingOrder(order, newPrice);
      if (!orderPayload) return;

      track(
        AnalyticsEvents.TradingViewOrderModificationSubmitted({
          ...orderPayload,
          previousOrderClientId: order.clientId,
          previousOrderPrice: oldPrice,
        })
      );

      orderLine.setPrice(newPrice);

      addPendingOrderAdjustment(orderPayload, order.id);

      const cancelResult = await accountTransactionManager.cancelOrder({
        orderId: order.id,
      });
      if (isOperationFailure(cancelResult)) {
        dispatch(
          placeOrderFailed({
            clientId: orderPayload.clientId.toString(),
            errorParams: operationFailureToErrorParams(cancelResult),
          })
        );
        orderLine.setPrice(oldPrice);
        removePendingOrderAdjustment(orderPayload.clientId.toString());
        return;
      }

      const res = await accountTransactionManager.placeOrder(orderPayload);
      if (isOperationFailure(res)) {
        orderLine.remove();
        removePendingOrderAdjustment(orderPayload.clientId.toString());
      }
    },
    [dispatch, stringGetter, notify]
  );

  const updateOrderLines = useCallback(() => {
    const pendingOrderAdjustments = pendingOrderAdjustmentsRef.current;
    const currentKeys = new Set<string>();
    currentMarketOrders.forEach((order) => {
      const {
        id,
        type,
        status,
        side,
        removalReason: cancelReason,
        size,
        triggerPrice,
        price,
      } = order;
      const key = id;
      const quantity = size.toString();

      const orderType = type;
      const orderLabel = stringGetter({
        key: ORDER_TYPE_STRINGS[orderType].orderTypeKey,
      });
      const orderString = orderLabel;

      const pendingReplacementOrder = Object.values(pendingOrderAdjustments).find(
        (adjustment) => adjustment.oldOrderId === id
      );
      const replacementOrderPlaced = !!currentMarketOrders.find(
        (o) => o.clientId === pendingReplacementOrder?.orderPayload.clientId
      );

      // For orders that are modified on the chart, keep showing the canceled order (with the new price) until the new order is successfully placed
      const shouldShow =
        (!!pendingReplacementOrder && !replacementOrderPlaced) ||
        (!cancelReason && status != null && isNewOrderStatusOpen(status));

      const maybeOrderLine = chartLinesRef.current[key]?.line;

      const pendingReplacementOrderPrice =
        pendingReplacementOrder?.orderPayload.triggerPrice ??
        pendingReplacementOrder?.orderPayload.price;
      const formattedPrice = MustBigNumber(
        pendingReplacementOrderPrice ?? triggerPrice ?? price
      ).toNumber();
      if (!shouldShow) {
        if (maybeOrderLine) {
          maybeOrderLine.remove();
          delete chartLinesRef.current[key];
        }
      } else {
        currentKeys.add(key);
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
              chartLineType: side === IndexerOrderSide.BUY ? OrderSide.BUY : OrderSide.SELL,
            };
            setLineColorsAndFont({ chartLine });
            chartLinesRef.current[key] = chartLine;
          }
          if (canModifyOrderTypeFromChart(order)) {
            orderLine?.onMove(() => onMoveOrderLine(order, orderLine));
          }

          // Update pendingOrderAdjustmentRef here instead of a separate useEffect so that
          // adding the new chart line and removing from pendingOrderAdjustmentRef can happen atomically
          if (order.clientId && pendingOrderAdjustments[order.clientId]) {
            track(
              AnalyticsEvents.TradingViewOrderModificationSuccess({ clientId: order.clientId })
            );
            removePendingOrderAdjustment(order.clientId);
          }
        }
      }
    });

    // remove chart lines that we don't see in the open orders array
    Object.entries(chartLinesRef.current)
      .filter(([_e, c]) => c.chartLineType === OrderSide.BUY || c.chartLineType === OrderSide.SELL)
      .filter(([key]) => !currentKeys.has(key))
      .forEach(([key, line]) => {
        line.line.remove();
        delete chartLinesRef.current[key];
      });
  }, [currentMarketOrders, stringGetter, tvWidget, setLineColorsAndFont, onMoveOrderLine]);

  const clearChartLines = useCallback(() => {
    Object.values(chartLinesRef.current).forEach(({ line }) => {
      line.remove();
    });
    chartLinesRef.current = {};
  }, []);

  const drawChartLines = useCallback(() => {
    if (orderLinesToggleOn && isAccountConnected) {
      updateOrderLines();
      updatePositionLines();
    } else {
      clearChartLines();
    }
  }, [
    updatePositionLines,
    updateOrderLines,
    clearChartLines,
    orderLinesToggleOn,
    isAccountConnected,
  ]);

  // Effects

  useEffect(
    // Update display button on toggle
    () => {
      runOnChartReady(() => {
        if (orderLinesToggleOn) {
          orderLineToggle?.classList.add(TOGGLE_ACTIVE_CLASS_NAME);
        } else {
          orderLineToggle?.classList.remove(TOGGLE_ACTIVE_CLASS_NAME);
        }
      });
    },
    [orderLinesToggleOn, orderLineToggle, runOnChartReady]
  );

  useEffect(
    () => {
      if (!tvWidget) return;

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
    },
    // We intentionally do not want the hook to re-run when lastMarket is updated since it is set in the subscribe condition; only the
    // subscribe condition OR else condition should run (otherwise the else will run before the subscribe, resulting in an incorrect tick size)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      initialWidget,
      tvWidget,
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

  return { chartLines: chartLinesRef.current };
};

const $WarningIcon = tw(Icon)`text-color-warning`;
