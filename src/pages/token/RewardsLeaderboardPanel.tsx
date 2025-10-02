import { ReactNode, useCallback } from 'react';

import styled from 'styled-components';

import { ButtonStyle } from '@/constants/buttons';
import { STRING_KEYS, StringGetterFunction } from '@/constants/localization';

import { ChaosLabsLeaderboardItem, useChaosLabsPointsDistribution } from '@/hooks/rewards/hooks';
import { OCT_2025_REWARDS_DETAILS } from '@/hooks/rewards/util';
import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import BadgeRank1 from '@/icons/badge-rank-1.svg';
import BadgeRank2 from '@/icons/badge-rank-2.svg';
import BadgeRank3 from '@/icons/badge-rank-3.svg';

import { CopyButton } from '@/components/CopyButton';
import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';
import { ColumnDef, Table } from '@/components/Table';

import { exportCSV } from '@/lib/csv';
import { truncateAddress } from '@/lib/wallet';

export enum RewardsLeaderboardTableColumns {
  Rank = 'Rank',
  Trader = 'Trader',
  Rewards = 'Rewards',
}

const Top3Item = ({ item, icon }: { item: ChaosLabsLeaderboardItem; icon: ReactNode }) => {
  return (
    <div tw="flex gap-0.5">
      {icon}
      <div tw="flex flex-col gap-0.125">
        <div tw="flex items-center text-small font-medium text-color-text-1">
          <div> {truncateAddress(item.account)}</div>
          <CopyButton
            buttonType="icon"
            value={item.account}
            buttonStyle={ButtonStyle.WithoutBackground}
          />
        </div>

        <Output
          tw="text-large font-bold text-color-text-2"
          value={item.estimatedDydxRewards}
          type={OutputType.CompactNumber}
          slotRight={
            <div tw="mb-0.125 ml-0.5 self-end text-small font-medium text-color-text-0">dYdX</div>
          }
        />
      </div>
    </div>
  );
};

export const RewardsLeaderboardPanel = () => {
  const stringGetter = useStringGetter();
  const { data, isLoading } = useChaosLabsPointsDistribution();
  const { dydxAddress } = useAccounts();

  const getRowKey = useCallback((row: ChaosLabsLeaderboardItem) => row.rank, []);

  const columns = Object.values(RewardsLeaderboardTableColumns).map(
    (key: RewardsLeaderboardTableColumns) =>
      getRewardsLeaderboardTableColumnDef({
        key,
        stringGetter,
        dydxAddress,
      })
  );

  const onDownload = () => {
    if (!data) return;

    const csvRows = data.map((item) => ({
      rank: item.rank,
      address: item.account,
      estimatedRewards: item.estimatedDydxRewards,
    }));

    exportCSV(csvRows, {
      filename: `rewards-leaderboard-season-${OCT_2025_REWARDS_DETAILS.season}`,
      columnHeaders: [
        {
          key: 'rank',
          displayLabel: stringGetter({ key: STRING_KEYS.RANK }),
        },
        {
          key: 'address',
          displayLabel: stringGetter({ key: STRING_KEYS.TRADER }),
        },
        {
          key: 'estimatedRewards',
          displayLabel: stringGetter({ key: STRING_KEYS.ESTIMATED_REWARDS }),
        },
      ],
    });
  };

  const [first, second, third] = (data ?? []).slice(0, 3);

  return (
    <$Panel>
      <div tw="flex flex-col gap-1">
        <div tw="flex items-center justify-between">
          <div tw="font-medium-bold">{stringGetter({ key: STRING_KEYS.LEADERBOARD })}</div>
          <button
            onClick={onDownload}
            type="button"
            aria-label={stringGetter({ key: STRING_KEYS.DOWNLOAD })}
          >
            <Icon tw="text-color-text-0" size="1.25rem" iconName={IconName.Download} />
          </button>
        </div>

        <div tw="flex items-center justify-between gap-2 px-1.5 py-0.5 pr-2">
          {first && <Top3Item icon={<BadgeRank1 />} item={first} />}
          {second && <Top3Item icon={<BadgeRank2 />} item={second} />}
          {third && <Top3Item icon={<BadgeRank3 />} item={third} />}
        </div>
        <div tw="overflow-hidden rounded-0.5 border border-solid border-color-border">
          <$Table
            label={stringGetter({ key: STRING_KEYS.LEADERBOARD })}
            data={data ?? []}
            tableId="trading-rewards"
            getRowKey={getRowKey}
            columns={columns}
            defaultSortDescriptor={{
              column: RewardsLeaderboardTableColumns.Rank,
              direction: 'ascending',
            }}
            getIsRowPinned={(row) => {
              return row.account === dydxAddress;
            }}
            slotEmpty={
              isLoading ? (
                <LoadingSpace id="rewards-leaderboard" />
              ) : (
                <div tw="flex flex-col items-center gap-1">
                  <Icon iconName={IconName.OrderPending} tw="text-[3em]" />
                  {stringGetter({ key: STRING_KEYS.TRADING_REWARD_TABLE_EMPTY_STATE })}
                </div>
              )
            }
            getRowAttributes={({ account }) => ({
              style: {
                backgroundColor: account === dydxAddress ? 'var(--color-accent-faded)' : undefined,
              },
            })}
            selectionBehavior="replace"
            withInnerBorders
            initialPageSize={10}
            withScrollSnapColumns
            withScrollSnapRows
          />
        </div>
      </div>
    </$Panel>
  );
};

const $Panel = styled(Panel)`
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
  tbody {
    font: var(--font-small-book);
  }
` as typeof Table;

const getTraderLink = (address: string) => {
  return `https://community.chaoslabs.xyz/dydx-v4/risk/accounts/${address}/subAccount/0/overview`;
};

const getRewardsLeaderboardTableColumnDef = ({
  key,
  stringGetter,
  dydxAddress,
}: {
  key: RewardsLeaderboardTableColumns;
  stringGetter: StringGetterFunction;
  dydxAddress?: string;
}): ColumnDef<ChaosLabsLeaderboardItem> => ({
  ...(
    {
      [RewardsLeaderboardTableColumns.Rank]: {
        columnKey: RewardsLeaderboardTableColumns.Rank,
        getCellValue: (row) => row.rank,
        label: (
          <div tw="py-0.375 text-base font-medium text-color-text-0">
            {stringGetter({ key: STRING_KEYS.RANK })}
          </div>
        ),
        renderCell: ({ rank, account }) => (
          <div tw="flex gap-0.5">
            <div tw="flex items-center justify-center rounded-20 border border-solid border-color-border p-0.5">
              <div tw="flex h-0.5 min-w-0.5 items-center justify-center text-small font-medium">
                {rank}
              </div>
            </div>
            {account === dydxAddress && (
              <div tw="flex items-center justify-center rounded-20 border border-solid border-color-accent px-0.5">
                <span tw="text-small font-medium text-color-accent">
                  {stringGetter({ key: STRING_KEYS.YOU })}
                </span>
              </div>
            )}
          </div>
        ),
      },
      [RewardsLeaderboardTableColumns.Trader]: {
        columnKey: RewardsLeaderboardTableColumns.Trader,
        getCellValue: (row) => row.account,
        label: (
          <div tw="py-0.375 text-base font-medium text-color-text-0">
            {stringGetter({ key: STRING_KEYS.TRADER })}
          </div>
        ),
        renderCell: ({ account }) => (
          <div
            css={{ color: account === dydxAddress ? 'var(--color-accent)' : 'var(--color-text-1)' }}
            tw="flex items-center gap-0.5 text-small font-medium"
          >
            {truncateAddress(account)}
            <Link
              css={{
                color: account === dydxAddress ? 'var(--color-accent)' : 'var(--color-text-0)',
              }}
              href={getTraderLink(account)}
              iconSize="1rem"
              isNewPage
              withIcon
            />
          </div>
        ),
      },
      [RewardsLeaderboardTableColumns.Rewards]: {
        columnKey: RewardsLeaderboardTableColumns.Rewards,
        getCellValue: (row) => row.estimatedDydxRewards,
        label: (
          <div tw="py-0.375 text-base font-medium text-color-text-0">
            {stringGetter({ key: STRING_KEYS.ESTIMATED_REWARDS })}
          </div>
        ),
        renderCell: ({ estimatedDydxRewards, account }) => (
          <Output
            slotRight=" DYDX"
            css={{ color: account === dydxAddress ? 'var(--color-accent)' : 'var(--color-text-1)' }}
            tw="text-small font-medium"
            type={OutputType.Number}
            value={estimatedDydxRewards}
          />
        ),
      },
    } satisfies Record<RewardsLeaderboardTableColumns, ColumnDef<ChaosLabsLeaderboardItem>>
  )[key],
});
