import { Item, Root } from '@radix-ui/react-radio-group';
import styled, { css } from 'styled-components';

import { type MenuItem } from '@/constants/menus';

type ElementProps<MenuItemValue extends string> = {
  items: MenuItem<MenuItemValue>[];
  value?: MenuItemValue;
  onValueChange?: (value: MenuItemValue) => void;
};

type StyleProps = {
  className?: string;
};

export const RadioGroup = <MenuItemValue extends string>({
  items,
  value,
  onValueChange,
  className,
}: ElementProps<MenuItemValue> & StyleProps) => {
  return (
    <Root
      className={className}
      value={value}
      onValueChange={
        onValueChange != null
          ? (innerValue) => onValueChange(innerValue as MenuItemValue)
          : undefined
      }
      tw="flex flex-col gap-0.5"
    >
      {items.map(({ value: innerValue, label, slotBefore, slotAfter, disabled: innerDisabled }) => (
        <$RadioGroupItem
          key={innerValue}
          value={innerValue}
          disabled={innerDisabled}
          tw="flex items-center gap-0.75"
        >
          <$DotIndicator />
          {slotBefore}
          <span>{label}</span>
          {slotAfter}
        </$RadioGroupItem>
      ))}
    </Root>
  );
};

const $RadioGroupItem = styled(Item)``;

const indicatorStyle = css`
  --indicator-size: 1.25rem;
  --icon-size: 0.5rem;

  height: var(--indicator-size);
  width: var(--indicator-size);

  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const $DotIndicator = styled.div`
  ${indicatorStyle}
  --background-color: var(--color-layer-6);
  --border-color: var(--color-layer-7);

  background-color: var(--background-color);
  border: solid var(--border-width) var(--border-color);

  ${$RadioGroupItem}[data-state='checked'] & {
    --background-color: var(--color-accent);
    --border-color: var(--color-accent);

    &::after {
      content: '';
      display: block;
      width: var(--icon-size);
      height: var(--icon-size);
      background-color: var(--color-layer-2);
      border-radius: 50%;
    }
  }
`;
