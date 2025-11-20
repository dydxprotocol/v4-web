import { useMemo, useState } from 'react';

import styled from 'styled-components';

import { CollapsibleTabs } from '@/components/CollapsibleTabs';

import {
  SpotHoldingsTable,
  SpotHoldingsTableProps,
  type SpotPositionItem,
} from './SpotHoldingsTable';
import { SpotTradesTable, type SpotTradeItem } from './SpotTradesTable';

type SpotHorizontalPanelProps = {
  data: SpotPositionItem[];
  trades?: SpotTradeItem[];
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  onRowAction?: SpotHoldingsTableProps['onRowAction'];
  onSellAction?: SpotHoldingsTableProps['onSellAction'];
};

// TODO: spot localization

enum PanelTabs {
  Holdings = 'Holdings',
  Trades = 'Trades',
}

export const SpotHorizontalPanel = ({
  data,
  trades = [],
  isOpen = true,
  setIsOpen,
  onRowAction,
  onSellAction,
}: SpotHorizontalPanelProps) => {
  const [tab, setTab] = useState<PanelTabs>(PanelTabs.Holdings);

  const tabItems = useMemo(
    () => [
      {
        value: PanelTabs.Holdings,
        label: 'Holdings',
        content: (
          <SpotHoldingsTable data={data} onRowAction={onRowAction} onSellAction={onSellAction} />
        ),
      },
      {
        value: PanelTabs.Trades,
        label: 'Trades',
        content: <SpotTradesTable data={trades} />,
      },
    ],
    [data, trades, onRowAction, onSellAction]
  );

  return (
    <$CollapsibleTabs
      defaultTab={PanelTabs.Holdings}
      tab={tab}
      setTab={setTab}
      defaultOpen={isOpen}
      onOpenChange={setIsOpen}
      dividerStyle="underline"
      tabItems={tabItems}
    />
  );
};

const $CollapsibleTabs = styled(CollapsibleTabs)`
  header {
    background-color: var(--color-layer-2);
  }

  --trigger-active-underline-backgroundColor: var(--color-layer-2);
` as typeof CollapsibleTabs;
