import { PositionChange } from '@sdk/generated/graphql';
import * as Decimals from '@sdk/shared/models/decimals';
import {
  AddressSchema,
  AssetIdSchema,
  PositionRevisionIdSchema,
  PositionStableIdSchema,
} from '@sdk/shared/types';
import { decimalValueSchema } from '@sdk/shared/utils/DecimalCalculator/utils/zod';
import { z } from 'zod';
import type { PositionEntity, PositionKeyEntity } from './PositionsEntity';
import * as pd from './positionsDecimals';

const PositionSizeSchema = decimalValueSchema(pd.PositionSize);
const CollateralAmountSchema = decimalValueSchema(Decimals.CollateralAmount);
const PositionFeeSchema = decimalValueSchema(pd.PositionFee);
const FundingRateSchema = decimalValueSchema(pd.FundingRate);
const PnlDeltaSchema = decimalValueSchema(pd.PnlDelta);
const RealizedPnlSchema = decimalValueSchema(pd.RealizedPnl);

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
