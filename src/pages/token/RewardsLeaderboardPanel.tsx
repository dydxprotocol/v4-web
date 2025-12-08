import { useCallback, useMemo } from 'react';

import { BonsaiCore } from '@/bonsai/ontology';
import styled from 'styled-components';

import { STRING_KEYS, StringGetterFunction } from '@/constants/localization';

import {
  addRewardsToLeaderboardEntry,
  ChaosLabsFeeLeaderboardItem,
  ChaosLabsFeeLeaderboardItemWithRewards,
  useChaosLabsFeeLeaderboard,
} from '@/hooks/rewards/hooks';
import { CURRENT_SURGE_REWARDS_DETAILS } from '@/hooks/rewards/util';
import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { TrophyIcon } from '@/icons';

import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';
import { ColumnDef, Table } from '@/components/Table';

import { useAppSelector } from '@/state/appTypes';

import { exportCSV } from '@/lib/csv';
import { truncateAddress } from '@/lib/wallet';

export enum RewardsLeaderboardTableColumns {
  Rank = 'Rank',
  Trader = 'Trader',
  Rewards = 'Rewards',
}

export const RewardsLeaderboardPanel = () => {
  const stringGetter = useStringGetter();
  const { dydxAddress } = useAccounts();
  const dydxPrice = useAppSelector(BonsaiCore.rewardParams.data).tokenPrice;
  const { data: feeLeaderboardWithoutRewards, isLoading } = useChaosLabsFeeLeaderboard({
    address: dydxAddress,
  });
  const feeLeaderboard = useMemo(
    () =>
      feeLeaderboardWithoutRewards?.leaderboard.map((entry) =>
        addRewardsToLeaderboardEntry(entry, dydxPrice)
      ),
    [feeLeaderboardWithoutRewards?.leaderboard, dydxPrice]
  );

  const getRowKey = useCallback((row: ChaosLabsFeeLeaderboardItem) => row.rank, []);

  const columns = Object.values(RewardsLeaderboardTableColumns).map(
    (key: RewardsLeaderboardTableColumns) =>
      getRewardsLeaderboardTableColumnDef({
        key,
        stringGetter,
        dydxAddress,
      })
  );

  const onDownload = () => {
    if (!feeLeaderboard) return;

    const csvRows = feeLeaderboard?.map((item) => ({
      rank: item.rank,
      address: item.address,
      estimatedRewards: item.estimatedDydxRewards,
    }));

    exportCSV(csvRows, {
      filename: `rewards-leaderboard-season-${CURRENT_SURGE_REWARDS_DETAILS.season}`,
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

  return (
    <$Panel>
      <div tw="flex flex-col gap-1">
        <div tw="flex items-center justify-between">
          <div tw="font-medium-bold">
            {stringGetter({ key: STRING_KEYS.SURGE_LEADERBOARD_TITLE })}
          </div>
          <button
            onClick={onDownload}
            type="button"
            aria-label={stringGetter({ key: STRING_KEYS.DOWNLOAD })}
          >
            <Icon tw="text-color-text-0" size="1.25rem" iconName={IconName.Download} />
          </button>
        </div>

        <div tw="overflow-hidden rounded-0.5 border border-solid border-color-border">
          <$Table
            label={stringGetter({ key: STRING_KEYS.LEADERBOARD })}
            data={feeLeaderboard ?? []}
            tableId="trading-rewards"
            getRowKey={getRowKey}
            columns={columns}
            defaultSortDescriptor={{
              column: RewardsLeaderboardTableColumns.Rank,
              direction: 'ascending',
            }}
            getIsRowPinned={(row) => {
              return row.address === dydxAddress;
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
            getRowAttributes={({ address }) => ({
              style: {
                backgroundColor: address === dydxAddress ? 'var(--color-accent-faded)' : undefined,
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
}): ColumnDef<ChaosLabsFeeLeaderboardItemWithRewards> => ({
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
        renderCell: ({ rank, address }) => (
          <div tw="flex gap-0.5">
            <div tw="flex items-center justify-center rounded-20 border border-solid border-color-border p-0.5">
              <div tw="flex h-0.5 min-w-0.5 items-center justify-center text-small font-medium">
                {rank}
              </div>
            </div>
            {rank === 1 && <TrophyIcon tw="size-1.5 text-[#e5c346]" />}
            {rank === 2 && <TrophyIcon tw="size-1.5 text-[#c9c9cb]" />}
            {rank === 3 && <TrophyIcon tw="size-1.5 text-[#c37b3f]" />}
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
      [RewardsLeaderboardTableColumns.Trader]: {
        columnKey: RewardsLeaderboardTableColumns.Trader,
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
      [RewardsLeaderboardTableColumns.Rewards]: {
        columnKey: RewardsLeaderboardTableColumns.Rewards,
        getCellValue: (row) => row.estimatedDydxRewards,
        label: (
          <div tw="py-0.375 text-base font-medium text-color-text-0">
            {stringGetter({ key: STRING_KEYS.ESTIMATED_REWARDS })}
          </div>
        ),
        renderCell: ({ estimatedDydxRewards, address }) => (
          <Output
            slotRight=" DYDX"
            css={{
              color: address === dydxAddress ? 'var(--color-accent)' : 'var(--color-text-1)',
            }}
            tw="text-small font-medium"
            type={OutputType.Number}
            value={Number.isNaN(Number(estimatedDydxRewards)) ? 0 : estimatedDydxRewards}
          />
        ),
      },
    } satisfies Record<
      RewardsLeaderboardTableColumns,
      ColumnDef<ChaosLabsFeeLeaderboardItemWithRewards>
    >
  )[key],
});
