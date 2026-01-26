import { PositionChange } from '@sdk/generated/graphql';
import { zodDecimalValueSchema } from '@sdk/shared/lib/zod';
import * as Decimals from '@sdk/shared/models/decimals';
import {
  AddressSchema,
  AssetIdSchema,
  PositionRevisionIdSchema,
  PositionStableIdSchema,
} from '@sdk/shared/types';
import { z } from 'zod';
import type { PositionEntity, PositionKeyEntity } from './PositionsEntity';
import * as pd from './positionsDecimals';

const PositionSizeSchema = zodDecimalValueSchema(pd.PositionSize);
const CollateralAmountSchema = zodDecimalValueSchema(Decimals.CollateralAmount);
const PositionFeeSchema = zodDecimalValueSchema(pd.PositionFee);
const FundingRateSchema = zodDecimalValueSchema(pd.FundingRate);
const PnlDeltaSchema = zodDecimalValueSchema(pd.PnlDelta);
const RealizedPnlSchema = zodDecimalValueSchema(pd.RealizedPnl);

export const PositionKeySchema = z.object({
  id: PositionStableIdSchema,
  account: AddressSchema,
  indexAssetId: AssetIdSchema,
  isLong: z.boolean(),
}) satisfies z.ZodType<PositionKeyEntity, z.ZodTypeDef, unknown>;

export const PositionSchema = z.object({
  revisionId: PositionRevisionIdSchema,
  positionKey: PositionKeySchema,
  collateralAmount: CollateralAmountSchema,
  size: PositionSizeSchema,
  timestamp: z.number().int(),
  latest: z.boolean(),
  change: z.nativeEnum(PositionChange),
  collateralTransferred: CollateralAmountSchema,
  positionFee: PositionFeeSchema,
  fundingRate: FundingRateSchema,
  pnlDelta: PnlDeltaSchema,
  realizedFundingRate: FundingRateSchema,
  realizedPnl: RealizedPnlSchema,
}) satisfies z.ZodType<PositionEntity, z.ZodTypeDef, unknown>;
