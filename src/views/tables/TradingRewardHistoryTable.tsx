import { useCallback, useMemo } from 'react';

import { BonsaiHooks } from '@/bonsai/ontology';
import { DateTime } from 'luxon';
import styled from 'styled-components';

import { STRING_KEYS, type StringGetterFunction } from '@/constants/localization';
import { EMPTY_ARR } from '@/constants/objects';
import { IndexerHistoricalTradingRewardAggregation } from '@/types/indexer/indexerApiGen';

import { useBreakpoints } from '@/hooks/useBreakpoints';
import { useStringGetter } from '@/hooks/useStringGetter';
import { useTokenConfigs } from '@/hooks/useTokenConfigs';

import { layoutMixins } from '@/styles/layoutMixins';
import { tradeViewMixins } from '@/styles/tradeViewMixins';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType, ShowSign } from '@/components/Output';
import { Table, type ColumnDef } from '@/components/Table';
import { TableCell } from '@/components/Table/TableCell';

import { calculateCanViewAccount } from '@/state/accountCalculators';
import { useAppSelector } from '@/state/appTypes';

export enum TradingRewardHistoryTableColumnKey {
  Event = 'Event',
  Earned = 'Earned',
}

// Trading rewards should not be smaller than 0.00001
const TRADING_REWARD_FRACTION_DIGITS = 5;

const getTradingRewardHistoryTableColumnDef = ({
  key,
  chainTokenImage,
  chainTokenLabel,
  stringGetter,
}: {
  key: TradingRewardHistoryTableColumnKey;
  chainTokenImage: string;
  chainTokenLabel: string;
  stringGetter: StringGetterFunction;
}): ColumnDef<IndexerHistoricalTradingRewardAggregation> => ({
  ...(
    {
      [TradingRewardHistoryTableColumnKey.Event]: {
        columnKey: TradingRewardHistoryTableColumnKey.Event,
        getCellValue: (row) => row.startedAt,
        label: stringGetter({ key: STRING_KEYS.EVENT }),
        renderCell: ({ startedAt, endedAt }) => (
          <TableCell stacked>
            <span tw="text-color-text-2">{stringGetter({ key: STRING_KEYS.REWARDED })}</span>
            <$TimePeriod>
              {stringGetter({
                key: STRING_KEYS.FOR_TRADING,
                params: {
                  PERIOD: (
                    <>
                      <Output
                        type={OutputType.Date}
                        value={DateTime.fromISO(startedAt).toMillis()}
                        timeOptions={{ useUTC: true }}
                      />
                      →
                      <Output
                        type={OutputType.Date}
                        value={endedAt && DateTime.fromISO(endedAt).toMillis()}
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
        getCellValue: (row) => row.tradingReward,
        label: stringGetter({ key: STRING_KEYS.EARNED }),
        renderCell: ({ tradingReward }) => (
          <Output
            type={OutputType.Asset}
            fractionDigits={TRADING_REWARD_FRACTION_DIGITS}
            value={tradingReward}
            showSign={ShowSign.Both}
            slotRight={<AssetIcon logoUrl={chainTokenImage} symbol={chainTokenLabel} />}
            tw="gap-[0.5ch] [--output-sign-color:--color-positive]"
          />
        ),
      },
    } satisfies Record<
      TradingRewardHistoryTableColumnKey,
      ColumnDef<IndexerHistoricalTradingRewardAggregation>
    >
  )[key],
});

type ElementProps = {
  columnKeys?: TradingRewardHistoryTableColumnKey[];
};

type StyleProps = {
  className?: string;
};

export const TradingRewardHistoryTable = ({
  columnKeys = Object.values(TradingRewardHistoryTableColumnKey),
  className,
}: ElementProps & StyleProps) => {
  const stringGetter = useStringGetter();
  const canViewAccount = useAppSelector(calculateCanViewAccount);
  const { isNotTablet } = useBreakpoints();
  const { chainTokenImage, chainTokenLabel } = useTokenConfigs();
  const { data: tradingRewards, status } = BonsaiHooks.useHistoricalTradingRewards();
  const isLoading = status === 'pending';

  const rewardsData = useMemo(() => {
    return canViewAccount && tradingRewards != null ? tradingRewards : EMPTY_ARR;
  }, [tradingRewards, canViewAccount]);

  const columns = columnKeys.map((key: TradingRewardHistoryTableColumnKey) =>
    getTradingRewardHistoryTableColumnDef({
      key,
      chainTokenImage,
      chainTokenLabel,
      stringGetter,
    })
  );

  const getRowKey = useCallback(
    (row: IndexerHistoricalTradingRewardAggregation) => row.startedAt,
    []
  );

  return (
    <$Table
      className={className}
      label={stringGetter({ key: STRING_KEYS.TRADING_REWARD_HISTORY })}
      data={rewardsData}
      tableId="trading-rewards"
      getRowKey={getRowKey}
      columns={columns}
      slotEmpty={
        isLoading ? (
          <LoadingSpace id="trading-rewards-history" />
        ) : (
          <div tw="flex flex-col items-center gap-1">
            <Icon iconName={IconName.OrderPending} tw="text-[3em]" />
            {stringGetter({ key: STRING_KEYS.TRADING_REWARD_TABLE_EMPTY_STATE })}
          </div>
        )
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
