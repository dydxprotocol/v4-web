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

import { STRING_KEYS } from '@/constants/localization';

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
    <Panel
      slotHeader={
        <Styled.Header>
          <Styled.Title>
            <h3>{stringGetter({ key: STRING_KEYS.REWARD_HISTORY })}</h3>
            <span>{stringGetter({ key: STRING_KEYS.REWARD_HISTORY_DESCRIPTION })}</span>
          </Styled.Title>
          <ToggleGroup
            items={[
              {
                value: HistoricaTradingRewardsPeriod.MONTHLY.name,
                label: stringGetter({ key: STRING_KEYS.MONTHLY }),
              },
              {
                value: HistoricaTradingRewardsPeriod.WEEKLY.name,
                label: stringGetter({ key: STRING_KEYS.WEEKLY }),
              },
              {
                value: HistoricaTradingRewardsPeriod.DAILY.name,
                label: stringGetter({ key: STRING_KEYS.DAILY }),
              },
            ]}
            value={selectedPeriod.name}
            onValueChange={onSelectPeriod}
          />
        </Styled.Header>
      }
    >
      <TradingRewardHistoryTable period={selectedPeriod} />
    </Panel>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Header = styled.div`
  ${layoutMixins.spacedRow}

  padding: 1rem 1rem 0;
  margin-bottom: -0.5rem;

  @media ${breakpoints.notTablet} {
    padding: 1.25rem 1.5rem 0;
  }
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
