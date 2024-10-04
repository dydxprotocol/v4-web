import { useEffect } from 'react';

import { shallowEqual } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import tw from 'twin.macro';
import { formatUnits } from 'viem';

import { HistoricalTradingRewardsPeriod } from '@/constants/abacus';
import { ComplianceStates } from '@/constants/compliance';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useEnvConfig } from '@/hooks/useEnvConfig';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';

import { BackButton } from '@/components/BackButton';
import { DetachedSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { TermsOfUseLink } from '@/components/TermsOfUseLink';

import { calculateCanViewAccount } from '@/state/accountCalculators';
import { getStakingRewards } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';

import { GeoblockedPanel } from './GeoblockedPanel';
import { GovernancePanel } from './GovernancePanel';
import { LaunchIncentivesPanel } from './LaunchIncentivesPanel';
import { MigratePanel } from './MigratePanel';
import { NewMarketsPanel } from './NewMarketsPanel';
import { RewardHistoryPanel } from './RewardHistoryPanel';
import { RewardsHelpPanel } from './RewardsHelpPanel';
import { StakingPanel } from './StakingPanel';
import { StakingRewardPanel } from './StakingRewardPanel';
import { TradingRewardsChartPanel } from './TradingRewardsChartPanel';
import { UnbondingPanels } from './UnbondingPanels';

const RewardsPage = () => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();

  const { complianceState } = useComplianceState();
  const { isTablet, isNotTablet } = useBreakpoints();
  const canViewAccount = useAppSelector(calculateCanViewAccount);

  const { usdcDenom } = useTokenConfigs();
  const usdcDecimals = 24; // hardcoded solution; fix in OTE-390

  const { totalRewards } = useAppSelector(getStakingRewards, shallowEqual) ?? {};

  const totalUsdcRewards = (totalRewards?.toArray() ?? [])?.reduce((total: number, reward) => {
    if (reward?.denom === usdcDenom && reward.amount) {
      return total + parseFloat(reward.amount);
    }
    return total;
  }, 0);

  const ethereumChainId = useEnvConfig('ethereumChainId');
  const chainId = Number(ethereumChainId);
  // v3 token is only on mainnet
  const { balance: tokenBalance } = useAccountBalance({
    addressOrDenom: chainId === 1 ? import.meta.env.VITE_V3_TOKEN_ADDRESS : undefined,
    chainId: 1,
    isCosmosChain: false,
  });

  const showMigratePanel =
    import.meta.env.VITE_V3_TOKEN_ADDRESS && isNotTablet && MustBigNumber(tokenBalance).gt(0);
  const showGeoblockedPanel = complianceState !== ComplianceStates.FULL_ACCESS;
  const showStakingRewardPanel = totalUsdcRewards > 0 && !showGeoblockedPanel;

  const stakingRewardPanel = (
    <StakingRewardPanel
      usdcRewards={MustBigNumber(formatUnits(BigInt(totalUsdcRewards), usdcDecimals))}
    />
  );
  const legalDisclaimer = (
    <div tw="text-color-text-0 font-mini-book">
      {stringGetter({
        key: STRING_KEYS.TRADING_REWARDS_LEGAL_DISCLAIMER,
        params: {
          TERMS_OF_USE_LINK: <TermsOfUseLink isInline />,
        },
      })}
    </div>
  );

  useEffect(() => {
    // Initialize daily data for rewards table + chart
    abacusStateManager.setHistoricalTradingRewardPeriod(HistoricalTradingRewardsPeriod.DAILY);
  }, [canViewAccount]);

  return (
    <$Page>
      {isTablet ? (
        <div>
          <ContentSectionHeader
            title={stringGetter({ key: STRING_KEYS.TRADING_REWARDS })}
            slotLeft={<BackButton onClick={() => navigate(AppRoute.Profile)} />}
          />
          <$DetachedSection>
            {showGeoblockedPanel && <GeoblockedPanel />}
            {showStakingRewardPanel && stakingRewardPanel}
            <StakingPanel />
            <UnbondingPanels />
            <LaunchIncentivesPanel />
            <TradingRewardsChartPanel />
            <NewMarketsPanel />
            <GovernancePanel />
            <RewardHistoryPanel />
            <RewardsHelpPanel />
            {legalDisclaimer}
          </$DetachedSection>
        </div>
      ) : (
        <$DetachedSection>
          {showMigratePanel && <MigratePanel />}
          <div tw="flex gap-1.5">
            <div tw="flexColumn flex-[2] gap-1.5">
              <LaunchIncentivesPanel />
              <TradingRewardsChartPanel />
              <RewardHistoryPanel />
            </div>
            <div tw="flexColumn flex-1 gap-1.5">
              {showGeoblockedPanel && <GeoblockedPanel />}
              {showStakingRewardPanel && stakingRewardPanel}
              <StakingPanel />
              <UnbondingPanels />
              <NewMarketsPanel />
              <GovernancePanel />
              <RewardsHelpPanel />
              {legalDisclaimer}
            </div>
          </div>
        </$DetachedSection>
      )}
    </$Page>
  );
};

export default RewardsPage;

const $Page = styled.div`
  ${layoutMixins.contentContainerPage}
`;

const $DetachedSection = tw(DetachedSection)`flex flex-col gap-1.5 p-1 max-w-7xl tablet:w-screen`;
