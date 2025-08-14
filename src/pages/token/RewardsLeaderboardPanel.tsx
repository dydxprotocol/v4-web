import { useCallback } from 'react';

import styled from 'styled-components';

import { STRING_KEYS, StringGetterFunction } from '@/constants/localization';

import { ChaosLabsLeaderboardItem, useChaosLabsPointsDistribution } from '@/hooks/rewards/hooks';
import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';

import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { Icon, IconName } from '@/components/Icon';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Panel } from '@/components/Panel';
import { ColumnDef, Table } from '@/components/Table';
import { TableCell } from '@/components/Table/TableCell';

export enum RewardsLeaderboardTableColumns {
  Rank = 'Rank',
  Trader = 'Trader',
  Rewards = 'Rewards',
}

export const RewardsLeaderboardPanel = () => {
  const stringGetter = useStringGetter();
  const { data, isLoading } = useChaosLabsPointsDistribution(4);
  const { isNotTablet } = useBreakpoints();

  const getRowKey = useCallback((row: ChaosLabsLeaderboardItem) => row.address, []);

  const columns = Object.values(RewardsLeaderboardTableColumns).map(
    (key: RewardsLeaderboardTableColumns) =>
      getRewardsLeaderboardTableColumnDef({
        key,
        stringGetter,
      })
  );

  const [first, second, third] = (data ?? []).slice(0, 3);

  return (
    <Panel>
      <div tw="flex flex-col gap-1">
        <div tw="font-medium-bold">{stringGetter({ key: STRING_KEYS.LEADERBOARD })}</div>
        <div tw="flex items-center justify-between gap-2 px-1 py-0.5">
          {first && <div>First place: {first.rewards}</div>}
          {second && <div>second place: {second.rewards}</div>}
          {third && <div>third place: {third.rewards}</div>}
        </div>
        <$Table
          data={data ?? []}
          tableId="trading-rewards"
          getRowKey={getRowKey}
          columns={columns}
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
          selectionBehavior="replace"
          withOuterBorder={isNotTablet || data?.length === 0}
          withInnerBorders
          initialPageSize={10}
          withScrollSnapColumns
          withScrollSnapRows
        />
      </div>
    </Panel>
  );
};
const $Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}
  min-width: 1px;

  tbody {
    font: var(--font-small-book);
  }
` as typeof Table;

const getRewardsLeaderboardTableColumnDef = ({
  key,
  stringGetter,
}: {
  key: RewardsLeaderboardTableColumns;
  stringGetter: StringGetterFunction;
}): ColumnDef<ChaosLabsLeaderboardItem> => ({
  ...(
    {
      [RewardsLeaderboardTableColumns.Rank]: {
        columnKey: RewardsLeaderboardTableColumns.Rank,
        getCellValue: (row) => row.rank,
        label: stringGetter({ key: STRING_KEYS.RANK }),
        renderCell: ({ rank }) => (
          <TableCell stacked>
            <div>{rank}</div>
          </TableCell>
        ),
      },
      [RewardsLeaderboardTableColumns.Trader]: {
        columnKey: RewardsLeaderboardTableColumns.Trader,
        getCellValue: (row) => row.address,
        label: stringGetter({ key: STRING_KEYS.TRADER }),
        renderCell: ({ address }) => <div>{address}</div>,
      },
      [RewardsLeaderboardTableColumns.Rewards]: {
        columnKey: RewardsLeaderboardTableColumns.Rewards,
        getCellValue: (row) => row.rewards,
        label: stringGetter({ key: STRING_KEYS.ESTIMATED_REWARDS }),
        renderCell: ({ rewards }) => <div>{rewards}</div>,
      },
    } satisfies Record<RewardsLeaderboardTableColumns, ColumnDef<ChaosLabsLeaderboardItem>>
  )[key],
});
