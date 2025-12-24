import { z } from 'zod';
import { AssetIdSchema } from '@/shared/types';

export type CurrentPrice = z.infer<typeof CurrentPriceSchema>;

export const CurrentPriceSchema = z.object({
  asset: AssetIdSchema,
  price: z.bigint(),
  timestamp: z.number().int(),
});
