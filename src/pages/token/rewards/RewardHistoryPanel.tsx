import { useCallback, useState } from 'react';

import styled from 'styled-components';

import {
  HISTORICAL_TRADING_REWARDS_PERIODS,
  HistoricalTradingRewardsPeriod,
  HistoricalTradingRewardsPeriods,
} from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useEnvConfig } from '@/hooks/useEnvConfig';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';
import { ToggleGroup } from '@/components/ToggleGroup';
import { WithTooltip } from '@/components/WithTooltip';
import { TradingRewardHistoryTable } from '@/views/tables/TradingRewardHistoryTable';

import abacusStateManager from '@/lib/abacus';

export const RewardHistoryPanel = () => {
  const stringGetter = useStringGetter();
  const rewardsHistoryStartDate = useEnvConfig('rewardsHistoryStartDateMs');

  const [selectedPeriod, setSelectedPeriod] = useState<HistoricalTradingRewardsPeriods>(
    abacusStateManager.getHistoricalTradingRewardPeriod() || HistoricalTradingRewardsPeriod.DAILY
  );

  const onSelectPeriod = useCallback((periodName: string) => {
    const thisSelectedPeriod =
      HISTORICAL_TRADING_REWARDS_PERIODS[
        periodName as keyof typeof HISTORICAL_TRADING_REWARDS_PERIODS
      ];
    setSelectedPeriod(thisSelectedPeriod);
    abacusStateManager.setHistoricalTradingRewardPeriod(thisSelectedPeriod);
  }, []);

  return (
    <Panel
      slotHeader={
        <$Header>
          <$Title>
            <WithTooltip tooltip="reward-history">
              <h3>{stringGetter({ key: STRING_KEYS.REWARD_HISTORY })}</h3>
            </WithTooltip>
            <span>
              {stringGetter({
                key: STRING_KEYS.REWARD_HISTORY_DESCRIPTION,
                params: {
                  REWARDS_HISTORY_START_DATE: (
                    <$Output
                      type={OutputType.Date}
                      value={Number(rewardsHistoryStartDate)}
                      timeOptions={{ useUTC: true }}
                    />
                  ),
                },
              })}
            </span>
          </$Title>
          <ToggleGroup
            items={[
              {
                value: HistoricalTradingRewardsPeriod.MONTHLY.name,
                label: stringGetter({ key: STRING_KEYS.MONTHLY }),
              },
              {
                value: HistoricalTradingRewardsPeriod.WEEKLY.name,
                label: stringGetter({ key: STRING_KEYS.WEEKLY }),
              },
              {
                value: HistoricalTradingRewardsPeriod.DAILY.name,
                label: stringGetter({ key: STRING_KEYS.DAILY }),
              },
            ]}
            value={selectedPeriod.name}
            onValueChange={onSelectPeriod}
          />
        </$Header>
      }
    >
      <TradingRewardHistoryTable period={selectedPeriod} />
    </Panel>
  );
};
const $Header = styled.div`
  ${layoutMixins.spacedRow}

  padding: 1rem 1rem 0;
  margin-bottom: -0.5rem;

  @media ${breakpoints.notTablet} {
    padding: 1.25rem 1.5rem 0;
  }
`;

const $Title = styled.div`
  ${layoutMixins.column}
  color: var(--color-text-0);
  font: var(--font-small-book);

  h3 {
    font: var(--font-medium-book);
    color: var(--color-text-2);
  }
`;

const $Output = styled(Output)`
  display: inline;
`;
