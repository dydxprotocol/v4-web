import { z } from 'zod';
import { AssetIdSchema, CandleIdSchema } from '@/shared/types';
import type { Candle } from './CandleEntity';

export const CandleEntitySchema = z.object({
  id: CandleIdSchema,
  asset: AssetIdSchema,
  interval: z.enum(['D1', 'H1', 'H4', 'M1', 'M5', 'M15', 'M30']),
  openPrice: z.bigint(),
  closePrice: z.bigint(),
  highPrice: z.bigint(),
  lowPrice: z.bigint(),
  startedAt: z.number().int(),
}) satisfies z.ZodType<Candle, z.ZodTypeDef, unknown>;
