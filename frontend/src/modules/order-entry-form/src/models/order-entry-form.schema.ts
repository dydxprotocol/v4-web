import z, { type ZodType } from 'zod';
import type { OrderEntryFormMetaContextType } from '../contexts';
import {
  ORDER_EXECUTION_TYPES,
  ORDER_MODES,
  ORDER_SIDES,
  type OrderEntryFormModel,
} from './order-entry-form.model';

export const createOrderEntryFormSchema = (context: OrderEntryFormMetaContextType) => {
  const numericString = z.string().regex(/^\d*\.?\d*$/, 'Must be a valid number');

  return z
    .object({
      orderMode: z.enum(ORDER_MODES),
      orderExecutionType: z.enum(ORDER_EXECUTION_TYPES),
      orderSide: z.enum(ORDER_SIDES),
      triggerPrice: numericString,
      price: numericString,
      positionSize: numericString.min(1, 'Size is required'),
    })
    .superRefine(function validateSize(data, ctx) {
      if (!data.positionSize)
        return ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['positionSize'],
          message: 'Size is required',
        });
      if (toNumber(data.positionSize) === 0)
        return ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['positionSize'],
          message: 'Size must be greater than 0',
        });
    })
    .superRefine(function validatePrice(data, ctx) {
      if (data.orderExecutionType !== 'limit') return;

      if (!data.price)
        return ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['price'],
          message: 'Price is required for limit orders',
        });

      if (toNumber(data.price) === 0)
        return ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['price'],
          message: 'Price must be greater than 0',
        });
    })
    .superRefine(function validateTriggerPrice(data, ctx) {
      const triggerPrice = toNumber(data.triggerPrice);

      if (data.orderMode !== 'stops') return;

      if (!data.triggerPrice)
        return ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['triggerPrice'],
          message: 'Trigger price is required for stops orders',
        });

      if (data.orderSide === 'buy' && triggerPrice < context.currentQuoteAssetPrice)
        return ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['triggerPrice'],
          message: `Trigger price must be higher than ${context.currentQuoteAssetPrice} ${context.quoteAssetName}.`,
        });

      if (data.orderSide === 'sell' && triggerPrice > context.currentQuoteAssetPrice)
        return ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['triggerPrice'],
          message: `Trigger price must be lower than ${context.currentQuoteAssetPrice} ${context.quoteAssetName}.`,
        });
    })
    .superRefine(function validateFinalOrderBalanceForBuy(data, ctx) {
      if (data.orderSide !== 'buy') return;

      const size = toNumber(data.positionSize);
      const proposedPrice = toNumber(data.price);

      const targetPrice =
        data.orderExecutionType === 'limit' && proposedPrice > 0
          ? proposedPrice
          : context.currentQuoteAssetPrice;

      const userBalance = context.userBalanceInQuoteAsset;
      const requiredBalance = targetPrice * size;
      if (requiredBalance > userBalance) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['positionSize'],
          message: 'Insufficient balance',
        });
      }
    })
    .superRefine(function validateFinalOrderBalanceForSell(data, ctx) {
      if (data.orderSide !== 'sell') return;

      const size = toNumber(data.positionSize);
      if (size > context.userBalanceInBaseAsset) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['positionSize'],
          message: 'Insufficient balance',
        });
      }
    }) satisfies ZodType<OrderEntryFormModel>;
};

function toNumber(input: string): number {
  const num = parseFloat(input);
  return isNaN(num) ? -1 : num;
}
