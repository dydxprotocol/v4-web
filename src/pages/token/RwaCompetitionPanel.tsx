import { useCallback, useEffect, useMemo, useState } from 'react';

import { Duration } from 'luxon';
import styled from 'styled-components';
import tw from 'twin.macro';

import { STRING_KEYS, StringGetterFunction } from '@/constants/localization';

import { type RwaMarketPnlItem, useRwaMarketPnl } from '@/hooks/rewards/hooks';
import {
  RWA_COMPETITION_DETAILS,
  RWA_COMPETITION_WEEKS,
  getActiveRwaWeek,
  positionToRwaRewards,
} from '@/hooks/rewards/util';
import { useAccounts } from '@/hooks/useAccounts';
import { useNow } from '@/hooks/useNow';
import { useStringGetter } from '@/hooks/useStringGetter';

import { TrophyIcon } from '@/icons';

import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';
import { ColumnDef, Table } from '@/components/Table';
import { SuccessTag, PrivateTag, TagSize } from '@/components/Tag';

import { truncateAddress } from '@/lib/wallet';

const PRIZE_TIERS = [
  { place: '1st', amount: '$3,000' },
  { place: '2nd', amount: '$2,000' },
  { place: '3rd', amount: '$1,000' },
  { place: '4th-5th', amount: '$750' },
  { place: '6th-10th', amount: '$500' },
];

export const RwaCompetitionPanel = () => {
  const activeWeek = getActiveRwaWeek();
  const { market, week } = useRwaMarketPnl();

  const displayWeek = activeWeek ?? RWA_COMPETITION_WEEKS[RWA_COMPETITION_WEEKS.length - 1]!;
  const competitionStart = new Date(RWA_COMPETITION_DETAILS.startTime);
  const competitionEnd = new Date(RWA_COMPETITION_DETAILS.endTime);
  const now = new Date();
  const isActive = now >= competitionStart && now < competitionEnd;
  const hasEnded = now >= competitionEnd;

  return (
    <div tw="flexColumn gap-1.5">
      <$InfoPanel>
        <div tw="flex gap-3 pb-0.25 pt-0.5">
          <div tw="flex flex-1 flex-col gap-1.5">
            <div tw="flex flex-col gap-0.5">
              <div tw="flex flex-wrap items-center gap-0.5 gap-y-0.25">
                <span tw="font-medium-bold">
                  RWA Trading Competition{market ? ` — ${market}` : ''}
                </span>
                {isActive ? (
                  <SuccessTag size={TagSize.Medium}>Active</SuccessTag>
                ) : hasEnded ? (
                  <PrivateTag size={TagSize.Medium}>Ended</PrivateTag>
                ) : (
                  <PrivateTag size={TagSize.Medium}>Upcoming</PrivateTag>
                )}
              </div>

              <span tw="text-color-text-0">
                Compete for {RWA_COMPETITION_DETAILS.rewardAmount} in prizes across 3 weekly RWA
                trading sprints. Top 10 traders each week win.
              </span>

              <div>
                <p tw="font-semibold">Rules</p>
                <ul tw="list-outside list-disc pl-1.5 text-color-text-0">
                  <li>Trade the designated RWA market each week using Bonk</li>
                  <li>PnL is calculated from fully closed positions only</li>
                  <li>Leaderboard updates multiple times daily</li>
                </ul>
              </div>

              <span tw="text-small text-color-text-0">
                Starting on April 14th, winners of each week can claim rewards and check eligibility
                <a href="https://dydx-unlimited-lp.webflow.io/bonk-trading-competition-claims" target="_blank" rel="noopener noreferrer">here</a>. Rewards are distributed within 30 days of a valid claim and must be claimed
                within 30 days after the trading competition ends.
              </span>
            </div>

            {!hasEnded && (
              <div tw="flex items-center gap-0.25 self-start rounded-3 bg-color-layer-1 px-0.875 py-0.5">
                <Icon iconName={IconName.Clock} size="1.25rem" tw="text-color-accent" />
                <div tw="flex gap-0.375 px-0.375 leading-none">
                  <WeekCountdown endTime={displayWeek.endDate} />
                </div>
              </div>
            )}
          </div>
        </div>
      </$InfoPanel>

      <RwaLeaderboardTable />
    </div>
  );
};

const RwaLeaderboardTable = () => {
  const stringGetter = useStringGetter();
  const { data: pnlItems, isLoading, market } = useRwaMarketPnl();
  const { dydxAddress } = useAccounts();

  const getRowKey = useCallback((row: RwaMarketPnlItem) => row.position, []);

  const columns = Object.values(RwaTableColumns).map((key: RwaTableColumns) =>
    getRwaTableColumnDef({ key, stringGetter, dydxAddress })
  );

  const userRow = pnlItems?.find((item) => item.address === dydxAddress);
  const data = [
    ...new Set([...(userRow ? [userRow] : []), ...(pnlItems?.filter((item) => item.pnl !== 0) ?? [])]),
  ];

  return (
    <$LeaderboardPanel>
      <div tw="flex flex-col gap-1">
        <div tw="flex items-center justify-between">
          <div tw="flex items-center gap-0.5">
            <span tw="font-medium-bold">Leaderboard</span>
            {market && <span tw="text-small text-color-text-0">({market})</span>}
          </div>
        </div>
        <div tw="overflow-hidden rounded-0.5 border border-solid border-color-border">
          <$Table
            label="RWA Trading Competition Leaderboard"
            data={data}
            tableId="rwa-market-pnl"
            getRowKey={getRowKey}
            columns={columns}
            defaultSortDescriptor={{
              column: RwaTableColumns.Rank,
              direction: 'ascending',
            }}
            getIsRowPinned={(row) => row.address === dydxAddress}
            slotEmpty={
              isLoading ? (
                <LoadingSpace id="rwa-market-pnl-leaderboard" />
              ) : (
                <div tw="flex flex-col items-center gap-1">
                  <Icon iconName={IconName.OrderPending} tw="text-[3em]" />
                  No data available yet
                </div>
              )
            }
            getRowAttributes={({ address }) => ({
              style: {
                backgroundColor: address === dydxAddress ? 'var(--color-accent-faded)' : undefined,
              },
            })}
            selectionBehavior="replace"
            initialPageSize={10}
            withInnerBorders
            withScrollSnapColumns
            withScrollSnapRows
          />
        </div>
      </div>
    </$LeaderboardPanel>
  );
};

enum RwaTableColumns {
  Rank = 'Rank',
  Trader = 'Trader',
  PNL = 'PNL',
  Prize = 'Prize',
}

const getTraderLink = (address: string) => `https://www.mintscan.io/dydx/address/${address}`;

const getRwaTableColumnDef = ({
  key,
  stringGetter,
  dydxAddress,
}: {
  key: RwaTableColumns;
  stringGetter: StringGetterFunction;
  dydxAddress?: string;
}): ColumnDef<RwaMarketPnlItem> => ({
  ...(
    {
      [RwaTableColumns.Rank]: {
        columnKey: RwaTableColumns.Rank,
        getCellValue: (row) => row.position,
        label: (
          <div tw="py-0.375 text-base font-medium text-color-text-0">
            {stringGetter({ key: STRING_KEYS.RANK })}
          </div>
        ),
        renderCell: ({ position, address }) => (
          <div tw="flex items-center gap-0.5">
            <div tw="flex items-center justify-center rounded-20 border border-solid border-color-border p-0.5">
              <div tw="flex h-0.5 min-w-0.5 items-center justify-center text-small font-medium">
                {position}
              </div>
            </div>
            {position === 1 && <TrophyIcon tw="size-1 text-[#e5c346]" />}
            {position === 2 && <TrophyIcon tw="size-1 text-[#c9c9cb]" />}
            {position === 3 && <TrophyIcon tw="size-1 text-[#c37b3f]" />}
            {address === dydxAddress && (
              <div tw="flex items-center justify-center rounded-20 border border-solid border-color-accent px-0.5">
                <span tw="text-small font-medium text-color-accent">
                  {stringGetter({ key: STRING_KEYS.YOU })}
                </span>
              </div>
            )}
          </div>
        ),
      },
      [RwaTableColumns.Trader]: {
        columnKey: RwaTableColumns.Trader,
        getCellValue: (row) => row.address,
        label: (
          <div tw="py-0.375 text-base font-medium text-color-text-0">
            {stringGetter({ key: STRING_KEYS.TRADER })}
          </div>
        ),
        renderCell: ({ address }) => (
          <div
            css={{ color: address === dydxAddress ? 'var(--color-accent)' : 'var(--color-text-1)' }}
            tw="flex items-center gap-0.5 text-small font-medium"
          >
            {truncateAddress(address)}
            <Link
              css={{
                color: address === dydxAddress ? 'var(--color-accent)' : 'var(--color-text-0)',
              }}
              href={getTraderLink(address)}
              iconSize="1rem"
              isNewPage
              withIcon
            />
          </div>
        ),
      },
      [RwaTableColumns.PNL]: {
        columnKey: RwaTableColumns.PNL,
        getCellValue: (row) => row.pnl,
        label: (
          <div tw="py-0.375 text-base font-medium text-color-text-0">
            {stringGetter({ key: STRING_KEYS.PNL })}
          </div>
        ),
        renderCell: ({ pnl }) => (
          <Output
            css={{ color: pnl >= 0 ? 'var(--color-positive)' : 'var(--color-negative)' }}
            tw="text-small font-medium"
            type={OutputType.Fiat}
            value={pnl}
          />
        ),
      },
      [RwaTableColumns.Prize]: {
        columnKey: RwaTableColumns.Prize,
        getCellValue: (row) => row.position,
        label: (
          <div tw="py-0.375 text-base font-medium text-color-text-0">Prize</div>
        ),
        renderCell: ({ position }) => (
          <Output
            tw="text-small font-medium"
            type={OutputType.Fiat}
            fractionDigits={0}
            value={positionToRwaRewards(position)}
          />
        ),
      },
    } satisfies Record<RwaTableColumns, ColumnDef<RwaMarketPnlItem>>
  )[key],
});

const WeekCountdown = ({ endTime }: { endTime: string }) => {
  const targetMs = Date.parse(endTime);
  const now = useNow();
  const [msLeft, setMsLeft] = useState(Math.max(0, Math.floor(targetMs - Date.now())));

  useEffect(() => {
    if (now > targetMs) return;
    setMsLeft(Math.max(0, Math.floor(targetMs - now)));
  }, [now, targetMs]);

  const formatted = useMemo(() => {
    return Duration.fromMillis(msLeft)
      .shiftTo('days', 'hours', 'minutes', 'seconds')
      .toFormat("d'd' h'h' m'm' s's'", { floor: true });
  }, [msLeft]);

  return <div>{formatted}</div>;
};

const $InfoPanel = tw(Panel)`bg-color-layer-3 w-full`;

const $LeaderboardPanel = styled(Panel)`
  --panel-content-paddingY: 1.5rem;
  --panel-content-paddingX: 1.5rem;
`;

const $Table = styled(Table)`
  --tableCell-padding: 0.25rem;
  font: var(--font-mini-book);
  --stickyArea-background: transparent;

  table {
    --stickyArea-background: transparent;
  }

  thead,
  tbody {
    --stickyArea-background: transparent;
    tr {
      td:first-of-type,
      th:first-of-type {
        --tableCell-padding: 0.5rem 0.25rem 0.5rem 1rem;
      }
      td:last-of-type,
      th:last-of-type {
        --tableCell-padding: 0.5rem 1rem 0.5rem 0.25rem;
      }
    }
  }

  tbody {
    font: var(--font-small-book);
  }

  tfoot {
    --stickyArea-background: transparent;
    --tableCell-padding: 0.5rem 1rem 0.5rem 1rem;
  }

  min-width: 1px;
` as typeof Table;
