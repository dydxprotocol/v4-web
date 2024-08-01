import { useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
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

import { ChaosLabsIcon } from '@/icons/chaos-labs';
import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';
import { NewTag, TagSize } from '@/components/Tag';

import { useAppDispatch } from '@/state/appTypes';
import { markLaunchIncentivesSeen } from '@/state/configs';
import { openDialog } from '@/state/dialogs';

import { wrapAndLogError } from '@/lib/asyncUtils';

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

const LaunchIncentivesTitle = () => {
  const stringGetter = useStringGetter();
  return (
    <$Title>
      {stringGetter({
        key: STRING_KEYS.LAUNCH_INCENTIVES_TITLE,
        params: {
          FOR_V4: <span tw="text-text-0">{stringGetter({ key: STRING_KEYS.FOR_V4 })}</span>,
        },
      })}
      <NewTag size={TagSize.Medium}>{stringGetter({ key: STRING_KEYS.NEW })}</NewTag>
    </$Title>
  );
};

const EstimatedRewards = () => {
  const stringGetter = useStringGetter();
  const { dydxAddress } = useAccounts();

  const { data: seasonNumber } = useQuery({
    queryKey: ['chaos_labs_season_number'],
    queryFn: wrapAndLogError(
      async () => {
        const resp = await fetch('https://cloud.chaoslabs.co/query/ccar-perpetuals', {
          method: 'POST',
          headers: {
            'apollographql-client-name': 'dydx-v4',
            'content-type': 'application/json',
            protocol: 'dydx-v4',
          },
          body: JSON.stringify({
            operationName: 'TradingSeasons',
            variables: {},
            query: `query TradingSeasons {
        tradingSeasons {
          label
        }
      }`,
          }),
        });
        const seasons = (await resp.json())?.data?.tradingSeasons;
        return seasons && seasons.length > 0 ? seasons[seasons.length - 1].label : undefined;
      },
      'LaunchIncentives/fetchSeasonNumber',
      true
    ),
  });

  const { data, isLoading } = useQueryChaosLabsIncentives({ dydxAddress, season: seasonNumber });
  const { incentivePoints } = data ?? {};

  return (
    <$EstimatedRewardsCard>
      <$EstimatedRewardsCardContent>
        <div>
          <span>{stringGetter({ key: STRING_KEYS.ESTIMATED_REWARDS })}</span>
          {seasonNumber !== undefined && (
            <span tw="text-text-1 font-small-book">
              {stringGetter({
                key: STRING_KEYS.LAUNCH_INCENTIVES_SEASON_NUM,
                params: { SEASON_NUMBER: seasonNumber },
              })}
            </span>
          )}
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

      <img src="/rewards-stars.svg" tw="relative float-right h-auto w-[5.25rem]" />
    </$EstimatedRewardsCard>
  );
};

const LaunchIncentivesContent = () => {
  const stringGetter = useStringGetter();
  const dispatch = useAppDispatch();

  return (
    <$Column>
      <div tw="text-text-0">
        {stringGetter({ key: STRING_KEYS.LAUNCH_INCENTIVES_DESCRIPTION })}{' '}
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
                  link: 'https://dydx.forum/t/launch-of-season-5-of-the-launch-incentive-program/2725',
                })
              )
            );
          }}
          slotRight={<Icon iconName={IconName.LinkOut} />}
          tw="grow"
        >
          {stringGetter({ key: STRING_KEYS.ABOUT })}
        </$Button>
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
const $Panel = tw(Panel)`bg-layer-3 w-full`;
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

    :first-child {
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
