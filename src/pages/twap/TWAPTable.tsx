import React, { useMemo, useState } from 'react';

import { Tabs, type TabItem } from '@/components/Tabs';

import { ActiveTWAPTable, ActiveTWAPTableColumnKey } from './ActiveTWAPTable';

export enum TwapTableTab {
  Active = 'Active',
  History = 'History',
  Fills = 'Fills',
}

export const TWAPTable: React.FC = () => {
  const [tab, setTab] = useState<TwapTableTab>(TwapTableTab.Active);

  const tabItems: TabItem<TwapTableTab>[] = useMemo(
    () => [
      {
        value: TwapTableTab.Active,
        label: 'Active',
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
    ],
    []
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
};
