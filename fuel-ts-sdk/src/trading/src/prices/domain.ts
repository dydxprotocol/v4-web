import { z } from 'zod';
import { AssetIdSchema, PriceIdSchema } from '@/shared/types';

export type Price = z.infer<typeof PriceSchema>;

export const PriceSchema = z.object({
  id: PriceIdSchema,
  asset: AssetIdSchema,
  price: z.bigint(),
  timestamp: z.number().int(),
});
