import { cloneElement } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';
import {
  Root,
  Trigger,
  Content,
  ItemIndicator,
  RadioGroup,
  RadioItem,
  Portal,
} from '@radix-ui/react-dropdown-menu';

import { type MenuItem } from '@/constants/menus';

import { Icon, IconName } from '@/components/Icon';
import { Tag } from '@/components/Tag';

import { popoverMixins } from '@/styles/popoverMixins';
import { layoutMixins } from '@/styles/layoutMixins';

type ElementProps<MenuItemValue extends string> = {
  disabled?: boolean;
  items: MenuItem<MenuItemValue>[];
  value: MenuItemValue;
  onValueChange: (value: MenuItemValue) => void;
  children?: React.ReactNode;
  slotTrigger?: JSX.Element;
};

type StyleProps = {
  align?: 'center' | 'start' | 'end';
  sideOffset?: number;
  className?: string;
};

export const DropdownSelectMenu = <MenuItemValue extends string>({
  items,
  value,
  onValueChange,
  slotTrigger,
  children = (() => {
    const currentItem = items.find((item) => value === item.value);

    return (
      <>
        {currentItem?.slotBefore}
        <Styled.ItemLabel>{currentItem?.label ?? value}</Styled.ItemLabel>
      </>
    );
  })(),
  align = 'start',
  sideOffset = 1,
  className,

  disabled,
}: ElementProps<MenuItemValue> & StyleProps) => {
  const triggerContent = (
    <>
      {children}
      <Styled.DropdownIcon aria-hidden="true">
        <Icon iconName={IconName.Triangle} aria-hidden="true" />
      </Styled.DropdownIcon>
    </>
  );

  return (
    <Root>
      <Styled.Trigger disabled={disabled} className={className} asChild={slotTrigger}>
        {slotTrigger ? cloneElement(slotTrigger, { children: triggerContent }) : triggerContent}
      </Styled.Trigger>
      <Portal>
        <Styled.Content align={align} sideOffset={sideOffset} className={className}>
          <RadioGroup
            value={value}
            onValueChange={(value) => onValueChange(value as MenuItemValue)}
          >
            {items.map(({ value, label, slotBefore, slotAfter, tag, disabled }) => (
              <Styled.RadioItem key={value} value={value} disabled={disabled}>
                {slotBefore}

                <Styled.ItemLabel>
                  {label}
                  {tag && (
                    <>
                      {' '}
                      <Tag>{tag}</Tag>
                    </>
                  )}
                </Styled.ItemLabel>

                {slotAfter}

                <Styled.ItemIndicator>✔{/* <CheckIcon /> */}</Styled.ItemIndicator>
              </Styled.RadioItem>
            ))}
          </RadioGroup>
        </Styled.Content>
      </Portal>
    </Root>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Trigger = styled(Trigger)`
  ${layoutMixins.row}
  gap: 1rem;

  ${popoverMixins.trigger}
  ${popoverMixins.backdropOverlay}
`;

Styled.DropdownIcon = styled.span`
  display: inline-flex;
  transition: transform 0.3s var(--ease-out-expo);

  font-size: 0.375em;

  ${Styled.Trigger}[data-state='open'] & {
    transform: scaleY(-1);
  }
`;

Styled.Content = styled(Content)`
  ${popoverMixins.popover}
  ${popoverMixins.popoverAnimation}
`;

Styled.RadioItem = styled(RadioItem)`
  ${popoverMixins.item}
`;

Styled.ItemLabel = styled.span`
  flex: 1;

  ${layoutMixins.inlineRow}
`;

Styled.ItemIndicator = styled(ItemIndicator)`
  margin-left: auto;

  display: inline-flex;

  transition: transform 0.3s var(--ease-out-expo);
`;
