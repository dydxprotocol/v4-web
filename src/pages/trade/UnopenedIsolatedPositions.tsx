import { ReactNode, useEffect, useState } from 'react';

import { shallowEqual } from 'react-redux';
import styled, { css } from 'styled-components';

import { SubaccountPendingPosition } from '@/constants/abacus';
import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { DropdownIcon } from '@/components/DropdownIcon';
import { IconName } from '@/components/Icon';
import { PotentialPositionCard } from '@/components/PotentialPositionCard';

import { getExistingOpenPositions, getNonZeroPendingPositions } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';
import { getAssets } from '@/state/assetsSelectors';

type UnopenedIsolatedPositionsProps = {
  className?: string;
  onViewOrders: (marketId: string) => void;
};

export const MaybeUnopenedIsolatedPositionsDrawer = ({
  className,
  onViewOrders,
}: UnopenedIsolatedPositionsProps) => {
  const numNormalPositions = useAppSelector(getExistingOpenPositions, shallowEqual)?.length;
  const [isOpen, setIsOpen] = useState(numNormalPositions === 0);
  useEffect(() => {
    if (numNormalPositions === 0) {
      setIsOpen(true);
    }
  }, [numNormalPositions]);

  const pendingPositions = useAppSelector(getNonZeroPendingPositions, shallowEqual);

  const stringGetter = useStringGetter();

  if (!pendingPositions?.length) return null;

  return (
    <$UnopenedIsolatedPositionsDrawerContainer className={className} isOpen={isOpen}>
      <$Button onClick={() => setIsOpen(!isOpen)}>
        {stringGetter({ key: STRING_KEYS.UNOPENED_ISOLATED_POSITIONS })}
        <DropdownIcon iconName={IconName.Caret} isOpen={isOpen} tw="text-[0.5em]" />
      </$Button>

      {isOpen && (
        <div tw="px-1 pb-1 pt-0">
          <UnopenedIsolatedPositionsCards
            onViewOrders={onViewOrders}
            pendingPositions={pendingPositions}
          />
        </div>
      )}
    </$UnopenedIsolatedPositionsDrawerContainer>
  );
};

type UnopenedIsolatedPositionsPanelProps = {
  onViewOrders: (marketId: string) => void;
  className?: string;
  header: ReactNode;
};
export const MaybeUnopenedIsolatedPositionsPanel = ({
  onViewOrders,
  header,
  className,
}: UnopenedIsolatedPositionsPanelProps) => {
  const pendingPositions = useAppSelector(getNonZeroPendingPositions, shallowEqual);
  if (!pendingPositions?.length) return null;

  return (
    <div className={className}>
      {header}
      <UnopenedIsolatedPositionsCards
        onViewOrders={onViewOrders}
        pendingPositions={pendingPositions}
      />
    </div>
  );
};

type UnopenedIsolatedPositionsCardsProps = {
  onViewOrders: (marketId: string) => void;
  pendingPositions: SubaccountPendingPosition[];
};

const UnopenedIsolatedPositionsCards = ({
  onViewOrders,
  pendingPositions,
}: UnopenedIsolatedPositionsCardsProps) => {
  const assetsData = useAppSelector(getAssets, shallowEqual);
  return (
    <$Cards>
      {pendingPositions.map((pendingPosition) => (
        <PotentialPositionCard
          key={pendingPosition.assetId}
          marketName={assetsData?.[pendingPosition.assetId]?.name ?? pendingPosition.assetId ?? ''}
          pendingPosition={pendingPosition}
          onViewOrders={onViewOrders}
        />
      ))}
    </$Cards>
  );
};

const $UnopenedIsolatedPositionsDrawerContainer = styled.div<{ isOpen?: boolean }>`
  overflow: auto;
  border-top: var(--border);

  ${({ isOpen }) =>
    isOpen &&
    css`
      min-height: 10rem;
      height: 100%;
    `}
`;
const $Button = styled(Button)`
  position: sticky;
  top: 0;
  gap: 0.75rem;
  backdrop-filter: blur(4px) contrast(1.01);
  background-color: transparent;
  border: none;
  margin: 0 1rem;
`;
const $Cards = styled.div`
  ${layoutMixins.flexWrap}
  gap: 1rem;
  scroll-snap-align: none;
`;
