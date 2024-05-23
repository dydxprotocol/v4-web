import { OrderSide } from '@dydxprotocol/v4-client-js';

import { AbacusOrderSide, type AbacusOrderSides, type Nullable } from '@/constants/abacus';

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
