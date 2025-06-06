import { PlaceOrderMarketInfo, PlaceOrderPayload } from '@/bonsai/forms/triggers/types';
import { BonsaiHelpers } from '@/bonsai/ontology';
import { SubaccountOrder as SubaccountOrderNew } from '@/bonsai/types/summaryTypes';
import { OrderExecution, OrderSide, OrderTimeInForce, OrderType } from '@dydxprotocol/v4-client-js';
import { ERRORS_STRING_KEYS } from '@dydxprotocol/v4-localization';

import { TransactionMemo } from '@/constants/analytics';
import {
  IndexerAPITimeInForce,
  IndexerOrderSide,
  IndexerOrderType,
} from '@/types/indexer/indexerApiGen';

import { store } from '@/state/_store';

import { assertNever } from './assertNever';
import { calc } from './do';
import { AttemptNumber, MAX_INT_ROUGHLY } from './numbers';
import {
  isLimitOrderTypeNew,
  isMarketOrderTypeNew,
  isSellOrderNew,
  isStopLossOrderNew,
  isTakeProfitOrderNew,
} from './orders';

const ORDER_TYPES_MODIFICATION_ENABLED = [
  IndexerOrderType.STOPMARKET,
  IndexerOrderType.TAKEPROFITMARKET,
  IndexerOrderType.LIMIT,
] as IndexerOrderType[];

export const canModifyOrderTypeFromChart = (order: SubaccountOrderNew) => {
  return ORDER_TYPES_MODIFICATION_ENABLED.includes(order.type);
};

// Inverse of calculateGoodTilBlockTime in v4-client
// https://github.com/dydxprotocol/v4-clients/blob/4227bd06a6f4503d863dcd99b3aba703cb94c40b/v4-client-js/src/clients/composite-client.ts#L253
const calculateGoodTilTimeInSeconds = (goodTilBlockTimeSeconds: number) => {
  const nowSeconds = Date.now() / 1000;
  return Math.round(goodTilBlockTimeSeconds - nowSeconds);
};

const getMarketInfo = (marketId: string): PlaceOrderMarketInfo | null => {
  const market = BonsaiHelpers.markets.selectMarketSummaryById(store.getState(), marketId);
  if (market == null) {
    return null;
  }
  const clobPairId = AttemptNumber(market.clobPairId);
  if (clobPairId == null) {
    return null;
  }
  const marketInfo: PlaceOrderMarketInfo = {
    clobPairId,
    atomicResolution: market.atomicResolution,
    stepBaseQuantums: market.stepBaseQuantums,
    quantumConversionExponent: market.quantumConversionExponent,
    subticksPerTick: market.subticksPerTick,
  };
  return marketInfo;
};

/* Copies an existing order into a PlaceOrder object */
export const createPlaceOrderPayloadFromExistingOrder = (
  order: SubaccountOrderNew,
  newPrice: number
): PlaceOrderPayload | undefined => {
  const {
    subaccountNumber,
    marketId,
    type,
    side,
    size,
    timeInForce,
    goodTilBlock,
    goodTilBlockTimeSeconds,
    postOnly,
    reduceOnly,
    price,
    triggerPrice,
  } = order;

  if (subaccountNumber == null || subaccountNumber == null) {
    return undefined;
  }

  const marketInfo = getMarketInfo(marketId);
  if (marketInfo == null) {
    return undefined;
  }

  const [orderPrice, orderTriggerPrice] = isLimitOrderTypeNew(order.type)
    ? [newPrice, triggerPrice?.toNumber()]
    : [price.toNumber(), newPrice];

  return {
    subaccountNumber,
    marketId,
    clobPairId: marketInfo.clobPairId,
    clientId: Math.floor(Math.random() * MAX_INT_ROUGHLY),
    type: calc(() => {
      switch (type) {
        case IndexerOrderType.MARKET:
          return OrderType.MARKET;
        case IndexerOrderType.LIMIT:
          return OrderType.LIMIT;
        case IndexerOrderType.STOPLIMIT:
          return OrderType.STOP_LIMIT;
        case IndexerOrderType.STOPMARKET:
          return OrderType.STOP_MARKET;
        case IndexerOrderType.TAKEPROFIT:
          return OrderType.TAKE_PROFIT_LIMIT;
        case IndexerOrderType.TAKEPROFITMARKET:
          return OrderType.TAKE_PROFIT_MARKET;
        case IndexerOrderType.TRAILINGSTOP:
          // we don't support this anymore
          return OrderType.MARKET;
        default:
          assertNever(type);
          return OrderType.MARKET;
      }
    }),
    side: side === IndexerOrderSide.BUY ? OrderSide.BUY : OrderSide.SELL,
    price: orderPrice,
    triggerPrice: orderTriggerPrice,
    size: size.toNumber(),
    reduceOnly,
    postOnly,
    timeInForce: calc(() => {
      // Return undefined if timeInForce is null
      if (timeInForce == null) {
        return undefined;
      }
      // Convert based on timeInForce value
      if (timeInForce === IndexerAPITimeInForce.GTT) {
        return OrderTimeInForce.GTT;
      }
      if (timeInForce === IndexerAPITimeInForce.IOC) {
        return OrderTimeInForce.IOC;
      }
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (timeInForce === IndexerAPITimeInForce.FOK) {
        // not supported anymore
        return undefined;
      }

      assertNever(timeInForce);
      return undefined;
    }),
    // TODO(tinaszheng) pass through `execution` once indexer field makes this available and we want to support TP Limit and Stop Limit orders
    execution: isMarketOrderTypeNew(type) ? OrderExecution.IOC : undefined,
    // todo bonsai broke the goodtilblocktime by making it milliseconds
    goodTilTimeInSeconds:
      goodTilBlockTimeSeconds && calculateGoodTilTimeInSeconds(goodTilBlockTimeSeconds),
    goodTilBlock,
    marketInfo,
    currentHeight: undefined,
    memo: TransactionMemo.placeOrder,
    transferToSubaccountAmount: undefined,
  };
};

const isNewOrderPriceValid = (bookPrice: number, oldPrice: number, newPrice: number) => {
  // Ensure newPrice makes the order remain on the same side of the book
  return newPrice !== bookPrice && oldPrice - bookPrice > 0 === newPrice - bookPrice > 0;
};

export const getOrderModificationError = (
  order: SubaccountOrderNew,
  newPrice: number
): { title: string; body?: string } | null => {
  const bookPrice = BonsaiHelpers.currentMarket.midPrice.data(store.getState())?.toNumber();
  if (!bookPrice) return null;

  const oldPrice = order.triggerPrice ?? order.price;
  if (isNewOrderPriceValid(bookPrice, oldPrice.toNumber(), newPrice)) return null;

  if (order.type === IndexerOrderType.LIMIT) {
    return {
      title: ERRORS_STRING_KEYS.ORDER_MODIFICATION_ERROR_LIMIT_PRICE_CROSS,
      body: ERRORS_STRING_KEYS.ORDER_MODIFICATION_ERROR_USE_TRADE_FORM,
    };
  }

  const isSell = isSellOrderNew(order);

  if (isStopLossOrderNew(order, false)) {
    return isSell
      ? { title: ERRORS_STRING_KEYS.ORDER_MODIFICATION_ERROR_SL_PRICE_LOWER }
      : { title: ERRORS_STRING_KEYS.ORDER_MODIFICATION_ERROR_SL_PRICE_HIGHER };
  }

  if (isTakeProfitOrderNew(order, false)) {
    return isSell
      ? { title: ERRORS_STRING_KEYS.ORDER_MODIFICATION_ERROR_TP_PRICE_HIGHER }
      : { title: ERRORS_STRING_KEYS.ORDER_MODIFICATION_ERROR_TP_PRICE_LOWER };
  }

  return null;
};
