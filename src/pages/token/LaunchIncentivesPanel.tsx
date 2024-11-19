import { useEffect } from 'react';

import styled from 'styled-components';
import tw from 'twin.macro';

import { ButtonAction } from '@/constants/buttons';
import { DialogTypes } from '@/constants/dialogs';
import { STRING_KEYS } from '@/constants/localization';
import { TOKEN_DECIMALS } from '@/constants/numbers';

import { useAccounts } from '@/hooks/useAccounts';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useQueryChaosLabsIncentives } from '@/hooks/useQueryChaosLabsIncentives';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

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
  const { chainTokenLabel } = useTokenConfigs();

  const descriptionForTraders = (
    <ul tw="list-inside text-color-text-0 font-small-book">
      <li>
        {stringGetter({
          key: STRING_KEYS.REWARD_POOL_DESC,
          params: {
            REWARD_POOL: (
              <Output
                useGrouping
                tw="inline"
                type={OutputType.Fiat}
                value={600_000}
                fractionDigits={0}
              />
            ),
            TOKEN: chainTokenLabel,
          },
        })}
      </li>
      <li>{stringGetter({ key: STRING_KEYS.REWARD_POOL_FOR_TRADERS_DESC_2 })}</li>
      <li>{stringGetter({ key: STRING_KEYS.REWARD_POOL_FOR_TRADERS_DESC_3 })}</li>
    </ul>
  );

  const descriptionForMarketMakers = (
    <ul tw="list-inside text-color-text-0 font-small-book">
      <li>
        {stringGetter({
          key: STRING_KEYS.REWARD_POOL_DESC,
          params: {
            REWARD_POOL: (
              <Output
                useGrouping
                tw="inline"
                type={OutputType.Fiat}
                value={900_000}
                fractionDigits={0}
              />
            ),
            TOKEN: chainTokenLabel,
          },
        })}
      </li>
      <li>
        {stringGetter({
          key: STRING_KEYS.MORE_INFORMATION_HERE,
          params: {
            HERE: (
              <Link
                withIcon
                tw="inline-flex text-color-accent visited:text-color-accent"
                href="https://community.chaoslabs.xyz/dydx-v4/risk/leaderboard"
              >
                {stringGetter({ key: STRING_KEYS.HERE })}
              </Link>
            ),
          },
        })}
      </li>
    </ul>
  );

  return (
    <div tw="max-w-[calc(100vw - 2rem)] flex flex-col gap-1 rounded-0.5 bg-color-layer-1 px-1 py-0.5">
      <div>
        <span>{stringGetter({ key: STRING_KEYS.REWARD_POOL_FOR_TRADERS })}</span>
        {descriptionForTraders}
      </div>
      <div>
        <span>{stringGetter({ key: STRING_KEYS.REWARD_POOL_FOR_MARKET_MAKERS })}</span>
        {descriptionForMarketMakers}
      </div>
    </div>
  );
};

const LaunchIncentivesTitle = () => {
  const stringGetter = useStringGetter();
  return (
    <$Title>
      {stringGetter({
        key: STRING_KEYS.INCENTIVE_PROGRAM,
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
  const { chainTokenLabel } = useTokenConfigs();

  return (
    <$Column>
      <div tw="text-color-text-0">
        {stringGetter({
          key: STRING_KEYS.EARN_POINTS_TO_QUALIFY_FOR_REWARDS,
          params: {
            REWARD_POOL: (
              <Output
                useGrouping
                tw="inline text-color-text-1"
                type={OutputType.Fiat}
                value={1_500_000}
                fractionDigits={0}
              />
            ),
            TOKEN: chainTokenLabel,
          },
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
