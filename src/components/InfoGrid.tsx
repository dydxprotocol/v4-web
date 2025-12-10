import { ReactNode } from 'react';

import styled from 'styled-components';

import { LoadingContext } from '@/contexts/LoadingContext';

export type InfoGridItemProps = {
  // eslint-disable-next-line react/no-unused-prop-types
  key: string;
  label: ReactNode;
  value?: ReactNode | null;
};

const InfoGridItem = ({ label, value }: InfoGridItemProps) => (
  <$Card>
    <$Value>{value}</$Value>
    <$Label>{label}</$Label>
  </$Card>
);

type ElementProps = {
  items: InfoGridItemProps[];
  isLoading?: boolean;
};

type StyleProps = {
  className?: string;
};

export const InfoGrid = ({ className, items, isLoading = false }: ElementProps & StyleProps) => (
  <LoadingContext.Provider value={isLoading}>
    <$InfoGrid className={className}>
      {items.map(({ key, label, value }) => (
        <InfoGridItem key={key} label={label} value={value} />
      ))}
    </$InfoGrid>
  </LoadingContext.Provider>
);

const $InfoGrid = styled.dl`
  --infogrid-numColumns: 3;

  grid-auto-rows: 1fr;
  gap: 0.5rem;
  display: grid;
  grid-template-columns: repeat(var(--infogrid-numColumns), minmax(0, 1fr));
`;

const $Card = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.85rem;
  border: solid var(--border-width) var(--color-layer-4);
  border-radius: 0.5rem;
`;

const $Value = styled.dd`
  display: flex;
  font: var(--font-base-book);
  color: var(--color-text-2);

  &:empty {
    color: var(--color-text-0);
    opacity: 0.5;

    &:after {
      content: '—';
    }
  }
`;

const $Label = styled.dt`
  font: var(--font-mini-book);
  color: var(--color-text-0);
`;
