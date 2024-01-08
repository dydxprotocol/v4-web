import { useCallback, useState } from 'react';
import styled, { AnyStyledComponent } from 'styled-components';
import { shallowEqual, useSelector } from 'react-redux';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';
import { useStringGetter } from '@/hooks';

import {
  HISTORICAL_TRADING_REWARDS_PERIODS,
  HistoricaTradingRewardsPeriod,
  HistoricaTradingRewardsPeriods,
} from '@/constants/abacus';

import { ComingSoon } from '@/components/ComingSoon';
import { Panel } from '@/components/Panel';
import { ToggleGroup } from '@/components/ToggleGroup';
import { TradingRewardHistoryTable } from '@/views/tables/TradingRewardHistoryTable';

import { getHistoricalTradingRewards } from '@/state/accountSelectors';
import abacusStateManager from '@/lib/abacus';

export const RewardHistoryPanel = () => {
  const stringGetter = useStringGetter();
  const historicalTradingRewards = useSelector(getHistoricalTradingRewards, shallowEqual);

  const [selectedPeriod, setSelectedPeriod] = useState<HistoricaTradingRewardsPeriods>(
    abacusStateManager.getHistoricalTradingRewardPeriod() || HistoricaTradingRewardsPeriod.WEEKLY
  );

  const onSelectPeriod = useCallback(
    (periodName: string) => {
      setSelectedPeriod(
        HISTORICAL_TRADING_REWARDS_PERIODS[
          periodName as keyof typeof HISTORICAL_TRADING_REWARDS_PERIODS
        ]
      );
    },
    [setSelectedPeriod, selectedPeriod]
  );

  return (
    <Styled.Panel
      slotHeader={
        <Styled.Header>
          <Styled.Title>
            <h3>Reward History</h3>
            <span>Rewards are distrubted after every block.</span>
          </Styled.Title>
          <ToggleGroup
            items={[
              {
                value: HistoricaTradingRewardsPeriod.MONTHLY.name,
                label: 'Monthly',
              },
              {
                value: HistoricaTradingRewardsPeriod.WEEKLY.name,
                label: 'Weekly',
              },
              {
                value: HistoricaTradingRewardsPeriod.DAILY.name,
                label: 'Daily',
              },
            ]}
            value={selectedPeriod.name}
            onValueChange={onSelectPeriod}
          />
        </Styled.Header>
      }
    >
      {historicalTradingRewards ? (
        <TradingRewardHistoryTable period={selectedPeriod} />
      ) : (
        <ComingSoon />
      )}
    </Styled.Panel>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Panel = styled(Panel)`
  --panel-paddingX: 1.5rem;
  --panel-paddingY: 1.25rem;

  @media ${breakpoints.tablet} {
    --panel-paddingY: 1.5rem;
  }
`;

Styled.Header = styled.div`
  ${layoutMixins.spacedRow}

  padding: 1rem 1.5rem 0;
  margin-bottom: -0.5rem;
`;

Styled.Title = styled.div`
  color: var(--color-text-0);
  font: var(--font-small-book);

  h3 {
    font: var(--font-medium-book);
    color: var(--color-text-2);
  }
`;

Styled.Content = styled.div`
  ${layoutMixins.flexColumn}
  gap: 0.75rem;
`;
