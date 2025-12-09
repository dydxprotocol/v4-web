import { useMemo, useState } from 'react';

import styled from 'styled-components';

import { CollapsibleTabs } from '@/components/CollapsibleTabs';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';

import {
  SpotHoldingsTable,
  SpotHoldingsTableProps,
  type SpotPositionItem,
} from './SpotHoldingsTable';
import { SpotTradesTable, type SpotTradeItem } from './SpotTradesTable';

type SpotHorizontalPanelProps = {
  holdings?: SpotPositionItem[];
  trades?: SpotTradeItem[];
  isHoldingsLoading?: boolean;
  isTradesLoading?: boolean;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  onRowAction?: SpotHoldingsTableProps['onRowAction'];
  onSellAction?: SpotHoldingsTableProps['onSellAction'];
  handleStartResize?: (e: React.MouseEvent<HTMLElement>) => void;
};

// TODO: spot localization

enum PanelTabs {
  Holdings = 'Holdings',
  Trades = 'Trades',
}

export const SpotHorizontalPanel = ({
  holdings = [],
  trades = [],
  isHoldingsLoading = false,
  isTradesLoading = false,
  isOpen = true,
  setIsOpen,
  onRowAction,
  onSellAction,
  handleStartResize,
}: SpotHorizontalPanelProps) => {
  const [tab, setTab] = useState<PanelTabs>(PanelTabs.Holdings);

  const tabItems = useMemo(
    () => [
      {
        value: PanelTabs.Holdings,
        label: 'Holdings',
        content: isHoldingsLoading ? (
          <LoadingSpace />
        ) : (
          <SpotHoldingsTable
            data={holdings}
            onRowAction={onRowAction}
            onSellAction={onSellAction}
          />
        ),
      },
      {
        value: PanelTabs.Trades,
        label: 'Trades',
        content: isTradesLoading ? <LoadingSpace /> : <SpotTradesTable data={trades} />,
      },
    ],
    [isHoldingsLoading, holdings, onRowAction, onSellAction, isTradesLoading, trades]
  );

  return (
    <>
      <$DragHandle onMouseDown={handleStartResize} />
      <$CollapsibleTabs
        defaultTab={PanelTabs.Holdings}
        tab={tab}
        setTab={setTab}
        defaultOpen={isOpen}
        onOpenChange={setIsOpen}
        dividerStyle="underline"
        tabItems={tabItems}
      />
    </>
  );
};

const $CollapsibleTabs = styled(CollapsibleTabs)`
  header {
    background-color: var(--color-layer-2);
  }

  --trigger-active-underline-backgroundColor: var(--color-layer-2);
` as typeof CollapsibleTabs;

const $DragHandle = styled.div`
  width: 100%;
  height: 0.5rem;
  cursor: ns-resize;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
`;
