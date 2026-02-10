import { useCallback } from 'react';

import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { TableColumnHeader } from '@/components/Table/TableColumnHeader';

export type DateAgeMode = 'date' | 'age';

type DateAgeToggleHeaderProps = {
  mode: DateAgeMode;
  onToggle: (mode: DateAgeMode) => void;
};

export const DateAgeToggleHeader = ({ mode, onToggle }: DateAgeToggleHeaderProps) => {
  const stringGetter = useStringGetter();

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
    <$TableColumnHeader>
      <$Label $isActive={mode === 'date'} onClick={handleDateClick} role="button">
        {stringGetter({ key: STRING_KEYS.DATE })}
      </$Label>
      <$Separator />
      <$Label $isActive={mode === 'age'} onClick={handleAgeClick} role="button">
        {stringGetter({ key: STRING_KEYS.AGE })}
      </$Label>
    </$TableColumnHeader>
  );
};

const $TableColumnHeader = styled(TableColumnHeader)`
  user-select: none;
`;

const $Label = styled.span<{ $isActive: boolean }>`
  cursor: pointer;
  color: ${({ $isActive }) => ($isActive ? 'var(--color-text-2)' : 'var(--color-text-0)')};
  transition: color 0.2s ease-in-out;

  &:hover {
    color: var(--color-text-1);
  }
`;

const $Separator = styled.span`
  color: var(--color-text-0);
`;
