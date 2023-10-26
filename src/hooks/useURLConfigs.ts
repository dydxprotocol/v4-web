import { ENVIRONMENT_CONFIG_MAP } from '@/constants/networks';

import { useSelectedNetwork } from '@/hooks';

const FALLBACK_URL = 'https://help.dydx.exchange/';

export interface LinksConfigs {
  tos: string,
  privacy: string,
  mintscan: string,
  mintscanBase: string,
  feedback?: string,
  help?: string,
  blogs?: string,
  foundation?: string,
  initialMarginFractionLearnmore?: string,
  reduceOnlyLearnmore?: string,
  documentation?: string,
  community?: string,
  governanceLearnmore?: string,
  stakingLearnmore?: string,
  keplrDashboard?: string,
  accountExportLearnmore?: string,
  walletLearnmore?: string
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
    initialMarginFractionLearnmore: linksConfigs.initialMarginFractionLearnmore || FALLBACK_URL,
    reduceOnlyLearnmore: linksConfigs.reduceOnlyLearnmore || FALLBACK_URL,
    documentation: linksConfigs.documentation || FALLBACK_URL,
    community: linksConfigs.community || FALLBACK_URL,
    governanceLearnmore: linksConfigs.governanceLearnmore || FALLBACK_URL,
    stakingLearnmore: linksConfigs.stakingLearnmore || FALLBACK_URL,
    keplrDashboard: linksConfigs.keplrDashboard || FALLBACK_URL,
    accountExportLearnmore: linksConfigs.accountExportLearnmore || FALLBACK_URL,
    walletLearnmore: linksConfigs.walletLearnmore || FALLBACK_URL,
  };
};
