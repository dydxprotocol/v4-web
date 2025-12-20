import type { z } from 'zod';

import type { PortfolioMetricsSchema } from './portfolio.schemas';

export type PortfolioMetrics = z.infer<typeof PortfolioMetricsSchema>;
