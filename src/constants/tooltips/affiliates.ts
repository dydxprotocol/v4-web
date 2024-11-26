import { TooltipStrings } from '../localization';

export const affiliateTooltips = {
  'affiliate-commissions': ({ stringGetter }) => ({
    title: "Affiliate commissions",
    body: 'Affiliates earn commission on taker fees paid by referred users. To generate affiliate fee share, referred users must have rolling 30-day volume below $50M when they make the trade. ',
  }),
} satisfies TooltipStrings;
