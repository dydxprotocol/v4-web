import type { TooltipStrings } from '@/constants/localization';

import { affiliateTooltips } from './affiliates';
import { depositTooltips } from './deposit';
import { generalTooltips } from './general';
import { newMarketsTooltips } from './newMarkets';
import { portfolioTooltips } from './portfolio';
import { stakeTooltips } from './stake';
import { tradeTooltips } from './trade';
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
  ...triggersTooltips,
  ...withdrawTooltips,
  ...vaultTooltips,
  ...affiliateTooltips,
} satisfies TooltipStrings;

export type TooltipStringKeys = keyof typeof tooltipStrings;
