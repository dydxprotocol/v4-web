import { useEffect } from 'react';

import { shallowEqual } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { formatUnits } from 'viem';

import { HistoricalTradingRewardsPeriod } from '@/constants/abacus';
import { ComplianceStates } from '@/constants/compliance';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute, BASE_ROUTE } from '@/constants/routes';

import { useAccountBalance } from '@/hooks/useAccountBalance';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useEnvConfig } from '@/hooks/useEnvConfig';
import { useEnvFeatures } from '@/hooks/useEnvFeatures';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { BackButton } from '@/components/BackButton';
import { DetachedSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';
import { Link } from '@/components/Link';

import { calculateCanViewAccount } from '@/state/accountCalculators';
import { getStakingRewards } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import abacusStateManager from '@/lib/abacus';
import { MustBigNumber } from '@/lib/numbers';

import { DYDXBalancePanel } from './DYDXBalancePanel';
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
import { TradingRewardsSummaryPanel } from './TradingRewardsSummaryPanel';
import { UnbondingPanels } from './UnbondingPanels';

const RewardsPage = () => {
  const stringGetter = useStringGetter();
  const navigate = useNavigate();

  const { complianceState } = useComplianceState();
  const { isTablet, isNotTablet } = useBreakpoints();
  const canViewAccount = useAppSelector(calculateCanViewAccount);

  const { usdcDenom } = useTokenConfigs();
  const usdcDecimals = 24; // hardcoded solution; fix in OTE-390
  const { isStakingEnabled } = useEnvFeatures();

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
  const showGeoblockedPanel = isStakingEnabled && complianceState !== ComplianceStates.FULL_ACCESS;
  const showStakingRewardPanel = totalUsdcRewards > 0 && !showGeoblockedPanel && isStakingEnabled;

  const stakingRewardPanel = (
    <StakingRewardPanel
      usdcRewards={MustBigNumber(formatUnits(BigInt(totalUsdcRewards), usdcDecimals))}
    />
  );
  const legalDisclaimer = (
    <$LegalDisclaimer>
      {stringGetter({
        key: STRING_KEYS.TRADING_REWARDS_LEGAL_DISCLAIMER,
        params: {
          TERMS_OF_USE_LINK: (
            <$Link href={`${BASE_ROUTE}${AppRoute.Terms}`}>
              {stringGetter({ key: STRING_KEYS.TERMS_OF_USE })}
            </$Link>
          ),
        },
      })}
    </$LegalDisclaimer>
  );

  useEffect(() => {
    // Initialize daily data for rewards table + chart
    abacusStateManager.setHistoricalTradingRewardPeriod(HistoricalTradingRewardsPeriod.DAILY);
  }, [canViewAccount]);

  return isTablet ? (
    <div>
      <ContentSectionHeader
        title={stringGetter({ key: STRING_KEYS.TRADING_REWARDS })}
        slotLeft={<BackButton onClick={() => navigate(AppRoute.Profile)} />}
      />
      <$DetachedSection>
        {showGeoblockedPanel && <GeoblockedPanel />}
        {showStakingRewardPanel && stakingRewardPanel}
        {isStakingEnabled ? <StakingPanel /> : <DYDXBalancePanel />}
        {isStakingEnabled && <UnbondingPanels />}
        {isStakingEnabled && <TradingRewardsChartPanel />}
        <LaunchIncentivesPanel />
        {!isStakingEnabled && <TradingRewardsSummaryPanel />}
        {isStakingEnabled && <NewMarketsPanel />}
        {isStakingEnabled && <GovernancePanel />}
        <RewardHistoryPanel />
        <RewardsHelpPanel />
        {isStakingEnabled && legalDisclaimer}
      </$DetachedSection>
    </div>
  ) : (
    <$DetachedSection>
      {showMigratePanel && <MigratePanel />}
      <$DoubleColumnView>
        <$LeftColumn>
          {isStakingEnabled && <TradingRewardsChartPanel />}
          <LaunchIncentivesPanel />
          {!isStakingEnabled && <TradingRewardsSummaryPanel />}
          <RewardHistoryPanel />
        </$LeftColumn>
        <$RightColumn>
          {showGeoblockedPanel && <GeoblockedPanel />}
          {showStakingRewardPanel && stakingRewardPanel}
          {isStakingEnabled ? <StakingPanel /> : <DYDXBalancePanel />}
          {isStakingEnabled && <UnbondingPanels />}
          {isStakingEnabled && <NewMarketsPanel />}
          {isStakingEnabled && <GovernancePanel />}
          <RewardsHelpPanel />
          {isStakingEnabled && legalDisclaimer}
        </$RightColumn>
      </$DoubleColumnView>
    </$DetachedSection>
  );
};

export default RewardsPage;

const $DetachedSection = styled(DetachedSection)`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
  max-width: 80rem;

  @media ${breakpoints.tablet} {
    width: 100vw;
  }
`;

const $DoubleColumnView = styled.div`
  display: flex;
  gap: 1.5rem;
`;

const $LeftColumn = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1.5rem;
  flex: 2;
`;

const $RightColumn = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1.5rem;
  flex: 1;
`;

const $LegalDisclaimer = styled.div`
  font: var(--font-mini-book);
  color: var(--color-text-0);
`;

const $Link = styled(Link)`
  display: inline-block;
  text-decoration: underline;
`;
