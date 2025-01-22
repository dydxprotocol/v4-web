import { ReactNode, useEffect, useState } from 'react';

import { BonsaiCore, BonsaiHelpers } from '@/abacus-ts/ontology';
import type { PendingIsolatedPosition } from '@/abacus-ts/types/summaryTypes';
import styled, { css } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';
import { EMPTY_ARR } from '@/constants/objects';

import { useStringGetter } from '@/hooks/useStringGetter';

import { layoutMixins } from '@/styles/layoutMixins';

import { Button } from '@/components/Button';
import { DropdownIcon } from '@/components/DropdownIcon';
import { IconName } from '@/components/Icon';
import { PotentialPositionCard } from '@/components/PotentialPositionCard';

import { useAppSelector } from '@/state/appTypes';

type UnopenedIsolatedPositionsProps = {
  className?: string;
  onViewOrders: (marketId: string) => void;
};

export const MaybeUnopenedIsolatedPositionsDrawer = ({
  className,
  onViewOrders,
}: UnopenedIsolatedPositionsProps) => {
  const parentSubaccountPositionsLoading =
    useAppSelector(BonsaiCore.account.parentSubaccountPositions.loading) === 'pending';

  const numNormalPositions = (
    useAppSelector(BonsaiCore.account.parentSubaccountPositions.data) ?? EMPTY_ARR
  ).length;

  const pendingIsolatedPositions =
    useAppSelector(BonsaiHelpers.unopenedIsolatedPositions) ?? EMPTY_ARR;

  const [isOpen, setIsOpen] = useState(numNormalPositions === 0);
  useEffect(() => {
    if (!parentSubaccountPositionsLoading && numNormalPositions === 0) {
      setIsOpen(true);
    }
  }, [parentSubaccountPositionsLoading, numNormalPositions]);

  const stringGetter = useStringGetter();

  if (!pendingIsolatedPositions.length) return null;

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
            pendingPositions={pendingIsolatedPositions}
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
  const pendingIsolatedPositions =
    useAppSelector(BonsaiHelpers.unopenedIsolatedPositions) ?? EMPTY_ARR;

  if (!pendingIsolatedPositions.length) return null;

  return (
    <div className={className}>
      {header}
      <UnopenedIsolatedPositionsCards
        onViewOrders={onViewOrders}
        pendingPositions={pendingIsolatedPositions}
      />
    </div>
  );
};

type UnopenedIsolatedPositionsCardsProps = {
  onViewOrders: (marketId: string) => void;
  pendingPositions: PendingIsolatedPosition[];
};

const UnopenedIsolatedPositionsCards = ({
  onViewOrders,
  pendingPositions,
}: UnopenedIsolatedPositionsCardsProps) => (
  <$Cards>
    {pendingPositions.map((pendingPosition) => (
      <PotentialPositionCard
        key={pendingPosition.marketId}
        pendingPosition={pendingPosition}
        onViewOrders={onViewOrders}
      />
    ))}
  </$Cards>
);

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
  --backdrop-filter: blur(4px) contrast(1.01);
  position: sticky;
  top: 0;
  gap: 0.75rem;
  -webkit-backdrop-filter: var(--backdrop-filter);
  backdrop-filter: var(--backdrop-filter);
  background-color: transparent;
  border: none;
  margin: 0 1rem;
`;
const $Cards = styled.div`
  ${layoutMixins.flexWrap}
  gap: 1rem;
  scroll-snap-align: none;
`;
