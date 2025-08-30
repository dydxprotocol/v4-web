import { useEffect, useState } from 'react';

import { Duration } from 'luxon';
import styled from 'styled-components';
import tw from 'twin.macro';

import { ButtonAction } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS } from '@/constants/numbers';
import { StatsigFlags } from '@/constants/statsig';
import { timeUnits } from '@/constants/time';

import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useQueryChaosLabsIncentives } from '@/hooks/useQueryChaosLabsIncentives';
import { useStatsigGateValue } from '@/hooks/useStatsig';
import { useStringGetter } from '@/hooks/useStringGetter';

import { ChaosLabsIcon } from '@/icons/chaos-labs';
import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';
import { SuccessTag, TagSize } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch } from '@/state/appTypes';
import { markLaunchIncentivesSeen } from '@/state/appUiConfigs';
import { openDialog } from '@/state/dialogs';

// Move to Chaos Labs query once its available
const SEPT_2025_REWARDS_DETAILS = {
  season: 5,
  rewardAmount: '$1M',
  rebatePercent: '50%',
  endTime: '2025-09-30T23:59:59.000Z', // end of sept
};

export const LaunchIncentivesPanel = ({ className }: { className?: string }) => {
  const { isNotTablet } = useBreakpoints();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(markLaunchIncentivesSeen());
  }, [dispatch]);

  const isSept2025Rewards = useStatsigGateValue(StatsigFlags.ffSeptember2025Rewards);
  if (isSept2025Rewards) {
    return <September2025RewardsPanel />;
  }

  return isNotTablet ? (
    <$Panel
      className={className}
      slotHeader={<LaunchIncentivesTitle />}
      slotRight={<EstimatedRewards />}
    >
      <LaunchIncentivesContent />
    </$Panel>
  ) : (
    <$Panel className={className}>
      <$Column>
        <EstimatedRewards />
        <LaunchIncentivesTitle />
        <LaunchIncentivesContent />
      </$Column>
    </$Panel>
  );
};

const September2025RewardsPanel = () => {
  const stringGetter = useStringGetter();

  return (
    <$Panel>
      <div tw="flex gap-3 pb-0.25 pt-0.5">
        <div tw="flex flex-col gap-1.5">
          <div tw="flex flex-col gap-0.5">
            <div tw="flex items-center gap-0.5">
              <div tw="font-medium-bold">
                <span tw="font-bold text-color-accent">
                  {stringGetter({ key: STRING_KEYS.SURGE })}:
                </span>{' '}
                <span tw="font-bold">
                  {stringGetter({
                    key: STRING_KEYS.SURGE_HEADLINE_SEP_2025,
                    params: {
                      REWARD_AMOUNT: SEPT_2025_REWARDS_DETAILS.rewardAmount,
                      REBATE_PERCENT: SEPT_2025_REWARDS_DETAILS.rebatePercent,
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
                  key: STRING_KEYS.SURGE_BODY_SEP_2025,
                  params: { REWARD_AMOUNT: '$1M', REBATE_PERCENT: '50%' },
                })}{' '}
                <Link href="https://www.dydx.xyz/surge" isInline>
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
                  key: STRING_KEYS.SURGE_COUNTDOWN,
                  params: { SURGE_SEASON: SEPT_2025_REWARDS_DETAILS.season },
                })}
                :
              </div>
              <MinutesCountdown endTime={SEPT_2025_REWARDS_DETAILS.endTime} />
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

  const { data, isLoading } = useQueryChaosLabsIncentives({ dydxAddress });
  const { incentivePoints } = data ?? {};

  return (
    <div tw="flex flex-col justify-between gap-0.75 self-stretch">
      <div
        style={{
          backgroundImage: `url('/dots-background.svg')`,
          backgroundSize: 'cover',
        }}
        tw="flex gap-4 rounded-0.75 border border-solid border-color-accent-faded bg-color-accent-more-faded p-1.25"
      >
        <div tw="flex flex-col gap-0.5">
          <div tw="text-nowrap font-medium text-color-text-1">
            {stringGetter({ key: STRING_KEYS.ESTIMATED_POINTS })}
          </div>
          <$Points>
            <Output
              type={OutputType.Number}
              value={incentivePoints}
              isLoading={isLoading}
              fractionDigits={TOKEN_DECIMALS}
            />
            {incentivePoints !== undefined && stringGetter({ key: STRING_KEYS.POINTS })}
          </$Points>
        </div>
        <img src="/rewards-stars.svg" alt="reward-stars" tw="h-auto w-2 self-start" />
      </div>

      <div tw="flex items-center gap-[0.5em] self-end font-tiny-medium">
        {stringGetter({ key: STRING_KEYS.POWERED_BY_ALL_CAPS })} <ChaosLabsIcon />
      </div>
    </div>
  );
};

const IncentiveProgramDescription = () => {
  const stringGetter = useStringGetter();

  const howItWorks = (
    <ul tw="list-inside text-color-text-0 font-small-book">
      <li>{stringGetter({ key: STRING_KEYS.SURGE_HOW_IT_WORKS_1 })}</li>
      <li>{stringGetter({ key: STRING_KEYS.SURGE_HOW_IT_WORKS_2 })}</li>
      <li>{stringGetter({ key: STRING_KEYS.SURGE_HOW_IT_WORKS_3 })}</li>
    </ul>
  );

  const howToEarnMore = (
    <ul tw="list-inside text-color-text-0 font-small-book">
      <li>{stringGetter({ key: STRING_KEYS.SURGE_HOW_TO_EARN_1 })}</li>
      <li>{stringGetter({ key: STRING_KEYS.SURGE_HOW_TO_EARN_2 })}</li>
    </ul>
  );

  return (
    <div tw="max-w-[calc(100vw - 2rem)] flex flex-col gap-1 rounded-0.5 bg-color-layer-1 px-1 py-0.5">
      <div>
        <span>{stringGetter({ key: STRING_KEYS.SURGE_HOW_IT_WORKS })}</span>
        {howItWorks}
      </div>
      <div>
        <span>{stringGetter({ key: STRING_KEYS.SURGE_HOW_TO_EARN })}</span>
        {howToEarnMore}
      </div>
    </div>
  );
};

const LaunchIncentivesTitle = () => {
  const stringGetter = useStringGetter();

  return (
    <$Title>
      {stringGetter({
        key: STRING_KEYS.SURGE_HEADLINE,
      })}
      <SuccessTag size={TagSize.Medium}>{stringGetter({ key: STRING_KEYS.ACTIVE })}</SuccessTag>
      <WithTooltip slotTooltip={<IncentiveProgramDescription />}>
        <Icon iconName={IconName.HelpCircle} tw="text-color-text-1" />
      </WithTooltip>
    </$Title>
  );
};

const EstimatedRewards = () => {
  const stringGetter = useStringGetter();
  const { dydxAddress } = useAccounts();

  const { data, isLoading } = useQueryChaosLabsIncentives({ dydxAddress });
  const { incentivePoints } = data ?? {};

  return (
    <$EstimatedRewardsCard>
      <$EstimatedRewardsCardContent>
        <div>
          <span>{stringGetter({ key: STRING_KEYS.ESTIMATED_POINTS })}</span>
          <span tw="text-color-text-1 font-small-book">
            {stringGetter({ key: STRING_KEYS.TOTAL_POINTS })}
          </span>
        </div>

        <$Points>
          <Output
            type={OutputType.Number}
            value={incentivePoints}
            isLoading={isLoading}
            fractionDigits={TOKEN_DECIMALS}
          />
          {incentivePoints !== undefined && stringGetter({ key: STRING_KEYS.POINTS })}
        </$Points>
      </$EstimatedRewardsCardContent>

      <img
        src="/rewards-stars.svg"
        alt="reward-stars"
        tw="relative float-right mb-1.5 h-auto w-[5.25rem]"
      />
    </$EstimatedRewardsCard>
  );
};

const LaunchIncentivesContent = () => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  return (
    <$Column>
      <div tw="text-color-text-0">
        {stringGetter({
          key: STRING_KEYS.SURGE_BODY,
        })}{' '}
      </div>

      <span tw="flex items-center gap-[0.5em] font-tiny-medium">
        {stringGetter({ key: STRING_KEYS.POWERED_BY_ALL_CAPS })} <ChaosLabsIcon />
      </span>
      <$ButtonRow>
        <$Button
          action={ButtonAction.Secondary}
          onClick={() => {
            dispatch(
              openDialog(
                DialogTypes.ExternalLink({
                  link: 'https://community.chaoslabs.xyz/dydx-v4/risk/leaderboard',
                })
              )
            );
          }}
          slotRight={<Icon iconName={IconName.LinkOut} />}
          slotLeft={<Icon iconName={IconName.Leaderboard} />}
          tw="grow-[2]"
        >
          {stringGetter({ key: STRING_KEYS.LEADERBOARD })}
        </$Button>
      </$ButtonRow>
    </$Column>
  );
};

const MinutesCountdown = ({ endTime }: { endTime: string }) => {
  const targetMs = Date.parse(endTime);
  const [msLeft, setMsLeft] = useState(Math.max(0, Math.floor(targetMs - Date.now())));

  useEffect(() => {
    const tick = () => {
      const newMsLeft = Math.max(0, Math.floor(targetMs - Date.now()));
      setMsLeft(newMsLeft);

      if (newMsLeft <= 0) clearInterval(id);
    };

    const id = setInterval(tick, timeUnits.minute);

    tick();
    return () => clearInterval(id);
  }, [targetMs]);

  return (
    <div>
      {Duration.fromMillis(msLeft)
        .shiftTo('days', 'hours', 'minutes')
        .toFormat('d:hh:mm', { floor: true })}{' '}
    </div>
  );
};

const $Panel = tw(Panel)`bg-color-layer-3 w-full`;

const $Title = styled.h3`
  ${layoutMixins.inlineRow}
  font: var(--font-medium-book);
  color: var(--color-text-2);

  @media ${breakpoints.notTablet} {
    padding: var(--panel-paddingY) var(--panel-paddingX) 0;
  }
`;

const $ButtonRow = styled.div`
  ${layoutMixins.inlineRow}
  gap: 0.75rem;
  margin-top: 0.5rem;

  a:last-child {
    --button-width: 100%;
  }
`;

const $Button = styled(Button)`
  --button-padding: 0 1rem;

  --button-textColor: var(--color-text-2);
  --button-backgroundColor: var(--color-layer-6);
  --button-border: solid var(--border-width) var(--color-layer-7);
`;

const $Column = tw.div`flexColumn gap-0.5`;

const $EstimatedRewardsCard = styled.div`
  ${layoutMixins.spacedRow}
  padding: 1rem 1.25rem;
  min-width: 19rem;
  height: calc(100% - calc(1.5rem * 2));
  max-height: 10rem;
  margin: 1.5rem;

  background-color: var(--color-layer-5);
  background-image: url('/dots-background.svg');
  background-size: cover;

  border-radius: 0.75rem;
  border: solid var(--border-width) var(--color-layer-6);
  color: var(--color-text-1);

  @media ${breakpoints.tablet} {
    margin: 0 0 0.5rem;
  }
`;

const $EstimatedRewardsCardContent = styled.div`
  ${layoutMixins.flexColumn}
  gap: 1rem;
  height: 100%;
  justify-content: space-between;

  div {
    ${layoutMixins.flexColumn}
    gap: 0.15rem;
    font: var(--font-medium-book);

    &:first-child {
      color: var(--color-text-2);
    }
  }
`;

const $Points = styled.span`
  ${layoutMixins.inlineRow}
  gap: 0.25rem;
  font: var(--font-large-book);
  color: var(--color-text-0);

  output {
    color: var(--color-text-2);
  }
`;
