import { useRef, useState } from 'react';

import styled from 'styled-components';

import { ButtonStyle } from '@/constants/buttons';

import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Input, InputType, type InputProps } from '@/components/Input';

type ElementProps = {
  onTextChange?: (value: string) => void;
  className?: string;
};

export type SearchInputProps = ElementProps & InputProps;

export const SearchInput = ({ placeholder, onTextChange, className }: SearchInputProps) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <$Search className={className}>
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
          buttonStyle={ButtonStyle.WithoutBackground}
        />
      )}
    </$Search>
  );
};
const $Search = styled.div`
  ${layoutMixins.row}
  width: auto;
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
  color: ${({ theme }) => theme.textSecondary};
  width: 1.5rem;
  height: 1.5rem;
`;

const $Icon = styled(Icon)`
  color: ${({ theme }) => theme.textSecondary};
`;
