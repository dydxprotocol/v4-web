import { useState } from 'react';

import styled, { AnyStyledComponent } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { PotentialPositionCard } from '@/components/PotentialPositionCard';

type UnopenedIsolatedPositionsProps = {
  className?: string;
  onViewOrders: (marketId: string) => void;
};

export const UnopenedIsolatedPositions = ({
  className,
  onViewOrders,
}: UnopenedIsolatedPositionsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Styled.UnopenedIsolatedPositions className={className} isOpen={isOpen}>
      <Styled.Button isOpen={isOpen} onClick={() => setIsOpen(!isOpen)}>
        Unopened Isolated Positions
        <Icon iconName={IconName.Caret} />
      </Styled.Button>

      {isOpen && (
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
  UnopenedIsolatedPositions: styled.div<{ isOpen?: boolean }>`
    overflow: auto;
    border-top: var(--border);
    ${({ isOpen }) => isOpen && 'height: 100%;'}
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
