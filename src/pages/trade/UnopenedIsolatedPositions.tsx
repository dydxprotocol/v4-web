import { useState } from 'react';

import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { PotentialPositionCard } from '@/components/PotentialPositionCard';

import { getPendingPositions } from '@/state/accountSelectors';
import { getAssets } from '@/state/assetsSelectors';

type UnopenedIsolatedPositionsProps = {
  className?: string;
  onViewOrders: (marketId: string) => void;
};

export const UnopenedIsolatedPositions = ({
  className,
  onViewOrders,
}: UnopenedIsolatedPositionsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const pendingPositions = useSelector(getPendingPositions, shallowEqual);
  const assetsData = useSelector(getAssets, shallowEqual);

  if (!pendingPositions?.length) return null;

  return (
    <$UnopenedIsolatedPositions className={className} isOpen={isOpen}>
      <$Button isOpen={isOpen} onClick={() => setIsOpen(!isOpen)}>
        Unopened Isolated Positions
        <Icon iconName={IconName.Caret} />
      </$Button>

      {isOpen && (
        <$Cards>
          {pendingPositions.map((pendingPosition) => (
            <PotentialPositionCard
              key={pendingPosition.assetId}
              marketName={assetsData?.[pendingPosition.assetId].name ?? ''}
              pendingPosition={pendingPosition}
              onViewOrders={onViewOrders}
            />
          ))}
        </$Cards>
      )}
    </$UnopenedIsolatedPositions>
  );
};

const $UnopenedIsolatedPositions = styled.div<{ isOpen?: boolean }>`
  overflow: auto;
  border-top: var(--border);
  ${({ isOpen }) => isOpen && 'height: 100%;'}
`;
const $Button = styled(Button)<{ isOpen?: boolean }>`
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
`;
const $Cards = styled.div`
  ${layoutMixins.flexWrap}
  gap: 1rem;
  scroll-snap-align: none;
  padding: 0 1rem 1rem;
`;
