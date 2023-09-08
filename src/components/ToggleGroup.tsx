import { forwardRef, type Ref } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';
import { Root, Item } from '@radix-ui/react-toggle-group';

import { type MenuItem } from '@/constants/menus';
import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { useBreakpoints } from '@/hooks';
import { layoutMixins } from '@/styles/layoutMixins';

import {  type BaseButtonProps } from '@/components/BaseButton';
import { ToggleButton } from '@/components/ToggleButton';

type ElementProps<MenuItemValue extends string> = {
  items: MenuItem<MenuItemValue>[];
  value: MenuItemValue;
  onValueChange: (value: MenuItemValue) => void;
};

type StyleProps = {
  className?: string;
};

export const ToggleGroup = forwardRef(
  <MenuItemValue extends string>(
    {
      items,
      value,
      onValueChange,
      className,
      size,
      shape = ButtonShape.Pill,
      ...buttonProps
    }: ElementProps<MenuItemValue> & StyleProps & BaseButtonProps,
    ref: Ref<HTMLDivElement>
  ) => {
    const { isTablet } = useBreakpoints();

    return (
      <Styled.Root
        ref={ref}
        type="single"
        value={value}
        onValueChange={onValueChange}
        className={className}
        loop
      >
        {items.map((item) => (
          <Item key={item.value} value={item.value} aria-label={item.label} asChild>
            <ToggleButton
              size={size ? size : isTablet ? ButtonSize.Small : ButtonSize.XSmall}
              shape={shape}
              {...buttonProps}
            >
              {item.slotBefore}
              {item.label}
            </ToggleButton>
          </Item>
        ))}
      </Styled.Root>
    );
  }
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Root = styled(Root)`
  ${layoutMixins.row}
  gap: 0.33em;
`;
