import { SubaccountOrder as SubaccountOrderNew } from '@/bonsai/types/summaryTypes';
import Abacus, { Nullable } from '@dydxprotocol/v4-abacus';
import { OrderExecution } from '@dydxprotocol/v4-client-js';
import { generateRandomClientId } from '@dydxprotocol/v4-client-js/build/src/lib/utils';
import { ERRORS_STRING_KEYS } from '@dydxprotocol/v4-localization';

import {
  AbacusOrderSide,
  AbacusOrderType,
  HumanReadableCancelOrderPayload,
  ParsingError,
  PlaceOrderMarketInfo,
} from '@/constants/abacus';
import {
  IndexerAPITimeInForce,
  IndexerOrderSide,
  IndexerOrderType,
} from '@/types/indexer/indexerApiGen';

import abacusStateManager from './abacus';
import { assertNever } from './assertNever';
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

const getMarketInfo = (marketId: string) => {
  const market = abacusStateManager.stateManager.state?.market(marketId);
  const v4Config = market?.configs?.v4;

  if (!v4Config) return null;

  return new PlaceOrderMarketInfo(
    v4Config.clobPairId,
    v4Config.atomicResolution,
    v4Config.stepBaseQuantums,
    v4Config.quantumConversionExponent,
    v4Config.subticksPerTick
  );
};

/* Copies an existing order into a PlaceOrder object */
export const createPlaceOrderPayloadFromExistingOrder = (
  order: SubaccountOrderNew,
  newPrice: number
) => {
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

  // subaccountNumber can be 0 -.-
  if (subaccountNumber === undefined || subaccountNumber === null) {
    return undefined;
  }

  const [orderPrice, orderTriggerPrice] = isLimitOrderTypeNew(order.type)
    ? [newPrice, triggerPrice?.toNumber()]
    : [price.toNumber(), newPrice];

  return new Abacus.exchange.dydx.abacus.state.manager.HumanReadablePlaceOrderPayload(
    subaccountNumber,
    marketId,
    generateRandomClientId().toString(),
    indexerToAbacusOrderType(type).rawValue,
    indexerToAbacusOrderSide(side).rawValue,
    orderPrice,
    orderTriggerPrice,
    size.toNumber(),
    null,
    reduceOnly,
    postOnly,
    timeInForce != null ? indexerToAbacusTimeInForce(timeInForce).rawValue : undefined,
    // TODO(tinaszheng) pass through `execution` once indexer field makes this available and we want to support TP Limit and Stop Limit orders
    isMarketOrderTypeNew(type) ? OrderExecution.IOC : null,
    // todo bonsai broke the goodtilblocktime by making it milliseconds
    goodTilBlockTimeSeconds && calculateGoodTilTimeInSeconds(goodTilBlockTimeSeconds),
    goodTilBlock,
    getMarketInfo(marketId)
  );
};

export function indexerToAbacusOrderType(
  orderType: IndexerOrderType
): Abacus.exchange.dydx.abacus.output.input.OrderType {
  switch (orderType) {
    case IndexerOrderType.MARKET:
      return AbacusOrderType.Market;
    case IndexerOrderType.LIMIT:
      return AbacusOrderType.Limit;
    case IndexerOrderType.STOPMARKET:
      return AbacusOrderType.StopMarket;
    case IndexerOrderType.STOPLIMIT:
      return AbacusOrderType.StopLimit;
    case IndexerOrderType.TRAILINGSTOP:
      return AbacusOrderType.TrailingStop;
    case IndexerOrderType.TAKEPROFIT:
      return AbacusOrderType.TakeProfitLimit;
    case IndexerOrderType.TAKEPROFITMARKET:
      return AbacusOrderType.TakeProfitMarket;
    default:
      assertNever(orderType);
      return AbacusOrderType.Market;
  }
}

export function indexerToAbacusOrderSide(
  side: IndexerOrderSide
): Abacus.exchange.dydx.abacus.output.input.OrderSide {
  switch (side) {
    case IndexerOrderSide.BUY:
      return AbacusOrderSide.Buy;
    case IndexerOrderSide.SELL:
      return AbacusOrderSide.Sell;
    default:
      assertNever(side);
      return AbacusOrderSide.Sell;
  }
}

export function indexerToAbacusTimeInForce(
  timeInForce: IndexerAPITimeInForce
): Abacus.exchange.dydx.abacus.output.input.OrderTimeInForce {
  switch (timeInForce) {
    case IndexerAPITimeInForce.GTT:
      return Abacus.exchange.dydx.abacus.output.input.OrderTimeInForce.GTT;
    case IndexerAPITimeInForce.IOC:
      return Abacus.exchange.dydx.abacus.output.input.OrderTimeInForce.IOC;
    case IndexerAPITimeInForce.FOK:
      return Abacus.exchange.dydx.abacus.output.input.OrderTimeInForce.IOC;
    default:
      assertNever(timeInForce);
      return Abacus.exchange.dydx.abacus.output.input.OrderTimeInForce.IOC;
  }
}

export const cancelOrderAsync = (
  orderId: string
): Promise<{
  success: boolean;
  parsingError: Nullable<ParsingError>;
  data: Nullable<HumanReadableCancelOrderPayload>;
}> => {
  return new Promise((resolve) => {
    abacusStateManager.cancelOrder(orderId, (success, parsingError, data) => {
      resolve({ success, parsingError, data });
    });
  });
};

export const isNewOrderPriceValid = (bookPrice: number, oldPrice: number, newPrice: number) => {
  // Ensure newPrice makes the order remain on the same side of the book
  return newPrice !== bookPrice && oldPrice - bookPrice > 0 === newPrice - bookPrice > 0;
};

export const getOrderModificationError = (
  order: SubaccountOrderNew,
  newPrice: number
): { title: string; body?: string } | null => {
  const bookPrice = abacusStateManager.stateManager.state?.marketOrderbook(
    order.marketId
  )?.midPrice;
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
