import { createAppSelector } from '@/state/appTypes';

import { calculateEquityTiers, calculateFeeTiers } from '../calculators/configs';
import { selectRawConfigEquityTiers, selectRawConfigFeeTiers } from './base';

export const selectEquityTiers = createAppSelector([selectRawConfigEquityTiers], (equity) =>
  calculateEquityTiers(equity)
);

export const selectFeeTiers = createAppSelector([selectRawConfigFeeTiers], (fees) =>
  calculateFeeTiers(fees)
);
