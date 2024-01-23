import styled, { type AnyStyledComponent } from 'styled-components';
import { shallowEqual, useSelector } from 'react-redux';

import { HistoricaTradingRewardsPeriods } from '@/constants/abacus';
import { STRING_KEYS, StringGetterFunction } from '@/constants/localization';
import { useStringGetter, useTokenConfigs } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Output, OutputType } from '@/components/Output';
import { Table, TableCell, type ColumnDef } from '@/components/Table';

import { getHistoricalTradingRewards } from '@/state/accountSelectors';

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
}): ColumnDef<any> => ({
  ...(
    {
      [TradingRewardHistoryTableColumnKey.Event]: {
        columnKey: TradingRewardHistoryTableColumnKey.Event,
        getCellValue: (row) => row.startedAtInMilliseconds,
        label: stringGetter({key: STRING_KEYS.EVENT}),
        renderCell: ({ startedAtInMilliseconds, endedAtInMilliseconds }) => (
          <TableCell stacked>
            <Styled.Rewarded>{stringGetter({ key: STRING_KEYS.REWARDED })}</Styled.Rewarded>
            <Styled.TimePeriod>
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
            </Styled.TimePeriod>
          </TableCell>
        ),
      },
      [TradingRewardHistoryTableColumnKey.Earned]: {
        columnKey: TradingRewardHistoryTableColumnKey.Earned,
        getCellValue: (row) => row.amount,
        label: stringGetter({ key: STRING_KEYS.EARNED }),
        renderCell: ({ amount }) => (
          <Output
            type={OutputType.Asset}
            value={amount}
            slotRight={<Styled.AssetIcon symbol={chainTokenLabel} />}
          />
        ),
      },
    } as Record<TradingRewardHistoryTableColumnKey, ColumnDef<any>>
  )[key],
});

type ElementProps = {
  columnKeys?: TradingRewardHistoryTableColumnKey[];
  period: HistoricaTradingRewardsPeriods;
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
  const historicalTradingRewards = useSelector(getHistoricalTradingRewards, shallowEqual);
  const periodTradingRewards = historicalTradingRewards?.get(period.name) ?? [];
  const { chainTokenLabel } = useTokenConfigs();
  const stringGetter = useStringGetter();

  return (
    <Styled.Table
      label={stringGetter({ key: STRING_KEYS.REWARD_HISTORY })}
      data={periodTradingRewards}
      getRowKey={(row: any) => row.startedAtInMilliseconds}
      columns={columnKeys.map((key: TradingRewardHistoryTableColumnKey) =>
        getTradingRewardHistoryTableColumnDef({
          key,
          chainTokenLabel,
          stringGetter
        })
      )}
      selectionBehavior="replace"
      withOuterBorder={withOuterBorder}
      withInnerBorders={withInnerBorders}
      initialNumRowsToShow={5}
      withScrollSnapColumns
      withScrollSnapRows
    />
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Table = styled(Table)`
  --tableCell-padding: 0.5rem 0;
  --tableHeader-backgroundColor: var(--color-layer-3);
  --tableRow-backgroundColor: var(--color-layer-3);
  --tableViewMore-borderColor: var(--color-layer-3);

  tbody {
    font: var(--font-medium-book);
  }
`;

Styled.Rewarded = styled.span`
  color: var(--color-text-2);
`;

Styled.TimePeriod = styled.div`
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

Styled.AssetIcon = styled(AssetIcon)`
  margin-left: 0.5ch;
`;
