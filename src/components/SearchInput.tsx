import { useRef, useState } from 'react';

import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Input, InputType, type InputProps } from '@/components/Input';

type ElementProps = {
  onTextChange?: (value: string) => void;
};

export type SearchInputProps = ElementProps & InputProps;

export const SearchInput = ({ placeholder, onTextChange }: SearchInputProps) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <$Search>
      <$Icon iconName={IconName.Search} />
      <Input
        autoFocus
        ref={inputRef}
        value={value}
        type={InputType.Search}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value);
          onTextChange?.(e.target.value);
        }}
        placeholder={placeholder}
        tw="max-w-full rounded-0"
      />
      {value.length > 0 && (
        <$IconButton
          iconName={IconName.Close}
          onClick={() => {
            setValue('');
            onTextChange?.('');
          }}
        />
      )}
    </$Search>
  );
};
const $Search = styled.div`
  ${layoutMixins.row}
  width: auto;
  height: 2rem;
  background-color: var(--color-layer-3);
  color: ${({ theme }) => theme.textTertiary};
  border-radius: 2.5rem;
  border: solid var(--border-width) var(--color-layer-6);
  padding: 0 1rem;
  gap: 0.375rem;
  justify-content: end;
`;
const $IconButton = styled(IconButton)`
  --button-icon-size: 0.5rem;
  --button-border: none;
  --button-backgroundColor: transparent;
  color: ${({ theme }) => theme.textSecondary};
  width: 1.5rem;
  height: 1.5rem;
`;

const $Icon = styled(Icon)`
  color: ${({ theme }) => theme.textSecondary};
`;
