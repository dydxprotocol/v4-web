import { useEffect, useMemo, useState } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import { Duration } from 'luxon';
import styled from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS } from '@/constants/localization';

import {
  addRewardsToLeaderboardEntry,
  useBonkPnlDistribution,
  useFeeLeaderboard,
} from '@/hooks/rewards/hooks';
import { CURRENT_BONK_REWARDS_DETAILS, positionToBonkRewards } from '@/hooks/rewards/util';
import { useAccounts } from '@/hooks/useAccounts';
import { useNow } from '@/hooks/useNow';
import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';
import { SuccessTag, TagSize } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch, useAppSelector } from '@/state/appTypes';
import { markLaunchIncentivesSeen } from '@/state/appUiConfigs';

export const BonkIncentivesPanel = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(markLaunchIncentivesSeen());
  }, [dispatch]);

  return <BonkIncentivesRewardsPanel />;
};

const BonkIncentivesRewardsPanel = () => {
  const stringGetter = useStringGetter();

  return (
    <$Panel>
      <div tw="flex gap-3 pb-0.25 pt-0.5">
        <div tw="flex flex-1 flex-col gap-1.5">
          <div tw="flex flex-col gap-0.5">
            <div tw="flex items-center gap-0.5">
              <div tw="font-medium-bold">
                <span tw="font-bold">
                  {stringGetter({ key: STRING_KEYS.BONK_REWARDS_HEADLINE })}
                </span>
              </div>
              <SuccessTag size={TagSize.Medium}>
                {stringGetter({ key: STRING_KEYS.ACTIVE })}
              </SuccessTag>
            </div>
            <span>
              <span tw="text-color-text-0">
                {stringGetter({ key: STRING_KEYS.BONK_REWARDS_BODY })}
              </span>
            </span>

            <div>
              <p tw="font-semibold">{stringGetter({ key: STRING_KEYS.BONK_REWARDS_RULES })}</p>
              <ul tw="list-outside list-disc pl-1.5 text-color-text-0">
                <li>{stringGetter({ key: STRING_KEYS.BONK_REWARDS_RULE_1 })}</li>
                <li>{stringGetter({ key: STRING_KEYS.BONK_REWARDS_RULE_2 })}</li>
                <li>{stringGetter({ key: STRING_KEYS.BONK_REWARDS_RULE_3 })}</li>
              </ul>
            </div>

            <span tw="text-color-text-0">
              {stringGetter({ key: STRING_KEYS.BONK_REWARDS_BODY_2 })}
            </span>
          </div>

          <div tw="flex items-center gap-0.25 self-start rounded-3 bg-color-layer-1 px-0.875 py-0.5">
            <Icon iconName={IconName.Clock} size="1.25rem" tw="text-color-accent" />
            <div tw="flex gap-0.375 px-0.375 leading-none">
              <MinutesCountdown endTime={CURRENT_BONK_REWARDS_DETAILS.endTime} />
            </div>
          </div>
        </div>
        <EstimatedMonthlyRewards />
      </div>
    </$Panel>
  );
};

const EstimatedMonthlyRewards = () => {
  const stringGetter = useStringGetter();
  const { dydxAddress } = useAccounts();
  const dydxPrice = useAppSelector(BonsaiCore.rewardParams.data).tokenPrice;

  const { data, isLoading: feeRewardsLoading } = useFeeLeaderboard({
    address: dydxAddress,
  });
  const addressEntry = useMemo(
    () =>
      data?.addressEntry ? addRewardsToLeaderboardEntry(data.addressEntry, dydxPrice) : undefined,
    [data?.addressEntry, dydxPrice]
  );

  const { data: bonkPnls, isLoading: bonkPnlLoading } = useBonkPnlDistribution();

  const userPosition = bonkPnls?.find(
    (item: { address: string | undefined }) => item.address === dydxAddress
  )?.position;

  const userBonkRewards = positionToBonkRewards(userPosition);
  const userEstimatedRewards = (addressEntry?.estimatedDollarRewards ?? 0) + userBonkRewards;

  const isLoading = bonkPnlLoading || feeRewardsLoading || !dydxPrice;

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
                {stringGetter({ key: STRING_KEYS.ESTIMATED_MONTHLY_REWARD })}
                <Icon iconName={IconName.InfoStroke} />
              </div>
            }
          />
          <$Points>
            <Output
              tw="text-extra font-extra-bold"
              type={OutputType.Fiat}
              value={userEstimatedRewards}
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
