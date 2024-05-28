import styled from 'styled-components';

import { HistoricalTradingRewardsPeriod } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useEnvConfig } from '@/hooks/useEnvConfig';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Output, OutputType } from '@/components/Output';
import { TradingRewardHistoryTable } from '@/views/tables/TradingRewardHistoryTable';

export const RewardHistoryPanel = () => {
  const stringGetter = useStringGetter();
  const rewardsHistoryStartDate = useEnvConfig('rewardsHistoryStartDateMs');

  return (
    <>
      <$Header>
        <$Title>{stringGetter({ key: STRING_KEYS.TRADING_REWARD_HISTORY })}</$Title>
      </$Header>
      <TradingRewardHistoryTable
        period={HistoricalTradingRewardsPeriod.DAILY}
        withOuterBorder
        withInnerBorders
      />
      <$Description>
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
      </$Description>
    </>
  );
};

const $Header = styled.div`
  margin-bottom: -0.5rem;
`;

const $Title = styled.div`
  font: var(--font-large-book);
  color: var(--color-text-2);
`;

const $Output = styled(Output)`
  display: inline;
`;

const $Description = styled.span`
  font: var(--font-mini-book);
  color: var(--color-text-0);

  padding: 0 10rem;
  text-align: center;
`;
