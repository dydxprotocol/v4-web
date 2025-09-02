import { useState } from 'react';

import styled from 'styled-components';

import { Panel } from '@/components/Panel';

import { StakingPanel } from './StakingPanel';
import { Swap } from './Swap';

export const SwapAndStakingPanel = ({ className }: { className?: string }) => {
  const [selectedTab, setSelectedTab] = useState<'swap' | 'stake'>('swap');
  return (
    <Panel
      className={className}
      slotHeader={
        <$Header>
          <$HeaderButton
            onClick={() => setSelectedTab('swap')}
            $isSelected={selectedTab === 'swap'}
            type="button"
          >
            Swap
          </$HeaderButton>
          <$HeaderButton
            onClick={() => setSelectedTab('stake')}
            $isSelected={selectedTab === 'stake'}
            type="button"
          >
            Stake
          </$HeaderButton>
        </$Header>
      }
    >
      {selectedTab === 'swap' && <Swap />}
      {selectedTab === 'stake' && <StakingPanel />}
    </Panel>
  );
};

const $Header = styled.header`
  display: flex;
  gap: 1.25rem;
  padding: var(--panel-paddingY) var(--panel-paddingX) 0;
  font-size: 1.125rem;
  font-weight: bold;
`;

const $HeaderButton = styled.button<{ $isSelected: boolean }>`
  color: ${({ $isSelected }) => ($isSelected ? `var(--color-text-2)` : `var(--color-text-0)`)};
`;
