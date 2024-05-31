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
import { LaunchIncentivesPanel } from './LaunchIncentivesPanel';
import { MigratePanel } from './MigratePanel';
import { RewardHistoryPanel } from './RewardHistoryPanel';
import { RewardsHelpPanel } from './RewardsHelpPanel';
import { StakingPanel } from './StakingPanel';
import { TradingRewardsChartPanel } from './TradingRewardsChartPanel';
import { TradingRewardsSummaryPanel } from './TradingRewardsSummaryPanel';

const RewardsPage = () => {
  const stringGetter = useStringGetter();
  const { isTablet, isNotTablet } = useBreakpoints();
  const navigate = useNavigate();

  return (
    <div>
      {isTablet && (
        <ContentSectionHeader
          title={stringGetter({ key: STRING_KEYS.TRADING_REWARDS })}
          slotLeft={<BackButton onClick={() => navigate(AppRoute.Profile)} />}
        />
      )}
      <DetachedSection>
        <$GridLayout showMigratePanel={import.meta.env.VITE_V3_TOKEN_ADDRESS && isNotTablet}>
          {import.meta.env.VITE_V3_TOKEN_ADDRESS && isNotTablet && <$MigratePanel />}

          {isTablet ? (
            <$LaunchIncentivesPanel />
          ) : (
            <>
              {testFlags.tradingRewardsRehaul && <$TradingRewardsChartPanel />}
              <$LaunchIncentivesPanel />
              {testFlags.enableStaking ? <$StakingPanel /> : <$DYDXBalancePanel />}
            </>
          )}

          <$TradingRewardsColumn>
            <TradingRewardsSummaryPanel />
            {isTablet && testFlags.tradingRewardsRehaul && <TradingRewardsChartPanel />}
            {isTablet && <RewardsHelpPanel />}
            <RewardHistoryPanel />
          </$TradingRewardsColumn>

          {isNotTablet && (
            <$OtherColumn>
              <RewardsHelpPanel />
            </$OtherColumn>
          )}
        </$GridLayout>
      </DetachedSection>
    </div>
  );
};

export default RewardsPage;

const $GridLayout = styled.div<{ showMigratePanel?: boolean }>`
  --gap: 1.5rem;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--gap);
  max-width: 80rem;

  > * {
    gap: var(--gap);
  }

  // xccx figure out migrate
  ${({ showMigratePanel }) =>
    showMigratePanel
      ? css`
          grid-template-areas:
            'migrate migrate'
            'chart chart'
            'incentives incentives'
            'balance balance'
            'rewards other';
        `
      : css`
          grid-template-areas:
            'chart chart'
            'incentives balance'
            'rewards other';
        `}

  @media ${breakpoints.notTablet} {
    padding: 1rem;
  }

  @media ${breakpoints.tablet} {
    --gap: 1rem;
    grid-template-columns: 1fr;
    width: calc(100vw - 2rem);
    margin: 0 auto;

    grid-template-areas:
      'incentives'
      'rewards';
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

const $StakingPanel = styled(StakingPanel)`
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
