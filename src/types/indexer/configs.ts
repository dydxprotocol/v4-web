export interface ConfigsLaunchIncentiveResponse {
  data?: ConfigsLaunchIncentiveData;
}

export interface ConfigsLaunchIncentiveData {
  tradingSeasons?: ConfigsLaunchIncentiveSeason[];
}

export interface ConfigsLaunchIncentiveSeason {
  label?: string;
  startTimestamp?: number;
}

export interface ConfigsLaunchIncentivePoints {
  incentivePoints?: number;
  marketMakingIncentivePoints?: number;
  dydxRewards?: number;
}

export interface ConfigsMarketAsset {
  name: string;
  websiteLink?: string;
  whitepaperLink?: string;
  coinMarketCapsLink?: string;
  tags?: string[];
}

export interface ConfigsAssetMetadata {
  name: string;
  logo: string;
  urls: Record<string, string | null>;
  sector_tags?: string[];
}
