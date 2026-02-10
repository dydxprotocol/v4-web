import { useCallback } from 'react';

import styled from 'styled-components';

export type DateAgeMode = 'date' | 'age';

type DateAgeToggleHeaderProps = {
  mode: DateAgeMode;
  onToggle: (mode: DateAgeMode) => void;
};

export const DateAgeToggleHeader = ({ mode, onToggle }: DateAgeToggleHeaderProps) => {
  const handleDateClick = useCallback(
    (e: React.MouseEvent) => {
      if (mode === 'date') return;

      e.stopPropagation();
      onToggle('date');
    },
    [mode, onToggle]
  );

  const handleAgeClick = useCallback(
    (e: React.MouseEvent) => {
      if (mode === 'age') return;

      e.stopPropagation();
      onToggle('age');
    },
    [mode, onToggle]
  );

  return (
    <$Container>
      <$Label $isActive={mode === 'date'} onClick={handleDateClick} role="button" tabIndex={0}>
        Date
      </$Label>
      <$Separator>/</$Separator>
      <$Label $isActive={mode === 'age'} onClick={handleAgeClick} role="button" tabIndex={0}>
        Age
      </$Label>
    </$Container>
  );
};

const $Container = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25ch;
  user-select: none;
`;

const $Label = styled.span<{ $isActive: boolean }>`
  cursor: pointer;
  color: ${({ $isActive }) => ($isActive ? 'var(--color-text-1)' : 'var(--color-text-0)')};
  opacity: ${({ $isActive }) => ($isActive ? 1 : 0.5)};

  &:hover {
    opacity: 0.8;
  }
`;

const $Separator = styled.span`
  color: var(--color-text-0);
  opacity: 0.5;
`;
