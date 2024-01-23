import styled, { AnyStyledComponent } from 'styled-components';
import { useNavigate } from 'react-router-dom';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useBreakpoints, useStringGetter } from '@/hooks';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { BackButton } from '@/components/BackButton';

import { DYDXBalancePanel } from './DYDXBalancePanel';
import { LaunchIncentivesPanel } from './LaunchIncentivesPanel';
import { MigratePanel } from './MigratePanel';
import { RewardsHelpPanel } from './RewardsHelpPanel';
import { TradingRewardsSummaryPanel } from './TradingRewardsSummaryPanel';
import { RewardHistoryPanel } from './RewardHistoryPanel';
import { GovernancePanel } from './GovernancePanel';
import { StakingPanel } from './StakingPanel';
import { NewMarketsPanel } from './NewMarketsPanel';

const RewardsPage = () => {
  const stringGetter = useStringGetter();
  const { isTablet, isNotTablet } = useBreakpoints();
  const navigate = useNavigate();

  return (
    <Styled.Page>
      {isTablet && (
        <Styled.MobileHeader>
          <BackButton onClick={() => navigate(AppRoute.Profile)} />
          {stringGetter({ key: STRING_KEYS.TRADING_REWARDS })}
        </Styled.MobileHeader>
      )}
      <Styled.GridLayout>
        {import.meta.env.VITE_V3_TOKEN_ADDRESS && isNotTablet && <Styled.MigratePanel />}

        {isTablet ? (
          <Styled.LaunchIncentivesPanel />
        ) : (
          <>
            <Styled.LaunchIncentivesPanel />
            <Styled.DYDXBalancePanel />
          </>
        )}

        <Styled.TradingRewardsColumn>
          <TradingRewardsSummaryPanel />
          {isTablet && <RewardsHelpPanel />}
          <RewardHistoryPanel />
        </Styled.TradingRewardsColumn>

        {isNotTablet && (
          <Styled.OtherColumn>
            <NewMarketsPanel />
            <GovernancePanel />
            <StakingPanel />
            <RewardsHelpPanel />
          </Styled.OtherColumn>
        )}
      </Styled.GridLayout>
    </Styled.Page>
  );
};

export default RewardsPage;

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Page = styled.div`
  ${layoutMixins.contentContainerPage}
  padding: 2rem;
  align-items: center;

  > * {
    --content-max-width: 80rem;
    max-width: min(calc(100vw - 4rem), var(--content-max-width));
  }

  @media ${breakpoints.tablet} {
    --stickyArea-topHeight: var(--page-header-height-mobile);
    padding: 0 1rem 1rem;

    > * {
      max-width: calc(100vw - 2rem);
      width: 100%;
    }
  }
`;

Styled.MobileHeader = styled.header`
  ${layoutMixins.contentSectionDetachedScrollable}
  ${layoutMixins.stickyHeader}
  z-index: 2;
  padding: 1.25rem 0;

  font: var(--font-large-medium);
  color: var(--color-text-2);
  background-color: var(--color-layer-2);
`;

Styled.GridLayout = styled.div`
  --gap: 1.5rem;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--gap);

  > * {
    gap: var(--gap);
  }

  grid-template-areas:
    'migrate migrate'
    'incentives balance'
    'rewards other';

  @media ${breakpoints.tablet} {
    --gap: 1rem;
    grid-template-columns: 1fr;
    grid-template-areas:
      'incentives'
      'rewards';
  }
`;

Styled.MigratePanel = styled(MigratePanel)`
  grid-area: migrate;
`;

Styled.LaunchIncentivesPanel = styled(LaunchIncentivesPanel)`
  grid-area: incentives;
`;

Styled.DYDXBalancePanel = styled(DYDXBalancePanel)`
  grid-area: balance;
`;

Styled.TradingRewardsColumn = styled.div`
  grid-area: rewards;
  ${layoutMixins.flexColumn}
`;

Styled.OtherColumn = styled.div`
  grid-area: other;
  ${layoutMixins.flexColumn}
`;

Styled.RewardHistoryHeader = styled.div`
  h3 {
    font: var(--font-medium-book);
    color: var(--color-text-2);
  }

  padding: 1rem 1.5rem 0;
  margin-bottom: -0.5rem;
`;
