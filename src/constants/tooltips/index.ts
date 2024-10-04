import type { TooltipStrings } from '@/constants/localization';

import { depositTooltips } from './deposit';
import { generalTooltips } from './general';
import { newMarketsTooltips } from './newMarkets';
import { portfolioTooltips } from './portfolio';
import { stakeTooltips } from './stake';
import { tradeTooltips } from './trade';
import { tradeChartTooltips } from './tradeChart';
import { triggersTooltips } from './triggers';
import { vaultTooltips } from './vault';
import { withdrawTooltips } from './withdraw';

export const tooltipStrings = {
  ...depositTooltips,
  ...generalTooltips,
  ...newMarketsTooltips,
  ...portfolioTooltips,
  ...stakeTooltips,
  ...tradeTooltips,
  ...tradeChartTooltips,
  ...triggersTooltips,
  ...withdrawTooltips,
  ...vaultTooltips,
} satisfies TooltipStrings;

export type TooltipStringKeys = keyof typeof tooltipStrings;
