import { shallowEqual } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { AccountBalance } from '@/constants/abacus';
import { ComplianceStates } from '@/constants/compliance';
import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useComplianceState } from '@/hooks/useComplianceState';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { BackButton } from '@/components/BackButton';
import { DetachedSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';

import { getStakingRewards } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { MustBigNumber } from '@/lib/numbers';
import { testFlags } from '@/lib/testFlags';

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
  const { usdcDenom } = useTokenConfigs();
  const usdcDecimals = 24; // hardcoded solution; fix in OTE-390
  const { enableStaking, tradingRewardsRehaul: tradingRewardsRehaulEnabled } = testFlags;

  const stakingRewards: AccountBalance[] =
    useAppSelector(getStakingRewards, shallowEqual)?.totalRewards?.toArray() ?? [];

  const totalUsdcRewards = stakingRewards?.reduce((total: number, reward) => {
    if (reward?.denom === usdcDenom && reward.amount) {
      return total + parseFloat(reward.amount);
    }
    return total;
  }, 0);

  const showMigratePanel = import.meta.env.VITE_V3_TOKEN_ADDRESS && isNotTablet;
  const showGeoblockedPanel =
    tradingRewardsRehaulEnabled && complianceState !== ComplianceStates.FULL_ACCESS;
  const showStakingRewardPanel = totalUsdcRewards > 0 && !showGeoblockedPanel && enableStaking;

  const stakingRewardPanel = (
    <StakingRewardPanel
      usdcRewards={MustBigNumber(totalUsdcRewards).div(Number(`1e${usdcDecimals}`))}
    />
  );
  const legalDisclaimer = (
    <$LegalDisclaimer>
      {stringGetter({ key: STRING_KEYS.TRADING_REWARDS_LEGAL_DISCLAIMER })}
    </$LegalDisclaimer>
  );

  return isTablet ? (
    <div>
      <ContentSectionHeader
        title={stringGetter({ key: STRING_KEYS.TRADING_REWARDS })}
        slotLeft={<BackButton onClick={() => navigate(AppRoute.Profile)} />}
      />
      <$DetachedSection>
        {showGeoblockedPanel && <GeoblockedPanel />}
        {showStakingRewardPanel && stakingRewardPanel}
        {enableStaking ? <StakingPanel /> : <DYDXBalancePanel />}
        {enableStaking && <UnbondingPanels />}
        {/* List of unstaking panels */}
        {tradingRewardsRehaulEnabled && <TradingRewardsChartPanel />}
        <LaunchIncentivesPanel />
        {!tradingRewardsRehaulEnabled && <TradingRewardsSummaryPanel />}
        {tradingRewardsRehaulEnabled && <NewMarketsPanel />}
        {tradingRewardsRehaulEnabled && <GovernancePanel />}
        <RewardHistoryPanel />
        <RewardsHelpPanel />
        {tradingRewardsRehaulEnabled && legalDisclaimer}
      </$DetachedSection>
    </div>
  ) : (
    <$DetachedSection>
      {showMigratePanel && <MigratePanel />}
      <$DoubleColumnView>
        <$LeftColumn>
          {tradingRewardsRehaulEnabled && <TradingRewardsChartPanel />}
          <LaunchIncentivesPanel />
          {!tradingRewardsRehaulEnabled && <TradingRewardsSummaryPanel />}
          <RewardHistoryPanel />
        </$LeftColumn>
        <$RightColumn>
          {showGeoblockedPanel && <GeoblockedPanel />}
          {showStakingRewardPanel && stakingRewardPanel}
          {enableStaking ? <StakingPanel /> : <DYDXBalancePanel />}
          {enableStaking && <UnbondingPanels />}
          {/* List of unstaking panels */}
          {tradingRewardsRehaulEnabled && <NewMarketsPanel />}
          {tradingRewardsRehaulEnabled && <GovernancePanel />}
          <RewardsHelpPanel />
          {tradingRewardsRehaulEnabled && legalDisclaimer}
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
