import { z } from 'zod';
import { AssetIdSchema } from '@/shared/types';

export type Candle = z.infer<typeof CandleSchema>;

export const CandleSchema = z.object({
  asset: AssetIdSchema,
  closePrice: z.bigint(),
  highPrice: z.bigint(),
  lowPrice: z.bigint(),
  startedAt: z.number().int(),
});
