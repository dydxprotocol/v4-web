import { useEffect, useMemo, useState } from 'react';

import { Duration } from 'luxon';
import styled from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS } from '@/constants/localization';
import { isDev } from '@/constants/networks';
import { StatsigFlags } from '@/constants/statsig';

import { useChaosLabsPnlDistribution } from '@/hooks/rewards/hooks';
import { DEC_2025_COMPETITION_DETAILS } from '@/hooks/rewards/util';
import { useAccounts } from '@/hooks/useAccounts';
import { useNow } from '@/hooks/useNow';
import { useStatsigGateValue } from '@/hooks/useStatsig';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';
import { SuccessTag, TagSize } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';

export const CompetitionIncentivesPanel = () => {
  const isSept2025RewardsBase = useStatsigGateValue(StatsigFlags.ffSeptember2025Rewards);
  const isSept2025Rewards = isDev ? true : isSept2025RewardsBase;
  if (isSept2025Rewards) {
    return <September2025RewardsPanel />;
  }

  return null;
};

const September2025RewardsPanel = () => {
  const stringGetter = useStringGetter();
  const now = new Date();
  // December 2025 is the first month (Month 1)
  // Calculate months difference from Dec 2025, and add 1 to make it "Month 1"
  const monthNumber = (now.getUTCFullYear() - 2025) * 12 + (now.getUTCMonth() - 11) + 1;
  // For endTime, set to last ms of current UTC month
  const endTime = (() => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0)); // first of next month UTC
    date.setTime(date.getTime() - 1);
    return date.toISOString();
  })();

  return (
    <$Panel>
      <div tw="flex gap-3 pb-0.25 pt-0.5">
        <div tw="flex flex-col gap-1.5">
          <div tw="flex flex-col gap-0.5">
            <div tw="flex items-center gap-0.5">
              <div tw="font-medium-bold">
                <span tw="font-bold">
                  {stringGetter({
                    key: STRING_KEYS.COMPETITION_HEADLINE_DEC_2025,
                    params: {
                      REWARD_AMOUNT: DEC_2025_COMPETITION_DETAILS.rewardAmount,
                    },
                  })}
                </span>
              </div>
              <SuccessTag size={TagSize.Medium}>
                {stringGetter({ key: STRING_KEYS.ACTIVE })}
              </SuccessTag>
            </div>
            <span>
              <span tw="text-color-text-0">
                {stringGetter({
                  key: STRING_KEYS.COMPETITION_BODY_DEC_2025,
                  params: {
                    REWARD_AMOUNT: DEC_2025_COMPETITION_DETAILS.rewardAmount,
                  },
                })}{' '}
                <Link href="https://www.mintscan.io/dydx/proposals/321" isInline>
                  {stringGetter({ key: STRING_KEYS.LEARN_MORE })}
                </Link>
              </span>
            </span>
          </div>
          <div tw="flex items-center gap-0.25 self-start rounded-3 bg-color-layer-1 px-0.875 py-0.5">
            <Icon iconName={IconName.Clock} size="1.25rem" tw="text-color-accent" />
            <div tw="flex gap-0.375">
              <div tw="text-color-accent">
                {stringGetter({
                  key: STRING_KEYS.MONTH_COUNTDOWN,
                  params: { MONTH: monthNumber },
                })}
                :
              </div>
              <MinutesCountdown endTime={endTime} />
            </div>
          </div>
        </div>
        <Sept2025RewardsPanel />
      </div>
    </$Panel>
  );
};

const Sept2025RewardsPanel = () => {
  const stringGetter = useStringGetter();
  const { dydxAddress } = useAccounts();
  const { data: topPnls, isLoading } = useChaosLabsPnlDistribution();

  const userReward = topPnls?.find((entry) => entry.address === dydxAddress)?.dollarReward ?? 0;

  return (
    <div tw="flex flex-col justify-between gap-0.75 self-stretch">
      <div
        style={{
          backgroundImage: `url('/dots-background-3.svg')`,
          backgroundSize: 'cover',
        }}
        tw="flex gap-4 rounded-0.75 border border-solid border-color-accent-faded bg-color-accent-more-faded p-1"
      >
        <div tw="flex flex-col gap-0.5">
          <WithTooltip
            tooltipString={stringGetter({
              key: STRING_KEYS.SURGE_EST_AMOUNT_TOOLTIP,
            })}
            slotTrigger={
              <div tw="row cursor-help gap-0.5 text-nowrap font-medium text-color-accent no-underline">
                {stringGetter({ key: STRING_KEYS.ESTIMATED_PRIZE })}
                <Icon iconName={IconName.InfoStroke} />
              </div>
            }
          />
          <$Points>
            <Output
              tw="text-extra font-extra-bold"
              type={OutputType.Fiat}
              value={userReward}
              isLoading={isLoading}
            />
          </$Points>
        </div>
        <img src="/rewards-stars.svg" alt="reward-stars" tw="h-auto w-2 self-start" />
      </div>
    </div>
  );
};

const MinutesCountdown = ({ endTime }: { endTime: string }) => {
  const targetMs = Date.parse(endTime);
  const now = useNow();
  const [msLeft, setMsLeft] = useState(Math.max(0, Math.floor(targetMs - Date.now())));

  useEffect(() => {
    if (now > targetMs) {
      return;
    }

    const newMsLeft = Math.max(0, Math.floor(targetMs - now));
    setMsLeft(newMsLeft);
  }, [now, targetMs]);

  const formattedMsLeft = useMemo(() => {
    return Duration.fromMillis(msLeft)
      .shiftTo('days', 'hours', 'minutes', 'seconds')
      .toFormat("d'd' h'h' m'm' s's'", { floor: true });
  }, [msLeft]);

  return <div>{formattedMsLeft}</div>;
};

const $Panel = tw(Panel)`bg-color-layer-3 w-full`;

const $Points = styled.span`
  ${layoutMixins.inlineRow}
  gap: 0.25rem;
  font: var(--font-large-book);
  color: var(--color-text-0);

  output {
    color: var(--color-text-2);
  }
`;
