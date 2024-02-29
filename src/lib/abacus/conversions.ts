import { OrderSide } from '@dydxprotocol/v4-client-js';

import {
  AbacusOrderSide,
  type Nullable,
  type AbacusOrderSides,
  AbacusPositionSide,
  AbacusPositionSides,
} from '@/constants/abacus';
import { PositionSide } from '@/constants/trade';

/** @deprecated use ORDER_SIDES from constants/abacus */
export const convertAbacusOrderSide = (abacusOrderSide: Nullable<AbacusOrderSides>) => {
  switch (abacusOrderSide) {
    case AbacusOrderSide.buy:
      return OrderSide.BUY;
    case AbacusOrderSide.sell:
      return OrderSide.SELL;
    default:
      return null;
  }
};

/** @deprecated use POSITION_SIDES from constants/abacus */
export const convertAbacusPositionSide = (abacusPositionSide: Nullable<AbacusPositionSides>) => {
  switch (abacusPositionSide) {
    case AbacusPositionSide.LONG:
      return PositionSide.Long;
    case AbacusPositionSide.SHORT:
      return PositionSide.Short;
    case AbacusPositionSide.NONE:
      return PositionSide.None;
    default:
      return null;
  }
};
