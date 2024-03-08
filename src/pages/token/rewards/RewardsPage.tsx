import { useNavigate } from 'react-router-dom';
import styled, { AnyStyledComponent, css } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { AppRoute } from '@/constants/routes';

import { useBreakpoints, useStringGetter } from '@/hooks';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';

import { BackButton } from '@/components/BackButton';
import { DetachedSection } from '@/components/ContentSection';
import { ContentSectionHeader } from '@/components/ContentSectionHeader';

import { DYDXBalancePanel } from './DYDXBalancePanel';
import { LaunchIncentivesPanel } from './LaunchIncentivesPanel';
import { MigratePanel } from './MigratePanel';
import { RewardHistoryPanel } from './RewardHistoryPanel';
import { RewardsHelpPanel } from './RewardsHelpPanel';
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
        <Styled.GridLayout showMigratePanel={import.meta.env.VITE_V3_TOKEN_ADDRESS && isNotTablet}>
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
              <RewardsHelpPanel />
            </Styled.OtherColumn>
          )}
        </Styled.GridLayout>
      </DetachedSection>
    </div>
  );
};

export default RewardsPage;

const Styled: Record<string, AnyStyledComponent> = {};

Styled.MobileHeader = styled.header`
  ${layoutMixins.contentSectionDetachedScrollable}
  ${layoutMixins.stickyHeader}
  z-index: 2;
  padding: 1.25rem 0;

  font: var(--font-large-medium);
  color: var(--color-text-2);
  background-color: var(--color-layer-2);
`;

Styled.GridLayout = styled.div<{ showMigratePanel?: boolean }>`
  --gap: 1.5rem;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--gap);
  max-width: 80rem;

  > * {
    gap: var(--gap);
  }

  ${({ showMigratePanel }) =>
    showMigratePanel
      ? css`
          grid-template-areas:
            'migrate migrate'
            'incentives incentives'
            'balance balance'
            'rewards other';
        `
      : css`
          grid-template-areas:
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
