import { useEffect } from 'react';

import styled from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS } from '@/constants/localization';

import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useQueryChaosLabsIncentives } from '@/hooks/useQueryChaosLabsIncentives';
import { useStringGetter } from '@/hooks/useStringGetter';

import { ChaosLabsIcon } from '@/icons/chaos-labs';
import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';
import { SuccessTag, TagSize } from '@/components/Tag';
import { WithTooltip } from '@/components/WithTooltip';

import { useAppDispatch } from '@/state/appTypes';
import { markLaunchIncentivesSeen } from '@/state/appUiConfigs';

export const LaunchIncentivesPanel = ({ className }: { className?: string }) => {
  const { isNotTablet } = useBreakpoints();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(markLaunchIncentivesSeen());
  }, [dispatch]);

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
      <SuccessTag tw="rounded-2 bg-color-positive-20 px-0.5" size={TagSize.Medium}>
        {stringGetter({ key: STRING_KEYS.ACTIVE })}
      </SuccessTag>
    </$Title>
  );
};

const EstimatedRewards = () => {
  const stringGetter = useStringGetter();
  const { dydxAddress } = useAccounts();

  const { data, isLoading } = useQueryChaosLabsIncentives({ dydxAddress });
  const { incentivePoints } = data ?? {};

  return (
    <$EstimatedRewardsContainer>
      <$EstimatedRewardsCard>
        <$EstimatedRewardsCardContent>
          <div tw="flex items-center gap-0.25">
            <span>{stringGetter({ key: STRING_KEYS.ESTIMATED_REWARDS })}</span>
            <WithTooltip slotTooltip={<IncentiveProgramDescription />}>
              <Icon iconName={IconName.InfoStroke} tw="text-color-text-0" size="0.8rem" />
            </WithTooltip>
          </div>

          <$Points>
            <Output
              tw="font-extra-bold"
              type={OutputType.Number}
              value={incentivePoints}
              isLoading={isLoading}
              fractionDigits={2}
              slotRight={
                incentivePoints !== undefined ? (
                  <div tw="ml-0.375 text-color-text-0 font-extra-medium">dYdX</div>
                ) : undefined
              }
            />
          </$Points>
        </$EstimatedRewardsCardContent>

        <img src="/rewards-stars.svg" alt="reward-stars" tw="relative h-auto w-[2rem] self-start" />
      </$EstimatedRewardsCard>
      <span tw="flex items-center gap-[0.5em] font-tiny-medium">
        {stringGetter({ key: STRING_KEYS.POWERED_BY_ALL_CAPS })} <ChaosLabsIcon />
      </span>
    </$EstimatedRewardsContainer>
  );
};

const LaunchIncentivesContent = () => {
  const stringGetter = useStringGetter();

  return (
    <$Column tw="gap-1">
      <div tw="text-color-text-0">
        {stringGetter({
          key: STRING_KEYS.SURGE_BODY,
        })}{' '}
        <a
          target="_blank"
          tw="cursor-pointer text-color-text-1"
          href="https://www.dydx.xyz/surge"
          rel="noreferrer"
        >
          {stringGetter({ key: STRING_KEYS.LEARN_MORE })}.
        </a>
      </div>
      <div tw="self-start rounded-3 bg-color-layer-1 px-1 py-0.5">
        {/* TODO: localize */}
        <span tw="font-medium text-color-accent">S3 Countdown</span>
      </div>
    </$Column>
  );
};

const $Panel = styled(Panel)`
  background: linear-gradient(
    87.47deg,
    rgba(119, 116, 255, 0.05) 0.04%,
    rgba(71, 69, 153, 0.025) 99.96%
  );
  border: solid 0.1rem var(--color-layer-3);
  --link-color: var(--color-text-1);
`;

const $Title = styled.h3`
  ${layoutMixins.inlineRow}
  font: var(--font-medium-bold);
  color: var(--color-text-2);

  @media ${breakpoints.notTablet} {
    padding: var(--panel-paddingY) var(--panel-paddingX) 0;
  }
`;

const $Column = tw.div`flexColumn gap-0.5`;

const $EstimatedRewardsContainer = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-end;
  gap: 1.18rem;

  @media ${breakpoints.tablet} {
    margin: 0 0 0.5rem;
  }
  margin: 1.5rem;
`;

const $EstimatedRewardsCard = styled.div`
  ${layoutMixins.spacedRow}
  padding: 1.125rem;
  min-width: 19rem;

  background-color: var(--color-accent-faded);
  background-image: url('/dots-background.svg');
  background-size: cover;

  border-radius: 0.75rem;
  border: solid var(--border-width) var(--color-accent-faded);
  color: var(--color-text-1);
`;

const $EstimatedRewardsCardContent = styled.div`
  ${layoutMixins.flexColumn}
  gap: 0.5rem;
  height: 100%;
  justify-content: space-between;
`;

const $Points = styled.span`
  ${layoutMixins.inlineRow}
  gap: 0.25rem;
  font: var(--font-large-book);

  output {
    color: var(--color-text-2);
  }
`;
