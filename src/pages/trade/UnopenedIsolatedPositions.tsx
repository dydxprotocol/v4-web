import { ReactNode, useState } from 'react';

import { shallowEqual, useSelector } from 'react-redux';
import styled from 'styled-components';

import { SubaccountPendingPosition } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { PotentialPositionCard } from '@/components/PotentialPositionCard';

import { getNonZeroPendingPositions } from '@/state/accountSelectors';
import { getAssets } from '@/state/assetsSelectors';

type UnopenedIsolatedPositionsProps = {
  className?: string;
  onViewOrders: (marketId: string) => void;
  onCancelOrders: (marketId: string) => void;
};

export const MaybeUnopenedIsolatedPositionsDrawer = ({
  className,
  onViewOrders,
  onCancelOrders,
}: UnopenedIsolatedPositionsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const pendingPositions = useSelector(getNonZeroPendingPositions, shallowEqual);
  const stringGetter = useStringGetter();

  if (!pendingPositions?.length) return null;

  return (
    <$UnopenedIsolatedPositionsDrawerContainer className={className} isOpen={isOpen}>
      <$Button isOpen={isOpen} onClick={() => setIsOpen(!isOpen)}>
        {stringGetter({ key: STRING_KEYS.UNOPENED_ISOLATED_POSITIONS })}
        <Icon iconName={IconName.Caret} />
      </$Button>

      {isOpen && (
        <$CardsContainer>
          <UnopenedIsolatedPositionsCards
            onViewOrders={onViewOrders}
            onCancelOrders={onCancelOrders}
            pendingPositions={pendingPositions}
          />
        </$CardsContainer>
      )}
    </$UnopenedIsolatedPositionsDrawerContainer>
  );
};

type UnopenedIsolatedPositionsPanelProps = {
  onViewOrders: (marketId: string) => void;
  onCancelOrders: (marketId: string) => void;
  className?: string;
  header: ReactNode;
};
export const MaybeUnopenedIsolatedPositionsPanel = ({
  onViewOrders,
  onCancelOrders,
  header,
  className,
}: UnopenedIsolatedPositionsPanelProps) => {
  const pendingPositions = useSelector(getNonZeroPendingPositions, shallowEqual);
  if (!pendingPositions?.length) return null;

  return (
    <div className={className}>
      {header}
      <UnopenedIsolatedPositionsCards
        onViewOrders={onViewOrders}
        onCancelOrders={onCancelOrders}
        pendingPositions={pendingPositions}
      />
    </div>
  );
};

type UnopenedIsolatedPositionsCardsProps = {
  onViewOrders: (marketId: string) => void;
  onCancelOrders: (marketId: string) => void;
  pendingPositions: SubaccountPendingPosition[];
};

const UnopenedIsolatedPositionsCards = ({
  onViewOrders,
  onCancelOrders,
  pendingPositions,
}: UnopenedIsolatedPositionsCardsProps) => {
  const assetsData = useSelector(getAssets, shallowEqual);
  return (
    <$Cards>
      {pendingPositions.map((pendingPosition) => (
        <PotentialPositionCard
          key={pendingPosition.assetId}
          marketName={assetsData?.[pendingPosition.assetId].name ?? ''}
          pendingPosition={pendingPosition}
          onViewOrders={onViewOrders}
          onCancelOrders={onCancelOrders}
        />
      ))}
    </$Cards>
  );
};

const $UnopenedIsolatedPositionsDrawerContainer = styled.div<{ isOpen?: boolean }>`
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
`;
const $CardsContainer = styled.div`
  padding: 0 1rem 1rem;
`;
