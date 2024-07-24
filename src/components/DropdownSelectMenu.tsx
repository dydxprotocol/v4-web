import { cloneElement } from 'react';

import {
  Content,
  ItemIndicator,
  Portal,
  RadioGroup,
  RadioItem,
  Root,
  Trigger,
} from '@radix-ui/react-dropdown-menu';
import { CheckIcon } from '@radix-ui/react-icons';
import styled from 'styled-components';
import tw from 'twin.macro';

import { type MenuItem } from '@/constants/menus';

import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

import { Icon, IconName } from '@/components/Icon';
import { Tag } from '@/components/Tag';

type ElementProps<MenuItemValue extends string> = {
  disabled?: boolean;
  items: MenuItem<MenuItemValue>[];
  value?: MenuItemValue;
  onValueChange?: (value: MenuItemValue) => void;
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
        <$ItemLabel>{currentItem?.label ?? value}</$ItemLabel>
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
      <$DropdownIcon aria-hidden="true">
        <Icon iconName={IconName.Triangle} aria-hidden="true" />
      </$DropdownIcon>
    </>
  );

  return (
    <Root>
      <$Trigger disabled={disabled} className={className} asChild={!!slotTrigger}>
        {slotTrigger ? cloneElement(slotTrigger, { children: triggerContent }) : triggerContent}
      </$Trigger>
      <Portal>
        <$Content align={align} sideOffset={sideOffset} className={className}>
          <RadioGroup
            value={value}
            onValueChange={
              onValueChange != null
                ? (innerValue) => onValueChange(innerValue as MenuItemValue)
                : undefined
            }
          >
            {items.map(
              ({
                value: innerValue,
                label,
                slotBefore,
                slotAfter,
                tag,
                disabled: innerDisabled,
              }) => (
                <$RadioItem key={innerValue} value={innerValue} disabled={innerDisabled}>
                  {slotBefore}

                  <$ItemLabel>
                    {label}
                    {tag && (
                      <>
                        {' '}
                        <Tag>{tag}</Tag>
                      </>
                    )}
                  </$ItemLabel>

                  {slotAfter}

                  <$ItemIndicator>
                    <CheckIcon />
                  </$ItemIndicator>
                </$RadioItem>
              )
            )}
          </RadioGroup>
        </$Content>
      </Portal>
    </Root>
  );
};
const $Trigger = styled(Trigger)`
  ${layoutMixins.row}
  gap: 1rem;

  ${popoverMixins.trigger}
  ${popoverMixins.backdropOverlay}
`;

const $DropdownIcon = styled.span`
  display: inline-flex;
  transition: transform 0.3s var(--ease-out-expo);

  font-size: 0.375em;

  ${$Trigger}[data-state='open'] & {
    transform: scaleY(-1);
  }
`;

const $Content = styled(Content)`
  --dropdownSelectMenu-item-font-size: inherit;

  ${popoverMixins.popover}
  ${popoverMixins.popoverAnimation}
`;

const $RadioItem = styled(RadioItem)`
  ${popoverMixins.item}
  --item-font-size: var(--dropdownSelectMenu-item-font-size);
`;

const $ItemLabel = tw.span`flex-1 inlineRow`;

const $ItemIndicator = styled(ItemIndicator)`
  margin-left: auto;

  display: inline-flex;

  transition: transform 0.3s var(--ease-out-expo);
`;
