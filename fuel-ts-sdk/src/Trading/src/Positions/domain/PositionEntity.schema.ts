import { zodDecimalValueSchema } from '@sdk/shared/lib/zod';
import * as Decimals from '@sdk/shared/models/decimals';
import {
  AddressSchema,
  AssetIdSchema,
  PositionRevisionIdSchema,
  PositionStableIdSchema,
} from '@sdk/shared/types';
import { z } from 'zod';
import type { PositionEntity } from './PositionsEntity';
import { PositionChange, PositionSide } from './PositionsEntity';
import * as pd from './positionsDecimals';

const PositionSizeSchema = zodDecimalValueSchema(pd.PositionSize);
const CollateralAmountSchema = zodDecimalValueSchema(Decimals.CollateralAmount);
const OraclePriceSchema = zodDecimalValueSchema(Decimals.OraclePrice);

export const PositionSchema = z.object({
  revisionId: PositionRevisionIdSchema,
  stableId: PositionStableIdSchema,
  side: z.nativeEnum(PositionSide),
  assetId: AssetIdSchema,
  accountAddress: AddressSchema,

  // event-level
  isLatest: z.boolean(),
  change: z.nativeEnum(PositionChange),
  collateralDelta: CollateralAmountSchema,
  sizeDelta: PositionSizeSchema,
  pnlDelta: CollateralAmountSchema, // TODO: verify decimal precision
  outLiquidityFee: CollateralAmountSchema, // TODO: verify decimal precision
  outProtocolFee: CollateralAmountSchema, // TODO: verify decimal precision
  outLiquidationFee: CollateralAmountSchema, // TODO: verify decimal precision
  timestamp: z.number().int(),

  // running totals
  size: PositionSizeSchema,
  collateral: CollateralAmountSchema,
  realizedPnl: CollateralAmountSchema, // TODO: verify decimal precision
  entryPrice: OraclePriceSchema,
}) satisfies z.ZodType<PositionEntity, z.ZodTypeDef, unknown>;
