import { useCallback, useMemo } from 'react';

import { kollections } from '@dydxprotocol/v4-abacus';
import styled from 'styled-components';

import {
  HistoricalTradingReward,
  HistoricalTradingRewardsPeriods,
  Nullable,
} from '@/constants/abacus';
import { STRING_KEYS, type StringGetterFunction } from '@/constants/localization';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useParameterizedSelector } from '@/hooks/useParameterizedSelector';
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
import { useAppSelector } from '@/state/appTypes';

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
          <$PositiveOutput
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
  className?: string;
};

export const TradingRewardHistoryTable = ({
  period,
  columnKeys = Object.values(TradingRewardHistoryTableColumnKey),
  className,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const canViewAccount = useAppSelector(calculateCanViewAccount);
  const { isNotTablet } = useBreakpoints();
  const { chainTokenLabel } = useTokenConfigs();

  const periodTradingRewards: Nullable<kollections.List<HistoricalTradingReward>> =
    useParameterizedSelector(getHistoricalTradingRewardsForPeriod, period.name);

  const rewardsData = useMemo(() => {
    return periodTradingRewards && canViewAccount ? periodTradingRewards.toArray() : [];
  }, [periodTradingRewards, canViewAccount]);

  const columns = columnKeys.map((key: TradingRewardHistoryTableColumnKey) =>
    getTradingRewardHistoryTableColumnDef({
      key,
      chainTokenLabel,
      stringGetter,
    })
  );

  const getRowKey = useCallback((row: any) => row.startedAtInMilliseconds, []);

  return (
    <$Table
      className={className}
      label={stringGetter({ key: STRING_KEYS.TRADING_REWARD_HISTORY })}
      data={rewardsData}
      getRowKey={getRowKey}
      columns={columns}
      slotEmpty={
        <$Column>
          <$EmptyIcon iconName={IconName.OrderPending} />
          {stringGetter({ key: STRING_KEYS.TRADING_REWARD_TABLE_EMPTY_STATE })}
        </$Column>
      }
      selectionBehavior="replace"
      withOuterBorder={isNotTablet || rewardsData.length === 0}
      withInnerBorders
      initialPageSize={15}
      withScrollSnapColumns
      withScrollSnapRows
    />
  );
};

const $Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}
  min-width: 1px;

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

const $PositiveOutput = styled(Output)`
  --output-sign-color: var(--color-positive);
  gap: 0.5ch;
`;
