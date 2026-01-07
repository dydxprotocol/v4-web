import { useState } from 'react';

import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { isDev } from '@/constants/networks';
import { StatsigFlags } from '@/constants/statsig';

import { useStatsigGateValue } from '@/hooks/useStatsig';
import { useStringGetter } from '@/hooks/useStringGetter';

import { Panel } from '@/components/Panel';

import { Stake } from './Stake';
import { Swap } from './Swap';

export const SwapAndStakingPanel = ({ className }: { className?: string }) => {
  const stringGetter = useStringGetter();
  const isSwapEnabledBase = useStatsigGateValue(StatsigFlags.ffSwapEnabled);
  const isSwapEnabled = isDev || isSwapEnabledBase;

  const [selectedTab, setSelectedTab] = useState<'swap' | 'stake'>(
    isSwapEnabled ? 'swap' : 'stake'
  );
  return (
    <Panel
      className={className}
      slotHeader={
        <$Header>
          {isSwapEnabled && (
            <$HeaderButton
              onClick={() => setSelectedTab('swap')}
              $isSelected={selectedTab === 'swap'}
              type="button"
            >
              {stringGetter({ key: STRING_KEYS.SWAP })}
            </$HeaderButton>
          )}
          <$HeaderButton
            onClick={() => setSelectedTab('stake')}
            $isSelected={selectedTab === 'stake'}
            type="button"
          >
            {stringGetter({ key: STRING_KEYS.STAKE })}
          </$HeaderButton>
        </$Header>
      }
    >
      {isSwapEnabled && selectedTab === 'swap' && <Swap />}
      {selectedTab === 'stake' && <Stake />}
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
