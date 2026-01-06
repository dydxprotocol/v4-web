import { useRef, useState } from 'react';

import styled from 'styled-components';

import { ButtonStyle } from '@/constants/buttons';

import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Input, InputType, type InputProps } from '@/components/Input';

import { isPresent } from '@/lib/typeUtils';

type ElementProps = {
  onTextChange?: (value: string) => void;
  className?: string;
};

export type SearchInputProps = ElementProps & InputProps;

export const SearchInput = ({ value, placeholder, onTextChange, className }: SearchInputProps) => {
  const [internalValue, setInternalValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isControlled = isPresent(value);
  const displayValue = isControlled ? String(value) : internalValue;

  return (
    <$Search className={className}>
      <$Icon iconName={IconName.Search} />
      <Input
        autoFocus
        ref={inputRef}
        value={displayValue}
        type={InputType.Search}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const newValue = e.target.value;
          setInternalValue(newValue);
          onTextChange?.(newValue);
        }}
        placeholder={placeholder}
        tw="max-w-full rounded-0"
      />
      {displayValue.length > 0 && (
        <$IconButton
          iconName={IconName.Close}
          onClick={() => {
            setInternalValue('');
            onTextChange?.('');
          }}
          buttonStyle={ButtonStyle.WithoutBackground}
        />
      )}
    </$Search>
  );
};
const $Search = styled.div`
  ${layoutMixins.row}
  width: auto;
  overflow: hidden;
  height: 2.5rem;
  background-color: var(--color-layer-5);
  color: ${({ theme }) => theme.textTertiary};
  border-radius: 2.5rem;
  border: solid var(--border-width) var(--color-layer-6);
  padding: 0 0.75rem;
  gap: 0.375rem;
  justify-content: end;
`;
const $IconButton = styled(IconButton)`
  --button-icon-size: 0.5rem;
  color: var(--search-input-icon-color, ${({ theme }) => theme.textSecondary});
  opacity: var(--search-input-icon-opacity, 1);
  width: 1.5rem;
  height: 1.5rem;
`;

const $Icon = styled(Icon)`
  color: var(--search-input-icon-color, ${({ theme }) => theme.textSecondary});
  opacity: var(--search-input-icon-opacity, 1);
`;
