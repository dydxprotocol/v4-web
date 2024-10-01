export const AFFILIATES_EARN_PER_MONTH = 1500;

export const AFFILIATES_FEE_DISCOUNT = 500;

export interface IAffiliateStats {
  rank: number;
  account: string;
  referredFees: number;
  referredVolume: number;
  totalEarnings: number;
  totalReferredUsers: number;
  totalReferredTrades?: number;
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
