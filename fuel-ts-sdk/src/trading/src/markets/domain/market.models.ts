import type { z } from 'zod';

import type { MarketConfigSchema, OraclePriceSchema } from './market.schemas';

export type OraclePriceData = z.infer<typeof OraclePriceSchema>;
export type MarketConfig = z.infer<typeof MarketConfigSchema>;
