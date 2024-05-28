import { useMemo } from 'react';

import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { HistoricalTradingReward, HistoricalTradingRewardsPeriods } from '@/constants/abacus';
import { STRING_KEYS, type StringGetterFunction } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { Table, type ColumnDef } from '@/components/Table';
import { TableCell } from '@/components/Table/TableCell';

import { calculateCanViewAccount } from '@/state/accountCalculators';
import { getHistoricalTradingRewardsForPeriod } from '@/state/accountSelectors';

export enum TradingRewardHistoryTableColumnKey {
  Event = 'Event',
  Earned = 'Earned',
}

const getTradingRewardHistoryTableColumnDef = ({
  key,
  chainTokenLabel,
  stringGetter,
}: {
  key: TradingRewardHistoryTableColumnKey;
  chainTokenLabel: string;
  stringGetter: StringGetterFunction;
}): ColumnDef<HistoricalTradingReward> => ({
  ...(
    {
      [TradingRewardHistoryTableColumnKey.Event]: {
        columnKey: TradingRewardHistoryTableColumnKey.Event,
        getCellValue: (row) => row.startedAtInMilliseconds,
        label: stringGetter({ key: STRING_KEYS.EVENT }),
        renderCell: ({ startedAtInMilliseconds, endedAtInMilliseconds }) => (
          <TableCell stacked>
            <$Rewarded>{stringGetter({ key: STRING_KEYS.REWARDED })}</$Rewarded>
            <$TimePeriod>
              {stringGetter({
                key: STRING_KEYS.FOR_TRADING,
                params: {
                  PERIOD: (
                    <>
                      <Output
                        type={OutputType.Date}
                        value={startedAtInMilliseconds}
                        timeOptions={{ useUTC: true }}
                      />
                      →
                      <Output
                        type={OutputType.Date}
                        value={endedAtInMilliseconds}
                        timeOptions={{ useUTC: true }}
                      />
                    </>
                  ),
                },
              })}
            </$TimePeriod>
          </TableCell>
        ),
      },
      [TradingRewardHistoryTableColumnKey.Earned]: {
        columnKey: TradingRewardHistoryTableColumnKey.Earned,
        getCellValue: (row) => row.amount,
        label: stringGetter({ key: STRING_KEYS.EARNED }),
        renderCell: ({ amount }) => (
          <$Output
            type={OutputType.Asset}
            value={amount}
            showSign={ShowSign.Both}
            slotRight={<AssetIcon symbol={chainTokenLabel} />}
          />
        ),
      },
    } satisfies Record<TradingRewardHistoryTableColumnKey, ColumnDef<HistoricalTradingReward>>
  )[key],
});

type ElementProps = {
  columnKeys?: TradingRewardHistoryTableColumnKey[];
  period: HistoricalTradingRewardsPeriods;
};

type StyleProps = {
  withOuterBorder?: boolean;
  withInnerBorders?: boolean;
};

export const TradingRewardHistoryTable = ({
  period,
  columnKeys = Object.values(TradingRewardHistoryTableColumnKey),
  withOuterBorder,
  withInnerBorders = true,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const canViewAccount = useSelector(calculateCanViewAccount);
  const { chainTokenLabel } = useTokenConfigs();

  const periodTradingRewards = useSelector(
    getHistoricalTradingRewardsForPeriod(period.name),
    shallowEqual
  );

  const rewardsData = useMemo(() => {
    return periodTradingRewards && canViewAccount ? periodTradingRewards.toArray() : [];
  }, [periodTradingRewards, canViewAccount]);

  return (
    <$Table
      label={stringGetter({ key: STRING_KEYS.TRADING_REWARD_HISTORY })}
      data={rewardsData}
      getRowKey={(row: any) => row.startedAtInMilliseconds}
      columns={columnKeys.map((key: TradingRewardHistoryTableColumnKey) =>
        getTradingRewardHistoryTableColumnDef({
          key,
          chainTokenLabel,
          stringGetter,
        })
      )}
      slotEmpty={
        <$Column>
          <$EmptyIcon iconName={IconName.OrderPending} />
          {stringGetter({ key: STRING_KEYS.TRADING_REWARD_TABLE_EMPTY_STATE })}
        </$Column>
      }
      selectionBehavior="replace"
      withOuterBorder={withOuterBorder}
      withInnerBorders={withInnerBorders}
      initialPageSize={15}
      withScrollSnapColumns
      withScrollSnapRows
    />
  );
};

const $Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}

  tr {
    &:after {
      content: '';
    }
  }

  tbody {
    font: var(--font-small-book);
  }
` as typeof Table;

const $Rewarded = styled.span`
  color: var(--color-text-2);
`;

const $TimePeriod = styled.div`
  ${layoutMixins.inlineRow}

  && {
    color: var(--color-text-0);
    font: var(--font-base-book);
  }

  output {
    color: var(--color-text-1);
    font: var(--font-base-book);
  }
`;

const $Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const $EmptyIcon = styled(Icon)`
  font-size: 3em;
`;

const $Output = styled(Output)`
  --output-sign-color: var(--color-positive);
  gap: 0.5ch;
`;
