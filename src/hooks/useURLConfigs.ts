import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { useSelectedNetwork } from '@/hooks';

const FALLBACK_URL = 'https://help.dydx.exchange/';

export interface LinksConfigs {
  tos: string;
  privacy: string;
  mintscan: string;
  mintscanBase: string;
  feedback?: string;
  help?: string;
  blogs?: string;
  foundation?: string;
  initialMarginFractionLearnMore?: string;
  reduceOnlyLearnMore?: string;
  documentation?: string;
  community?: string;
  governanceLearnMore?: string;
  stakingLearnMore?: string;
  keplrDashboard?: string;
  strideZoneApp?: string;
  accountExportLearnMore?: string;
  walletLearnMore?: string;
}

export const useURLConfigs = (): LinksConfigs => {
  const { selectedNetwork } = useSelectedNetwork();
  const linksConfigs = ENVIRONMENT_CONFIG_MAP[selectedNetwork].links as LinksConfigs;

  return {
    tos: linksConfigs.tos,
    privacy: linksConfigs.privacy,
    mintscan: linksConfigs.mintscan,
    mintscanBase: linksConfigs.mintscanBase,
    feedback: linksConfigs.feedback || FALLBACK_URL,
    help: linksConfigs.help || FALLBACK_URL,
    blogs: linksConfigs.blogs || FALLBACK_URL,
    foundation: linksConfigs.foundation || FALLBACK_URL,
    initialMarginFractionLearnMore: linksConfigs.initialMarginFractionLearnMore || FALLBACK_URL,
    reduceOnlyLearnMore: linksConfigs.reduceOnlyLearnMore || FALLBACK_URL,
    documentation: linksConfigs.documentation || FALLBACK_URL,
    community: linksConfigs.community || FALLBACK_URL,
    governanceLearnMore: linksConfigs.governanceLearnMore || FALLBACK_URL,
    stakingLearnMore: linksConfigs.stakingLearnMore || FALLBACK_URL,
    keplrDashboard: linksConfigs.keplrDashboard || FALLBACK_URL,
    strideZoneApp: linksConfigs.strideZoneApp || FALLBACK_URL,
    accountExportLearnMore: linksConfigs.accountExportLearnMore || FALLBACK_URL,
    walletLearnMore: linksConfigs.walletLearnMore || FALLBACK_URL,
  };
};
