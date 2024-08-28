import { LINKS_CONFIG_MAP } from '@/constants/networks';

import { getSelectedDydxChainId } from '@/state/appSelectors';
import { useAppSelector } from '@/state/appTypes';

const FALLBACK_URL = 'https://help.dydx.exchange/';

export interface LinksConfigs {
  accountExportLearnMore?: string;
  blogs?: string;
  community?: string;
  documentation?: string;
  equityTiersLearnMore?: string;
  feedback?: string;
  foundation?: string;
  governanceLearnMore?: string;
  help?: string;
  initialMarginFractionLearnMore?: string;
  isolatedMarginLearnMore?: string;
  keplrDashboard?: string;
  launchIncentive?: string;
  mintscan: string;
  mintscanBase: string;
  newMarketProposalLearnMore: string;
  adjustTargetLeverageLearnMore: string;
  privacy: string;
  reduceOnlyLearnMore?: string;
  statusPage: string;
  stakingLearnMore?: string;
  strideZoneApp?: string;
  tos: string;
  tradingRewardsLearnMore?: string;
  walletLearnMore?: string;
  withdrawalGateLearnMore?: string;
  exchangeStats?: string;
  contractLossMechanismLearnMore?: string;
  mintscanValidatorsLearnMore?: string;
  protocolStaking: string;
  stakingAndClaimingRewardsLearnMore?: string;
  vaultsLearnMore: string;
  predictionMarketLearnMore?: string;
  discoveryProgram?: string;
  getInTouch?: string;
  deployerTermsAndConditions?: string;
  dydxLearnMore?: string;
}

export const useURLConfigs = (): LinksConfigs => {
  const selectedDydxChainId = useAppSelector(getSelectedDydxChainId);
  const linksConfigs = LINKS_CONFIG_MAP[selectedDydxChainId] as LinksConfigs;

  return {
    accountExportLearnMore: linksConfigs.accountExportLearnMore ?? FALLBACK_URL,
    blogs: linksConfigs.blogs ?? FALLBACK_URL,
    community: linksConfigs.community ?? FALLBACK_URL,
    documentation: linksConfigs.documentation ?? FALLBACK_URL,
    equityTiersLearnMore: linksConfigs.equityTiersLearnMore,
    feedback: linksConfigs.feedback ?? FALLBACK_URL,
    foundation: linksConfigs.foundation ?? FALLBACK_URL,
    governanceLearnMore: linksConfigs.governanceLearnMore ?? FALLBACK_URL,
    help: linksConfigs.help ?? FALLBACK_URL,
    initialMarginFractionLearnMore: linksConfigs.initialMarginFractionLearnMore ?? FALLBACK_URL,
    isolatedMarginLearnMore: linksConfigs.isolatedMarginLearnMore ?? FALLBACK_URL,
    keplrDashboard: linksConfigs.keplrDashboard ?? FALLBACK_URL,
    launchIncentive: linksConfigs.launchIncentive ?? FALLBACK_URL,
    mintscan: linksConfigs.mintscan,
    mintscanBase: linksConfigs.mintscanBase,
    newMarketProposalLearnMore: linksConfigs.newMarketProposalLearnMore ?? FALLBACK_URL,
    privacy: linksConfigs.privacy,
    reduceOnlyLearnMore: linksConfigs.reduceOnlyLearnMore ?? FALLBACK_URL,
    statusPage: linksConfigs.statusPage,
    stakingLearnMore: linksConfigs.stakingLearnMore ?? FALLBACK_URL,
    strideZoneApp: linksConfigs.strideZoneApp ?? FALLBACK_URL,
    tos: linksConfigs.tos,
    tradingRewardsLearnMore: linksConfigs.tradingRewardsLearnMore ?? FALLBACK_URL,
    walletLearnMore: linksConfigs.walletLearnMore ?? FALLBACK_URL,
    withdrawalGateLearnMore: linksConfigs.withdrawalGateLearnMore ?? FALLBACK_URL,
    exchangeStats: linksConfigs.exchangeStats ?? FALLBACK_URL,
    adjustTargetLeverageLearnMore: linksConfigs.adjustTargetLeverageLearnMore ?? FALLBACK_URL,
    contractLossMechanismLearnMore: linksConfigs.contractLossMechanismLearnMore,
    mintscanValidatorsLearnMore: linksConfigs.mintscanValidatorsLearnMore,
    protocolStaking: linksConfigs.protocolStaking,
    stakingAndClaimingRewardsLearnMore:
      linksConfigs.stakingAndClaimingRewardsLearnMore ?? FALLBACK_URL,
    // todo add to the link configs objects
    vaultsLearnMore: linksConfigs.vaultsLearnMore ?? FALLBACK_URL,
    predictionMarketLearnMore: linksConfigs.predictionMarketLearnMore,
    discoveryProgram: linksConfigs.discoveryProgram,
    getInTouch: linksConfigs.getInTouch,
    deployerTermsAndConditions: linksConfigs.deployerTermsAndConditions,
    dydxLearnMore: linksConfigs.dydxLearnMore ?? FALLBACK_URL,
  };
};
