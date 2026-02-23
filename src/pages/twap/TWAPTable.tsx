import { forwardRef, useMemo, useState } from 'react';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Tabs, type TabItem } from '@/components/Tabs';

import { ActiveTWAPTable, ActiveTWAPTableColumnKey } from './ActiveTWAPTable';
import { TWAPFillsTable, TWAPFillsTableColumnKey } from './TWAPFillsTable';
import { TWAPOrderHistoryTable, TWAPOrderHistoryTableColumnKey } from './TWAPOrderHistoryTable';

export enum TwapTableTab {
  Active = 'Active',
  History = 'History',
  Fills = 'Fills',
}

export const TWAPTable = forwardRef((_props, _ref) => {
  const [tab, setTab] = useState<TwapTableTab>(TwapTableTab.Active);
  const stringGetter = useStringGetter();

  const tabItems: TabItem<TwapTableTab>[] = useMemo(
    () => [
      {
        value: TwapTableTab.Active,
        label: stringGetter({ key: STRING_KEYS.ACTIVE }),
        content: (
          <ActiveTWAPTable
            columnKeys={[
              ActiveTWAPTableColumnKey.Market,
              ActiveTWAPTableColumnKey.Side,
              ActiveTWAPTableColumnKey.Execution,
              ActiveTWAPTableColumnKey.AveragePrice,
              ActiveTWAPTableColumnKey.Runtime,
              ActiveTWAPTableColumnKey.ReduceOnly,
              ActiveTWAPTableColumnKey.OrderTime,
              ActiveTWAPTableColumnKey.Terminate,
            ]}
          />
        ),
      },
      {
        value: TwapTableTab.History,
        label: stringGetter({ key: STRING_KEYS.HISTORY }),
        content: (
          <TWAPOrderHistoryTable
            columnKeys={[
              TWAPOrderHistoryTableColumnKey.OrderTime,
              TWAPOrderHistoryTableColumnKey.Market,
              TWAPOrderHistoryTableColumnKey.Execution,
              TWAPOrderHistoryTableColumnKey.AveragePrice,
              TWAPOrderHistoryTableColumnKey.Runtime,
              TWAPOrderHistoryTableColumnKey.ReduceOnly,
              TWAPOrderHistoryTableColumnKey.Status,
            ]}
          />
        ),
      },
      {
        value: TwapTableTab.Fills,
        label: stringGetter({ key: STRING_KEYS.FILLS }),
        content: (
          <TWAPFillsTable
            columnKeys={[
              TWAPFillsTableColumnKey.OrderTime,
              TWAPFillsTableColumnKey.Market,
              TWAPFillsTableColumnKey.Side,
              TWAPFillsTableColumnKey.AveragePrice,
              TWAPFillsTableColumnKey.Size,
              TWAPFillsTableColumnKey.TradeValue,
              TWAPFillsTableColumnKey.Fee,
              TWAPFillsTableColumnKey.PnL,
            ]}
          />
        ),
      },
    ],
    [stringGetter]
  );

  return (
    <Tabs
      value={tab}
      onValueChange={setTab}
      items={tabItems}
      fullWidthTabs={false}
      dividerStyle="underline"
    />
  );
});
