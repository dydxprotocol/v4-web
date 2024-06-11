import type { TooltipStrings } from '@/constants/localization';

import { depositTooltips } from './deposit';
import { generalTooltips } from './general';
import { portfolioTooltips } from './portfolio';
import { stakeTooltips } from './stake';
import { tradeTooltips } from './trade';
import { triggersTooltips } from './triggers';
import { withdrawTooltips } from './withdraw';

export const tooltipStrings: TooltipStrings = {
  ...depositTooltips,
  ...generalTooltips,
  ...portfolioTooltips,
  ...stakeTooltips,
  ...tradeTooltips,
  ...triggersTooltips,
  ...withdrawTooltips,
} as const;
