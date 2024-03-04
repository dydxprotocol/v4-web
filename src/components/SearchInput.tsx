import { useRef, useState } from 'react';

import styled, { type AnyStyledComponent } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { Icon, IconName } from '@/components/Icon';
import { Input, type InputProps, InputType } from '@/components/Input';
import { IconButton } from './IconButton';

type ElementProps = {
  onTextChange?: (value: string) => void;
};

export type SearchInputProps = ElementProps & InputProps;

export const SearchInput = ({
  placeholder,
  onTextChange,
}: SearchInputProps) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Styled.Search>
      <Icon
        iconName={IconName.Search}
      />
      <Styled.Input
        autoFocus
        ref={inputRef}
        value={value}
        type={InputType.Search}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value);
          onTextChange?.(e.target.value);
        }}
        placeholder={placeholder}
      />
      {value.length > 0 && <Styled.IconButton
        iconName={IconName.Close}
        onClick={() => {
          setValue('');
        }}
      />}
    </Styled.Search>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Search = styled.div`
  ${layoutMixins.row}
  width: 100%;
  height: 2rem;
  background-color: var(--color-layer-1);
  border-radius: 2.5rem;
  border: solid var(--border-width) var(--color-layer-6);
  padding: 0 0.75rem;
  gap: 0.5rem;
  justify-content: end;
`;

Styled.Input = styled(Input)`
  max-width: 100%;
  border-radius: 0;
`;

Styled.IconButton = styled(IconButton)`
  --button-icon-size: 0.5rem;
  width: 1.5rem;
  height: 1.5rem;
`;
