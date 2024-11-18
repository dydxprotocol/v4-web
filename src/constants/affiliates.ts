export const DEFAULT_AFFILIATES_EARN_PER_MONTH_USD = 3000;
export const DEFAULT_AFFILIATES_VIP_EARN_PER_MONTH_USD = 10000;

export const AFFILIATES_FEE_DISCOUNT_USD = 550;
export const AFFILIATES_REQUIRED_VOLUME_USD = 10_000;

export const REF_SHARE_VOLUME_CAP_USD = 50_000_000;
export const DEFAULT_TAKER_3_FEE = 0.0004;
export const MAX_AFFILIATE_VIP_SHARE = 0.5;
export const DEFAULT_MAX_AFFILIATE_SHARE = 0.15;

export interface IAffiliateStats {
  affiliateAddress: string;
  affiliateReferralCode: string;
  affiliateEarnings: number;
  affiliateReferredTrades: number;
  affiliateTotalReferredFees: number;
  affiliateReferredUsers: number;
  affiliateReferredNetProtocolEarnings: number;
  affiliateReferredTotalVolume: number;
  affiliateReferredMakerFees: number;
  affiliateReferredTakerFees: number;
  affiliateReferredMakerRebates: number;
}

export interface IAffiliateLeaderboardStats extends IAffiliateStats {
  rank: number;
}

export interface IDateStats {
  date: string;
  referredVolume: string;
  totalEarnings: string;
  totalReferredTrades: string;
  totalReferredUsers: string;
}

export interface IProgramStats {
  totalEarnings: number;
  referredVolume: number;
  referredFees: number;
  referredTrades: number;
  totalReferredUsers: number;
  totalAffiliates: number;
}
