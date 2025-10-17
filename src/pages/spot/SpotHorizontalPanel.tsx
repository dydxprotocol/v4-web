import { useMemo } from 'react';

import styled from 'styled-components';

import { CollapsibleTabs } from '@/components/CollapsibleTabs';

import {
  SpotHoldingsTable,
  SpotHoldingsTableProps,
  type SpotHoldingRow,
} from './SpotHoldingsTable';

type SpotHorizontalPanelProps = {
  data: SpotHoldingRow[];
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  onRowAction?: SpotHoldingsTableProps['onRowAction'];
  onSellAction?: SpotHoldingsTableProps['onSellAction'];
};

// TODO: spot localization

export const SpotHorizontalPanel = ({
  data,
  isOpen = true,
  setIsOpen,
  onRowAction,
  onSellAction,
}: SpotHorizontalPanelProps) => {
  const tabItems = useMemo(
    () => [
      {
        value: 'Holdings',
        label: 'Holdings',
        content: (
          <SpotHoldingsTable data={data} onRowAction={onRowAction} onSellAction={onSellAction} />
        ),
      },
    ],
    [data, onRowAction, onSellAction]
  );

  return (
    <$CollapsibleTabs
      defaultTab="Holdings"
      tab="Holdings"
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
