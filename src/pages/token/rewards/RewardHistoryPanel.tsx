import styled from 'styled-components';

import { HistoricalTradingRewardsPeriod } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useEnvConfig } from '@/hooks/useEnvConfig';
import { useStringGetter } from '@/hooks/useStringGetter';

import breakpoints from '@/styles/breakpoints';

import { Output, OutputType } from '@/components/Output';
import { TradingRewardHistoryTable } from '@/views/tables/TradingRewardHistoryTable';

export const RewardHistoryPanel = () => {
  const stringGetter = useStringGetter();
  const rewardsHistoryStartDate = useEnvConfig('rewardsHistoryStartDateMs');

  return (
    <$RewardHistoryContainer>
      <$Header>
        <$Title>{stringGetter({ key: STRING_KEYS.TRADING_REWARD_HISTORY })}</$Title>
      </$Header>
      <$TradingRewardHistoryTable period={HistoricalTradingRewardsPeriod.DAILY} />
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
    </$RewardHistoryContainer>
  );
};

const $RewardHistoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--gap);
`;

const $Header = styled.div`
  @media ${breakpoints.notTablet} {
    margin-bottom: -0.5rem;
  }
`;

const $Title = styled.div`
  font: var(--font-large-book);
  color: var(--color-text-2);
`;

const $TradingRewardHistoryTable = styled(TradingRewardHistoryTable)`
  --computed-radius: 0.875rem;
`;

const $Output = styled(Output)`
  display: inline;
`;

const $Description = styled.span`
  font: var(--font-mini-book);
  color: var(--color-text-0);

  padding: 0 8rem;
  text-align: center;

  @media ${breakpoints.tablet} {
    text-align: start;
    padding: 0;
  }
`;
