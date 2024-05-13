import { forwardRef, type Ref } from 'react';

import { Item, Root } from '@radix-ui/react-toggle-group';
import styled, { type AnyStyledComponent } from 'styled-components';

import { ButtonShape, ButtonSize } from '@/constants/buttons';
import { type MenuItem } from '@/constants/menus';

import { useBreakpoints } from '@/hooks';

import { layoutMixins } from '@/styles/layoutMixins';

import { type BaseButtonProps } from '@/components/BaseButton';
import { ToggleButton } from '@/components/ToggleButton';

type ElementProps<MenuItemValue extends string> = {
  items: MenuItem<MenuItemValue>[];
  value: MenuItemValue;
  onValueChange: (value: any) => void;
  onInteraction?: () => void;
  ensureSelected?: boolean;
};

type StyleProps = {
  className?: string;
};

export const ToggleGroup = forwardRef(
  <MenuItemValue extends string>(
    {
      items,
      value,
      ensureSelected = true,
      onValueChange,
      onInteraction,

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
        onValueChange={(newValue: MenuItemValue) => {
          if ((ensureSelected && newValue) || !ensureSelected) {
            onValueChange(newValue);
          }
          onInteraction?.();
        }}
        className={className}
        loop
      >
        {items.map((item) => (
          <Item key={item.value} value={item.value} asChild>
            <ToggleButton
              size={size ? size : isTablet ? ButtonSize.Small : ButtonSize.XSmall}
              shape={shape}
              disabled={item.disabled}
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
