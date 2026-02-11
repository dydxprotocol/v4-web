import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { noop } from 'lodash';
import styled from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks/useStringGetter';

import { Output, OutputType, RelativeTimeFormat } from '@/components/Output';
import { TableColumnHeader } from '@/components/Table/TableColumnHeader';

import { BigNumberish } from '@/lib/numbers';

export type DateAgeMode = 'date' | 'age';

const DateAgeModeContext = createContext<{
  dateAgeMode: DateAgeMode;
  setDateAgeMode: (mode: DateAgeMode) => void;
}>({
  dateAgeMode: 'age',
  setDateAgeMode: noop,
});

export const DateAgeModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [dateAgeMode, setDateAgeMode] = useState<DateAgeMode>('age');

  const context = useMemo(() => ({ dateAgeMode, setDateAgeMode }), [dateAgeMode]);

  return <DateAgeModeContext.Provider value={context}>{children}</DateAgeModeContext.Provider>;
};

export const DateAgeToggleHeader = () => {
  const stringGetter = useStringGetter();
  const { dateAgeMode, setDateAgeMode } = useContext(DateAgeModeContext);

  const handleDateClick = useCallback(
    (e: React.MouseEvent) => {
      if (dateAgeMode === 'date') return;

      e.stopPropagation();
      setDateAgeMode('date');
    },
    [dateAgeMode, setDateAgeMode]
  );

  const handleAgeClick = useCallback(
    (e: React.MouseEvent) => {
      if (dateAgeMode === 'age') return;

      e.stopPropagation();
      setDateAgeMode('age');
    },
    [dateAgeMode, setDateAgeMode]
  );

  return (
    <TableColumnHeader>
      <$Label $isActive={dateAgeMode === 'date'} onClick={handleDateClick} role="button">
        {stringGetter({ key: STRING_KEYS.DATE })}
      </$Label>
      <$Separator />
      <$Label $isActive={dateAgeMode === 'age'} onClick={handleAgeClick} role="button">
        {stringGetter({ key: STRING_KEYS.AGE })}
      </$Label>
    </TableColumnHeader>
  );
};

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

export const DateAgeOutput = ({
  value,
  relativeTimeFormat = 'singleCharacter',
}: {
  value: BigNumberish | null;
  relativeTimeFormat?: RelativeTimeFormat;
}) => {
  const { dateAgeMode } = useContext(DateAgeModeContext);

  if (dateAgeMode === 'date') {
    return <Output type={OutputType.DateTime} value={value} tw="text-color-text-0" />;
  }
  return (
    <Output
      type={OutputType.RelativeTime}
      value={value}
      relativeTimeOptions={{ format: relativeTimeFormat }}
      tw="text-color-text-0"
    />
  );
};
