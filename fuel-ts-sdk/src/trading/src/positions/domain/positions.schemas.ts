import { z } from 'zod';
import { PositionChange } from '@/generated/graphql';
import { CollateralAmount } from '@/shared/models/decimals';
import {
  AddressSchema,
  AssetIdSchema,
  PositionRevisionIdSchema,
  PositionStableIdSchema,
} from '@/shared/types';
import { decimalValueSchema } from '@/shared/utils/decimalCalculator/utils/zod';
import {
  FundingRate,
  PnlDelta,
  PositionFee,
  PositionSize,
  RealizedPnl,
} from './positions.decimals';

const PositionSizeSchema = decimalValueSchema(PositionSize);
const CollateralAmountSchema = decimalValueSchema(CollateralAmount);
const PositionFeeSchema = decimalValueSchema(PositionFee);
const FundingRateSchema = decimalValueSchema(FundingRate);
const PnlDeltaSchema = decimalValueSchema(PnlDelta);
const RealizedPnlSchema = decimalValueSchema(RealizedPnl);

export const PositionKeySchema = z.object({
  id: PositionStableIdSchema,
  account: AddressSchema,
  indexAssetId: AssetIdSchema,
  isLong: z.boolean(),
});

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
});
