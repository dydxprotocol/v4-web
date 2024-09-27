import type { TooltipStrings } from '@/constants/localization';

import { affiliateTooltips } from './affiliates';
import { depositTooltips } from './deposit';
import { generalTooltips } from './general';
import { portfolioTooltips } from './portfolio';
import { stakeTooltips } from './stake';
import { tradeTooltips } from './trade';
import { tradeChartTooltips } from './tradeChart';
import { triggersTooltips } from './triggers';
import { withdrawTooltips } from './withdraw';

export const tooltipStrings: TooltipStrings = {
  ...depositTooltips,
  ...generalTooltips,
  ...portfolioTooltips,
  ...stakeTooltips,
  ...tradeTooltips,
  ...tradeChartTooltips,
  ...triggersTooltips,
  ...withdrawTooltips,
  ...affiliateTooltips,
} as const;
