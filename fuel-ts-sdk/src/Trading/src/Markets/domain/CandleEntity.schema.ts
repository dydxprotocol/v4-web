import { AssetIdSchema, CandleIdSchema } from '@sdk/shared/types';
import { z } from 'zod';
import type { Candle } from './CandleEntity';

export const CandleEntitySchema = z.object({
  id: CandleIdSchema,
  asset: AssetIdSchema,
  interval: z.enum(['D1', 'H1', 'H4', 'M1', 'M5', 'M15', 'M30']),
  openPrice: z.string(),
  closePrice: z.string(),
  highPrice: z.string(),
  lowPrice: z.string(),
  startedAt: z.number().int(),
}) satisfies z.ZodType<Candle, z.ZodTypeDef, unknown>;
