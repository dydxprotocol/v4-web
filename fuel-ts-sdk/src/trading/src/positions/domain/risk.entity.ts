import type { z } from 'zod';
import type { RiskMetricsSchema } from './risk.schemas';

export type RiskMetrics = z.infer<typeof RiskMetricsSchema>;
