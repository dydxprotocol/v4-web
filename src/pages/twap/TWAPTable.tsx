import React, { useState } from 'react';

import { Tabs, type TabItem } from '@/components/Tabs';

import { ActiveTWAPTable, ActiveTWAPTableColumnKey } from './ActiveTWAPTable';

const tabItems: TabItem<string>[] = [
  {
    value: 'Active',
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
  {
    value: 'OrderHistory',
    label: 'Order History',
    content: (
      <div>
        <h1>Order History</h1>
      </div>
    ),
  },
  {
    value: 'Fills',
    label: 'Fills',
    content: (
      <div>
        <h1>Fills</h1>
      </div>
    ),
  },
];

export const TWAPTable: React.FC = () => {
  const [tab, setTab] = useState('Active');

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
