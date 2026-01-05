export const ORDER_MODES = ['regular', 'stops'] as const;
export type OrderMode = (typeof ORDER_MODES)[number];

export const ORDER_EXECUTION_TYPES = ['market', 'limit'] as const;
export type OrderExecutionType = (typeof ORDER_EXECUTION_TYPES)[number];

export const ORDER_SIDES = ['buy', 'sell'] as const;
export type OrderSide = (typeof ORDER_SIDES)[number];

export interface OrderEntryFormModel {
  orderMode: OrderMode;
  orderExecutionType: OrderExecutionType;
  orderSide: OrderSide;
  triggerPrice: string;
  price: string;
  positionSize: string;
}

export const nullOrderEntryForm: OrderEntryFormModel = {
  orderMode: 'regular',
  orderExecutionType: 'market',
  orderSide: 'buy',
  positionSize: '',
  price: '',
  triggerPrice: '',
};
