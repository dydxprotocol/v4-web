import type { z } from 'zod';

import type { MarketConfigSchema } from './market.schemas';

export type MarketConfig = z.infer<typeof MarketConfigSchema>;
