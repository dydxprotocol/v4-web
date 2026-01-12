import z from 'zod';
import { ORDER_SIDES } from './order-entry-form.model';

// ============================================================================
// Atomic Validation Rules
// ============================================================================

const numericString = z.string().regex(/^\d*\.?\d*$/, 'Must be a valid number');

// Validation helpers - currently commented out, will be re-enabled later
// const parseUsdValue = (value: string): UsdValue => {
//   if (!value || value === '') return UsdValue.fromFloat(0);
//   return UsdValue.fromDecimalString(value);
// };

// const parseDecimal = (value: string): number => {
//   if (!value || value === '') return 0;
//   const parsed = parseFloat(value);
//   return isNaN(parsed) ? 0 : parsed;
// };

// const isPositive = (value: string): boolean => {
//   const usdValue = parseUsdValue(value);
//   return usdValue.value > 0n;
// };

// const isLeverageValid = (leverage: string): boolean => {
//   const lev = parseDecimal(leverage);
//   return lev >= 0.1 && lev <= 100;
// };

// const hasRequiredCollateral = (collateral: string, userBalance: number): boolean => {
//   const collateralValue = parseUsdValue(collateral);
//   const userBalanceValue = UsdValue.fromFloat(userBalance);
//   return collateralValue.value <= userBalanceValue.value;
// };

// const calculateRequiredMargin = (positionSizeUsd: string, leverage: string): UsdValue => {
//   const notional = parseUsdValue(positionSizeUsd);
//   const lev = parseDecimal(leverage);
//   if (lev === 0) return UsdValue.fromFloat(Number.POSITIVE_INFINITY);
//
//   return DecimalCalculator.value(notional).divideBy(UsdValue.fromFloat(lev)).calculate(UsdValue);
// };

// ============================================================================
// Main Schema Factory
// ============================================================================

export const createOrderEntryFormSchema = () => {
  return z.object({
    orderSide: z.enum(ORDER_SIDES),
    positionSize: numericString.min(1, 'Position size is required'),
    collateralSize: numericString,
    leverage: numericString.min(1, 'Leverage is required'),
  });
  // .superRefine(function validateLeverage(data, ctx) {
  //   if (!data.leverage) {
  //     return ctx.addIssue({
  //       code: z.ZodIssueCode.custom,
  //       path: ['leverage'],
  //       message: 'Leverage is required',
  //     });
  //   }

  //   if (!isLeverageValid(data.leverage)) {
  //     return ctx.addIssue({
  //       code: z.ZodIssueCode.custom,
  //       path: ['leverage'],
  //       message: 'Leverage must be between 0.1x and 100x',
  //     });
  //   }

  //   if (context.maxLeverage && parseDecimal(data.leverage) > context.maxLeverage) {
  //     return ctx.addIssue({
  //       code: z.ZodIssueCode.custom,
  //       path: ['leverage'],
  //       message: `Maximum leverage for this market is ${context.maxLeverage}x`,
  //     });
  //   }
  // })
  // .superRefine(function validateCollateralSize(data, ctx) {
  //   if (!data.collateralSize) {
  //     return ctx.addIssue({
  //       code: z.ZodIssueCode.custom,
  //       path: ['collateralSize'],
  //       message: 'Collateral is required',
  //     });
  //   }

  //   if (!isPositive(data.collateralSize)) {
  //     return ctx.addIssue({
  //       code: z.ZodIssueCode.custom,
  //       path: ['collateralSize'],
  //       message: 'Collateral must be greater than 0',
  //     });
  //   }

  //   if (!hasRequiredCollateral(data.collateralSize, context.userBalanceInBaseAsset)) {
  //     return ctx.addIssue({
  //       code: z.ZodIssueCode.custom,
  //       path: ['collateralSize'],
  //       message: 'Insufficient collateral balance',
  //     });
  //   }

  //   if (context.minCollateral) {
  //     const collateral = parseUsdValue(data.collateralSize);
  //     const minCollateral = UsdValue.fromFloat(context.minCollateral);
  //     if (collateral.value < minCollateral.value) {
  //       return ctx.addIssue({
  //         code: z.ZodIssueCode.custom,
  //         path: ['collateralSize'],
  //         message: `Minimum collateral is ${context.minCollateral} USDC`,
  //       });
  //     }
  //   }
  // })
  // .superRefine(function validatePositionSize(data, ctx) {
  //   if (!data.positionSize) {
  //     return ctx.addIssue({
  //       code: z.ZodIssueCode.custom,
  //       path: ['positionSize'],
  //       message: 'Position size is required',
  //     });
  //   }

  //   if (!isPositive(data.positionSize)) {
  //     return ctx.addIssue({
  //       code: z.ZodIssueCode.custom,
  //       path: ['positionSize'],
  //       message: 'Position size must be greater than 0',
  //     });
  //   }

  //   if (context.minPositionSize) {
  //     const position = parseUsdValue(data.positionSize);
  //     const minPosition = UsdValue.fromFloat(context.minPositionSize);
  //     if (position.value < minPosition.value) {
  //       return ctx.addIssue({
  //         code: z.ZodIssueCode.custom,
  //         path: ['positionSize'],
  //         message: `Minimum position size is ${context.minPositionSize} ${context.quoteAssetName}`,
  //       });
  //     }
  //   }

  //   if (context.maxPositionSize) {
  //     const position = parseUsdValue(data.positionSize);
  //     const maxPosition = UsdValue.fromFloat(context.maxPositionSize);
  //     if (position.value > maxPosition.value) {
  //       return ctx.addIssue({
  //         code: z.ZodIssueCode.custom,
  //         path: ['positionSize'],
  //         message: `Maximum position size is ${context.maxPositionSize} ${context.quoteAssetName}`,
  //       });
  //     }
  //   }
  // })
  // .superRefine(function validateMarginSufficiency(data, ctx) {
  //   if (!data.positionSize || !data.collateralSize || !data.leverage) return;

  //   const positionSize = parseUsdValue(data.positionSize);
  //   const collateral = parseUsdValue(data.collateralSize);
  //   const leverage = parseDecimal(data.leverage);

  //   if (positionSize.value <= 0n || collateral.value <= 0n || leverage <= 0) return;

  //   const requiredMargin = calculateRequiredMargin(data.positionSize, data.leverage);

  //   const baseAssetPrice = UsdValue.fromFloat(context.currentBaseAssetPrice.value);
  //   const collateralValue = DecimalCalculator.value(collateral)
  //     .multiplyBy(baseAssetPrice)
  //     .calculate(UsdValue);

  //   if (collateralValue.value < requiredMargin.value) {
  //     const shortfall = DecimalCalculator.value(requiredMargin)
  //       .subtractBy(collateralValue)
  //       .divideBy(baseAssetPrice)
  //       .calculate(UsdValue);

  //     return ctx.addIssue({
  //       code: z.ZodIssueCode.custom,
  //       path: ['collateralSize'],
  //       message: `Insufficient margin. Need ${shortfall.toDecimalString()} more USDC`,
  //     });
  //   }

  //   const expectedPositionValue = DecimalCalculator.value(collateralValue)
  //     .multiplyBy(UsdValue.fromFloat(leverage))
  //     .calculate(UsdValue);

  //   const actualPositionValue = positionSize;
  //   const tolerance = UsdValue.fromFloat(0.01);

  //   const diff = DecimalCalculator.value(expectedPositionValue)
  //     .subtractBy(actualPositionValue)
  //     .calculate(UsdValue);

  //   const absDiff = diff.value < 0n ? -diff.value : diff.value;

  //   const deviationRatio = DecimalCalculator.value(UsdValue.fromBigInt(absDiff))
  //     .divideBy(expectedPositionValue)
  //     .calculate(UsdValue);

  //   if (deviationRatio.value > tolerance.value) {
  //     return ctx.addIssue({
  //       code: z.ZodIssueCode.custom,
  //       path: ['positionSize'],
  //       message: 'Position size does not match collateral and leverage',
  //     });
  //   }
  // })
  // .superRefine(function validateLeverageVsInitialMargin(data, ctx) {
  //   if (!data.leverage || !context.initialMarginFraction) return;

  //   const leverage = parseDecimal(data.leverage);
  //   const maxAllowedLeverage = 1 / context.initialMarginFraction;

  //   if (leverage > maxAllowedLeverage) {
  //     ctx.addIssue({
  //       code: z.ZodIssueCode.custom,
  //       path: ['leverage'],
  //       message: `Leverage cannot exceed ${maxAllowedLeverage.toFixed(1)}x based on margin requirements`,
  //     });
  //   }
  // }) satisfies ZodType<OrderEntryFormModel>;
};
