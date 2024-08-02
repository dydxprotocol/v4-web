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
    <div tw="flex flex-col gap-1">
      <div tw="px-0.5 py-0 text-color-text-2 font-large-book">
        {stringGetter({ key: STRING_KEYS.TRADING_REWARD_HISTORY })}
      </div>
      <TradingRewardHistoryTable
        period={HistoricalTradingRewardsPeriod.DAILY}
        tw="[--computed-radius:0.875rem]"
      />
      <$Description>
        {stringGetter({
          key: STRING_KEYS.REWARD_HISTORY_DESCRIPTION,
          params: {
            REWARDS_HISTORY_START_DATE: (
              <Output
                type={OutputType.Date}
                value={Number(rewardsHistoryStartDate)}
                timeOptions={{ useUTC: true }}
                tw="inline"
              />
            ),
          },
        })}
      </$Description>
    </div>
  );
};
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
