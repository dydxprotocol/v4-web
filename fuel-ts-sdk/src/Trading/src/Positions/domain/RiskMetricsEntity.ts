import type { z } from 'zod';
import type { RiskMetricsEntitySchema } from './RiskMetricsEntity.schema';

export type RiskMetricsEntity = z.infer<typeof RiskMetricsEntitySchema>;
