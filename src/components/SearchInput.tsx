import { useState } from 'react';
import styled, { type AnyStyledComponent, css } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Input, type InputProps } from '@/components/Input';

type ElementProps = {
  onOpenChange?: (isOpen: boolean) => void;
  onTextChange?: (value: string) => void;
};

export type SearchInputProps = ElementProps & InputProps;

export const SearchInput = ({
  type,
  placeholder,
  onOpenChange,
  onTextChange,
}: SearchInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState('');

  return (
    <Styled.Search>
      <Styled.IconButton
        iconName={isOpen ? IconName.Close : IconName.Search}
        isToggle
        isPressed={isOpen}
        onPressedChange={(isPressed: boolean) => {
          setIsOpen(isPressed);
          onOpenChange?.(isPressed);

          if (!isPressed) {
            onTextChange?.('');
            setValue('');
          }
        }}
      />
      <Styled.Input
        autoFocus
        value={value}
        isOpen={isOpen}
        type={type}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value);
          onTextChange?.(e.target.value);
        }}
        disabled={!isOpen}
        placeholder={placeholder}
      />
    </Styled.Search>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Search = styled.div`
  ${layoutMixins.row}

  justify-content: end;
  width: 100%;
  height: 100%;
`;

Styled.Input = styled(Input)<{ isOpen: boolean }>`
  max-width: 0;

  @media (prefers-reduced-motion: no-preference) {
    transition: max-width 0.45s var(--ease-out-expo);
  }

  ${({ isOpen }) =>
    isOpen &&
    css`
      padding-left: 0.5rem;
      max-width: 100%;
    `}
`;

Styled.IconButton = styled(IconButton)<{ iconName: IconName.Close | IconName.Search }>`
  --button-toggle-on-backgroundColor: var(--color-layer-3);
  --button-toggle-on-textColor: var(--color-text-0);

  ${({ iconName }) =>
    iconName === IconName.Close &&
    css`
      svg {
        height: 0.875em;
      }
    `}
`;
