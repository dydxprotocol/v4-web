import type { z } from 'zod';

import type { PositionKeySchema, PositionSchema } from './positions.schemas';

export { PositionChange } from '@/generated/graphql';

export type PositionKey = z.infer<typeof PositionKeySchema>;

export type Position = z.infer<typeof PositionSchema>;

export enum PositionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum PositionSide {
  LONG = 'LONG',
  SHORT = 'SHORT',
}
