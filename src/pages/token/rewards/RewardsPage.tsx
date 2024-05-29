import { useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { BackButton } from '@/components/BackButton';
import { DetachedSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';

import { testFlags } from '@/lib/testFlags';

import { DYDXBalancePanel } from './DYDXBalancePanel';
import { GovernancePanel } from './GovernancePanel';
import { LaunchIncentivesPanel } from './LaunchIncentivesPanel';
import { MigratePanel } from './MigratePanel';
import { NewMarketsPanel } from './NewMarketsPanel';
import { RewardHistoryPanel } from './RewardHistoryPanel';
import { RewardsHelpPanel } from './RewardsHelpPanel';
import { TradingRewardsChartPanel } from './TradingRewardsChartPanel';
import { TradingRewardsSummaryPanel } from './TradingRewardsSummaryPanel';

const RewardsPage = () => {
  const stringGetter = useStringGetter();
  const { isTablet, isNotTablet } = useBreakpoints();
  const navigate = useNavigate();

  const tradingRewardsRehaulEnabled = testFlags.tradingRewardsRehaul;

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
      <DetachedSection>
        <$GridLayout
          showMigratePanel={import.meta.env.VITE_V3_TOKEN_ADDRESS && isNotTablet}
          showChartPanel={tradingRewardsRehaulEnabled}
        >
          {/* Available staking rewards panel */}
          {/* List of unstaking panels */}
          {tradingRewardsRehaulEnabled && <TradingRewardsChartPanel />}
          <$LaunchIncentivesPanel />
          <$TradingRewardsColumn>
            {!tradingRewardsRehaulEnabled && <TradingRewardsSummaryPanel />}
            {tradingRewardsRehaulEnabled && <NewMarketsPanel />}
            {tradingRewardsRehaulEnabled && <GovernancePanel />}
            <RewardHistoryPanel />
            <RewardsHelpPanel />
            {tradingRewardsRehaulEnabled && legalDisclaimer}
          </$TradingRewardsColumn>
        </$GridLayout>
      </DetachedSection>
    </div>
  ) : (
    <DetachedSection>
      <$GridLayout
        showMigratePanel={import.meta.env.VITE_V3_TOKEN_ADDRESS && isNotTablet}
        showChartPanel={tradingRewardsRehaulEnabled}
      >
        {import.meta.env.VITE_V3_TOKEN_ADDRESS && <$MigratePanel />}
        {tradingRewardsRehaulEnabled && <$TradingRewardsChartPanel />}
        <$LaunchIncentivesPanel />
        <$DYDXBalancePanel />
        <$TradingRewardsColumn>
          {!tradingRewardsRehaulEnabled && <TradingRewardsSummaryPanel />}
          <RewardHistoryPanel />
        </$TradingRewardsColumn>
        <$OtherColumn>
          {/* Available staking rewards panel */}
          {/* List of unstaking panels */}
          {tradingRewardsRehaulEnabled && <NewMarketsPanel />}
          {tradingRewardsRehaulEnabled && <GovernancePanel />}
          <RewardsHelpPanel />
          {tradingRewardsRehaulEnabled && legalDisclaimer}
        </$OtherColumn>
      </$GridLayout>
    </DetachedSection>
  );
};

export default RewardsPage;

const $GridLayout = styled.div<{ showMigratePanel?: boolean; showChartPanel?: boolean }>`
  --gap: ;
  display: grid;
  gap: var(--gap);
  max-width: 80rem;

  > * {
    gap: var(--gap);
  }

  @media ${breakpoints.notTablet} {
    --gap: 1.5rem;
    grid-template-columns: 2fr 1fr;
    padding: 1rem;

    ${({ showMigratePanel, showChartPanel }) =>
      showMigratePanel && showChartPanel
        ? css`
            grid-template-areas:
              'migrate migrate'
              'chart chart'
              'incentives incentives'
              'balance balance'
              'rewards other';
          `
        : showMigratePanel
        ? css`
            grid-template-areas:
              'migrate migrate'
              'incentives balance'
              'rewards other';
          `
        : showChartPanel
        ? css`
            grid-template-areas:
              'chart chart'
              'incentives balance'
              'rewards other';
          `
        : css`
            grid-template-areas:
              'incentives balance'
              'rewards other';
          `}
  }

  @media ${breakpoints.tablet} {
    --gap: 1rem;
    grid-template-columns: 1fr;
    width: calc(100vw - 2rem);
    margin: 0 auto;
    > :last-child {
      margin-bottom: var(--gap);
    }

    ${({ showChartPanel }) =>
      showChartPanel
        ? css`
            grid-template-areas:
              'chart'
              'incentives'
              'rewards';
          `
        : css`
            grid-template-areas:
              'incentives'
              'rewards';
          `}
  }
`;

const $MigratePanel = styled(MigratePanel)`
  grid-area: migrate;
`;

const $TradingRewardsChartPanel = styled(TradingRewardsChartPanel)`
  grid-area: chart;
`;

const $LaunchIncentivesPanel = styled(LaunchIncentivesPanel)`
  grid-area: incentives;
`;

const $DYDXBalancePanel = styled(DYDXBalancePanel)`
  grid-area: balance;
`;

const $TradingRewardsColumn = styled.div`
  grid-area: rewards;
  ${layoutMixins.flexColumn}
`;

const $OtherColumn = styled.div`
  grid-area: other;
  ${layoutMixins.flexColumn}
`;

const $LegalDisclaimer = styled.div`
  font: var(--font-mini-book);
  color: var(--color-text-0);
`;
