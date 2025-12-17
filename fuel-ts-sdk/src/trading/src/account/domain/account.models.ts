import type { z } from 'zod';

import type { AccountMetricsSchema } from './account.schemas';

export type AccountMetrics = z.infer<typeof AccountMetricsSchema>;
