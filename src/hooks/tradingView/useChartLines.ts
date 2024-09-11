import { useCallback, useEffect, useRef, useState } from 'react';

import { IOrderLineAdapter } from 'public/tradingview/charting_library';
import { shallowEqual } from 'react-redux';

import {
  AbacusOrderType,
  HumanReadablePlaceOrderPayload,
  ORDER_SIDES,
  SubaccountOrder,
} from '@/constants/abacus';
import { TOGGLE_ACTIVE_CLASS_NAME } from '@/constants/charts';
import { DEFAULT_SOMETHING_WENT_WRONG_ERROR_PARAMS } from '@/constants/errors';
import { STRING_KEYS } from '@/constants/localization';
import { StatSigFlags } from '@/constants/statsig';
import { ORDER_TYPE_STRINGS, TradeTypes, type OrderType } from '@/constants/trade';
import type { ChartLine, PositionLineType, TvWidget } from '@/constants/tvchart';

import {
  cancelOrderConfirmed,
  cancelOrderFailed,
  cancelOrderSubmitted,
  placeOrderFailed,
  placeOrderSubmitted,
  setLatestOrder,
} from '@/state/account';
import {
  getCurrentMarketOrders,
  getCurrentMarketPositionData,
  getIsAccountConnected,
} from '@/state/accountSelectors';
import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { getAppColorMode, getAppTheme } from '@/state/configsSelectors';
import { getCurrentMarketId } from '@/state/perpetualsSelectors';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';
import {
  cancelOrderAsync,
  createPlaceOrderPayloadFromExistingOrder,
} from '@/lib/orderModification';
import { isOrderStatusOpen } from '@/lib/orders';
import { getChartLineColors } from '@/lib/tradingView/utils';

import { useStatsigGateValue } from '../useStatsig';
import { useStringGetter } from '../useStringGetter';

const CHART_LINE_FONT = 'bold 10px Satoshi';
const ORDER_TYPES_MODIFICATION_ENABLED = [
  AbacusOrderType.StopMarket.ordinal,
  AbacusOrderType.TakeProfitMarket.ordinal,
  AbacusOrderType.Limit.ordinal,
] as number[];

const canModifyOrderTypeFromChart = (order: SubaccountOrder) => {
  return ORDER_TYPES_MODIFICATION_ENABLED.includes(order.type.ordinal);
};

/**
 * @description Hook to handle drawing chart lines
 */

export const useChartLines = ({
  tvWidget,
  orderLineToggle,
  isChartReady,
  orderLinesToggleOn,
}: {
  tvWidget: TvWidget | null;
  orderLineToggle: HTMLElement | null;
  isChartReady: boolean;
  orderLinesToggleOn: boolean;
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

  const canModifyOrdersFromChart = useStatsigGateValue(StatSigFlags.ffOrderModificationFromChart);

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

  // Cache for order modification that stores the new orders that are submitted but not yet placed
  const pendingOrderAdjustmentsRef = useRef<{
    [clientId: string]: { orderPayload: HumanReadablePlaceOrderPayload; oldOrderId: string };
  }>({});

  const removePendingOrderAdjustment = (clientId: number) => {
    const { [clientId]: removed, ...withoutOrderId } = pendingOrderAdjustmentsRef.current;
    pendingOrderAdjustmentsRef.current = withoutOrderId;
  };

  const addPendingOrderAdjustment = (
    orderPayload: HumanReadablePlaceOrderPayload,
    oldOrderId: string
  ) => {
    pendingOrderAdjustmentsRef.current = {
      ...pendingOrderAdjustmentsRef.current,
      [orderPayload.clientId]: { orderPayload, oldOrderId },
    };
  };

  const dispatch = useAppDispatch();

  const onMoveOrderLine = useCallback(
    async (order: SubaccountOrder, orderLine?: IOrderLineAdapter) => {
      if (!orderLine || !canModifyOrderTypeFromChart(order)) return;

      const oldPrice = order.triggerPrice ?? order.price;
      const newPrice = orderLine.getPrice();

      // TODO(tinaszheng): do validation here for new price
      // make sure the newPrice doesnt cross over the current price depending
      // on the direction of the trade

      orderLine.setPrice(newPrice);
      // Don't go through abacus for limit order modifications to avoid having to override any trade inputs in the Trade Form
      const orderPayload = createPlaceOrderPayloadFromExistingOrder(order, newPrice);
      if (!orderPayload) {
        orderLine.setPrice(oldPrice);
        return;
      }

      addPendingOrderAdjustment(orderPayload, order.id);

      // Dispatch both actions here so that the user sees both cancel + submitting notifications together
      dispatch(cancelOrderSubmitted(order.id));
      dispatch(
        placeOrderSubmitted({
          marketId: orderPayload.marketId,
          clientId: orderPayload.clientId,
          orderType: orderPayload.type as TradeTypes,
        })
      );

      const { success: cancelSuccess } = await cancelOrderAsync(order.id);
      if (!cancelSuccess) {
        dispatch(
          cancelOrderFailed({
            orderId: order.id,
            errorParams: DEFAULT_SOMETHING_WENT_WRONG_ERROR_PARAMS,
          })
        );
        dispatch(
          placeOrderFailed({
            clientId: orderPayload.clientId,
            errorParams: DEFAULT_SOMETHING_WENT_WRONG_ERROR_PARAMS,
          })
        );
        orderLine.setPrice(oldPrice);
        removePendingOrderAdjustment(orderPayload.clientId);
        return;
      }

      dispatch(cancelOrderConfirmed(order.id));

      const res = await abacusStateManager.chainTransactions.placeOrderTransaction(orderPayload);
      const { error } = JSON.parse(res);
      if (error) {
        orderLine.remove();
        removePendingOrderAdjustment(orderPayload.clientId);
        dispatch(
          placeOrderFailed({
            clientId: orderPayload.clientId,
            errorParams: DEFAULT_SOMETHING_WENT_WRONG_ERROR_PARAMS,
          })
        );
      }
    },
    [dispatch]
  );

  const updateOrderLines = useCallback(() => {
    const pendingOrderAdjustments = pendingOrderAdjustmentsRef.current;
    // We don't need to worry about clearing chart lines for cancelled market orders since they will persist in
    // currentMarketOrders, just with a cancelReason
    if (!currentMarketOrders) {
      return;
    }

    currentMarketOrders.forEach((order) => {
      const { id, type, status, side, cancelReason, size, triggerPrice, price, trailingPercent } =
        order;
      const key = id;
      const quantity = size.toString();

      const orderType = type.rawValue as OrderType;
      const orderLabel = stringGetter({
        key: ORDER_TYPE_STRINGS[orderType].orderTypeKey,
      });
      const orderString = trailingPercent ? `${orderLabel} ${trailingPercent}%` : orderLabel;

      const pendingReplacementOrder = Object.values(pendingOrderAdjustments).find(
        (adjustment) => adjustment.oldOrderId === order.id
      );
      const replacementOrderPlaced = !!currentMarketOrders.find(
        (o) => o.clientId === pendingReplacementOrder?.orderPayload.clientId
      );

      // For orders that are modified on the chart, keep showing the canceled order (with the new price) until the new order is successfully placed
      const shouldShow =
        (!!pendingReplacementOrder && !replacementOrderPlaced) ||
        (!cancelReason && isOrderStatusOpen(status));

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
            setLineColorsAndFont({ chartLine });
            chartLinesRef.current[key] = chartLine;
          }
          if (canModifyOrdersFromChart && canModifyOrderTypeFromChart(order)) {
            orderLine?.onMove(() => onMoveOrderLine(order, orderLine));
          }

          // Update pendingOrderAdjustmentRef here instead of a separate useEffect so that
          // adding the new chart line and removing from pendingOrderAdjustmentRef can happen atomically
          if (order.clientId && pendingOrderAdjustments[order.clientId]) {
            removePendingOrderAdjustment(order.clientId);
            dispatch(setLatestOrder(order));
          }
        }
      }
    });
  }, [
    currentMarketOrders,
    stringGetter,
    tvWidget,
    canModifyOrdersFromChart,
    setLineColorsAndFont,
    onMoveOrderLine,
    dispatch,
  ]);

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

  useEffect(
    // Update display button on toggle
    () => {
      if (isChartReady) {
        runOnChartReady(() => {
          if (orderLinesToggleOn) {
            orderLineToggle?.classList?.add(TOGGLE_ACTIVE_CLASS_NAME);
          } else {
            orderLineToggle?.classList?.remove(TOGGLE_ACTIVE_CLASS_NAME);
          }
        });
      }
    },
    [orderLinesToggleOn, orderLineToggle, runOnChartReady, isChartReady]
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

  useEffect(
    () => {
      if (initialWidget && !isChartReady) {
        // Clear lines when chart switches to not ready after initialization (i.e. when orderbookCandles is toggled)
        clearChartLines();
      } else if (!isAccountConnected) {
        // Clear lines when disconnecting account
        clearChartLines();
      }
    },
    // We intentionally avoid rerunning this hook on update of initialWidget
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isChartReady, clearChartLines, isAccountConnected]
  );

  useEffect(() => {
    // Clear lines when switching markets
    return () => clearChartLines();
  }, [currentMarketId, clearChartLines]);

  return { chartLines: chartLinesRef.current };
};
