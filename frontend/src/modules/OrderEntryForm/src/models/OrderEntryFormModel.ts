export const ORDER_SIDES = ['long', 'short'] as const;
export type OrderSide = (typeof ORDER_SIDES)[number];

export interface OrderEntryFormModel {
  orderSide: OrderSide;
  collateralSize: string;
  positionSize: string;
  leverage: string;
}

export const nullOrderEntryForm: OrderEntryFormModel = {
  orderSide: 'long',
  positionSize: '',
  collateralSize: '',
  leverage: '10',
};
