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
        <Styled.CardRow>
          <PotentialPositionCard onViewOrders={onViewOrders} />
          <PotentialPositionCard onViewOrders={onViewOrders} />
          <PotentialPositionCard onViewOrders={onViewOrders} />
          <PotentialPositionCard onViewOrders={onViewOrders} />
          <PotentialPositionCard onViewOrders={onViewOrders} />
          <PotentialPositionCard onViewOrders={onViewOrders} />
          <PotentialPositionCard onViewOrders={onViewOrders} />
          <PotentialPositionCard onViewOrders={onViewOrders} />
          <PotentialPositionCard onViewOrders={onViewOrders} />
        </Styled.CardRow>
      )}
    </Styled.UnopenedIsolatedPositions>
  );
};

const Styled = {
  UnopenedIsolatedPositions: styled.div`
    overflow: hidden;
    border-top: var(--border);
  `,
  Button: styled(Button)<{ isOpen?: boolean }>`
    gap: 1rem;
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
  CardRow: styled.div`
    ${layoutMixins.row}
    overflow-x: auto;
    gap: 1rem;
    scroll-snap-align: none;
    padding: 0 1rem 1rem;
  `,
} satisfies Record<string, AnyStyledComponent>;
