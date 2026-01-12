import z from 'zod';
import type { OrderEntryFormMetaContextType } from '../contexts';
import { ORDER_SIDES } from './order-entry-form.model';

const MIN_LEVERAGE = 0.1;
const MAX_LEVERAGE = 100;

const numericString = z.string().regex(/^\d*\.?\d*$/, 'Must be a valid number');

const parseDecimal = (value: string): number => {
  if (!value || value === '') return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

const isPositiveNumber = (value: string): boolean => {
  const num = parseDecimal(value);
  return num > 0;
};

export const createOrderEntryFormSchema = (context: OrderEntryFormMetaContextType) => {
  return z
    .object({
      orderSide: z.enum(ORDER_SIDES),
      positionSize: numericString.min(1, 'Position size is required'),
      collateralSize: numericString.min(1, 'Collateral is required'),
      leverage: numericString.min(1, 'Leverage is required'),
    })
    .superRefine(function validatePositiveValues(data, ctx) {
      if (!isPositiveNumber(data.positionSize)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['positionSize'],
          message: 'Position size must be greater than 0',
        });
      }

      if (!isPositiveNumber(data.collateralSize)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['collateralSize'],
          message: 'Collateral must be greater than 0',
        });
      }

      if (!isPositiveNumber(data.leverage)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['leverage'],
          message: 'Leverage must be greater than 0',
        });
      }
    })
    .superRefine(function validateLeverageRange(data, ctx) {
      const leverage = parseDecimal(data.leverage);
      if (leverage === 0) return;

      if (leverage < MIN_LEVERAGE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['leverage'],
          message: `Leverage must be at least ${MIN_LEVERAGE}x`,
        });
      }

      if (leverage > MAX_LEVERAGE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['leverage'],
          message: `Leverage cannot exceed ${MAX_LEVERAGE}x`,
        });
      }
    })
    .superRefine(function validateMarketMaxLeverage(data, ctx) {
      if (!context.maxLeverage) return;

      const leverage = parseDecimal(data.leverage);
      if (leverage === 0) return;

      if (leverage > context.maxLeverage) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['leverage'],
          message: `Maximum leverage for this market is ${context.maxLeverage}x`,
        });
      }
    })
    .superRefine(function validateInitialMarginFraction(data, ctx) {
      if (!context.initialMarginFraction) return;

      const leverage = parseDecimal(data.leverage);
      if (leverage === 0) return;

      const maxAllowedLeverage = 1 / context.initialMarginFraction;

      if (leverage > maxAllowedLeverage) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['leverage'],
          message: `Leverage cannot exceed ${maxAllowedLeverage.toFixed(1)}x based on margin requirements`,
        });
      }
    })
    .superRefine(function validateUserBalance(data, ctx) {
      const collateral = parseDecimal(data.collateralSize);
      if (collateral === 0) return;

      if (collateral > context.userBalanceInBaseAsset) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['collateralSize'],
          message: 'Insufficient balance',
        });
      }
    })
    .superRefine(function validateMinCollateral(data, ctx) {
      if (!context.minCollateral) return;

      const collateral = parseDecimal(data.collateralSize);
      if (collateral === 0) return;

      if (collateral < context.minCollateral) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['collateralSize'],
          message: `Minimum collateral is ${context.minCollateral}`,
        });
      }
    })
    .superRefine(function validateMinPositionSize(data, ctx) {
      if (!context.minPositionSize) return;

      const position = parseDecimal(data.positionSize);
      if (position === 0) return;

      if (position < context.minPositionSize) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['positionSize'],
          message: `Minimum position size is ${context.minPositionSize} ${context.quoteAssetName}`,
        });
      }
    })
    .superRefine(function validateMaxPositionSize(data, ctx) {
      if (!context.maxPositionSize) return;

      const position = parseDecimal(data.positionSize);
      if (position === 0) return;

      if (position > context.maxPositionSize) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['positionSize'],
          message: `Maximum position size is ${context.maxPositionSize} ${context.quoteAssetName}`,
        });
      }
    });
};
