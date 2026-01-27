import { createContext } from 'react';
import type { PositionEntity } from 'fuel-ts-sdk/trading';

export const PositionCardContext = createContext<PositionEntity | null>(null);
PositionCardContext.displayName = 'PositionCard';
