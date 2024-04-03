import { useState } from 'react';

import styled, { AnyStyledComponent } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { PotentialPositionCard } from '@/components/PotentialPositionCard';

type UnopenedIsolatedPositionsProps = {
  onViewOrders: (marketId: string) => void;
};

export const UnopenedIsolatedPositions = ({ onViewOrders }: UnopenedIsolatedPositionsProps) => {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <Styled.UnopenedIsolatedPositions>
      <Styled.Button isOpen={isVisible} onClick={() => setIsVisible(!isVisible)}>
        Unopened Isolated Positions
        <Icon iconName={IconName.Caret} />
      </Styled.Button>

      {isVisible && (
        <Styled.Cards>
          <PotentialPositionCard onViewOrders={onViewOrders} />
          <PotentialPositionCard onViewOrders={onViewOrders} />
          <PotentialPositionCard onViewOrders={onViewOrders} />
          <PotentialPositionCard onViewOrders={onViewOrders} />
          <PotentialPositionCard onViewOrders={onViewOrders} />
          <PotentialPositionCard onViewOrders={onViewOrders} />
          <PotentialPositionCard onViewOrders={onViewOrders} />
          <PotentialPositionCard onViewOrders={onViewOrders} />
          <PotentialPositionCard onViewOrders={onViewOrders} />
        </Styled.Cards>
      )}
    </Styled.UnopenedIsolatedPositions>
  );
};

const Styled = {
  UnopenedIsolatedPositions: styled.div`
    overflow: auto;
    border-top: var(--border);
  `,
  Button: styled(Button)<{ isOpen?: boolean }>`
    position: sticky;
    top: 0;
    gap: 1rem;
    backdrop-filter: blur(4px) contrast(1.01);
    background-color: transparent;
    border: none;
    margin: 0 1rem;

    ${({ isOpen }) =>
      isOpen &&
      `
      svg {
        transform: rotate(180deg);
      }
    `}
  `,
  Cards: styled.div`
    ${layoutMixins.flexWrap}
    gap: 1rem;
    scroll-snap-align: none;
    padding: 0 1rem 1rem;
  `,
} satisfies Record<string, AnyStyledComponent>;
