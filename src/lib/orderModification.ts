import Abacus, { Nullable } from '@dydxprotocol/v4-abacus';
import { OrderExecution } from '@dydxprotocol/v4-client-js';
import { generateRandomClientId } from '@dydxprotocol/v4-client-js/build/src/lib/utils';

import { HumanReadableCancelOrderPayload, ParsingError, SubaccountOrder } from '@/constants/abacus';

import abacusStateManager from './abacus';
import { isLimitOrderType, isMarketOrderType } from './orders';

// Inverse of calculateGoodTilBlockTime in v4-client
// https://github.com/dydxprotocol/v4-clients/blob/4227bd06a6f4503d863dcd99b3aba703cb94c40b/v4-client-js/src/clients/composite-client.ts#L253
const calculateGoodTilTimeInSeconds = (goodTilBlockTime: number) => {
  const futureMs = goodTilBlockTime * 1000;
  const nowMs = Date.now();
  return Math.round((futureMs - nowMs) / 1000);
};

const getMarketInfo = (marketId: string) => {
  const market = abacusStateManager.stateManager.state?.market(marketId);
  const v4Config = market?.configs?.v4;

  if (!v4Config) return null;

  return new Abacus.exchange.dydx.abacus.state.manager.PlaceOrderMarketInfo(
    v4Config.clobPairId,
    v4Config.atomicResolution,
    v4Config.stepBaseQuantums,
    v4Config.quantumConversionExponent,
    v4Config.subticksPerTick
  );
};

/* Copies an existing order into a PlaceOrder object */
export const createPlaceOrderPayloadFromExistingOrder = (
  order: SubaccountOrder,
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
    goodTilBlockTime,
    postOnly,
    reduceOnly,
    price,
    triggerPrice,
  } = order;

  // subaccountNumber can be 0 -.-
  if (subaccountNumber === undefined || subaccountNumber === null) {
    return undefined;
  }

  const [orderPrice, orderTriggerPrice] = isLimitOrderType(order.type)
    ? [newPrice, triggerPrice]
    : [price, newPrice];

  return new Abacus.exchange.dydx.abacus.state.manager.HumanReadablePlaceOrderPayload(
    subaccountNumber,
    marketId,
    // There's a problem with Abacus parsing client IDs that are full 32 bytes so dividing by 2 ensures that all
    // client IDs generated here are < 32 bytes
    // TODO: fix this in abacus
    Math.floor(generateRandomClientId() / 2),
    type.rawValue,
    side.rawValue,
    orderPrice,
    orderTriggerPrice,
    size,
    null,
    reduceOnly,
    postOnly,
    timeInForce?.rawValue,
    // TODO(tinaszheng) pass through `execution` once indexer field makes this available and we want to support TP Limit and Stop Limit orders
    isMarketOrderType(type) ? OrderExecution.IOC : null,
    goodTilBlockTime && calculateGoodTilTimeInSeconds(goodTilBlockTime),
    goodTilBlock,
    getMarketInfo(marketId)
  );
};

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
