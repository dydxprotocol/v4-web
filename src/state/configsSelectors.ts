import type { RootState } from './_store';
import { createAppSelector } from './appTypes';

export const getFeeTiers = createAppSelector([(state: RootState) => state.configs.feeTiers], (t) =>
  t?.toArray()
);

export const getStatefulOrderEquityTiers = createAppSelector(
  [(state: RootState) => state.configs.equityTiers?.statefulOrderEquityTiers],
  (t) => t?.toArray()
);
