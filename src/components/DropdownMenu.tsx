import { Fragment, type Ref } from 'react';

import {
  Content,
  Item,
  Portal,
  Root,
  Separator,
  Trigger,
  type DropdownMenuProps as RadixDropdownMenuProps,
  type DropdownMenuTriggerProps as RadixDropdownMenuTriggerProps,
} from '@radix-ui/react-dropdown-menu';
import styled from 'styled-components';

import { popoverMixins } from '@/styles/popoverMixins';

import { Icon, IconName } from '@/components/Icon';

import { forwardRefFn } from '@/lib/genericFunctionalComponentUtils';

export type DropdownMenuItem<T> = {
  value: T;
  icon?: React.ReactNode;
  label: React.ReactNode;
  onSelect?: (e: Event) => void;
  separator?: boolean;
  highlightColor?: 'accent' | 'create' | 'destroy';
};

type StyleProps = {
  align?: 'center' | 'start' | 'end';
  side?: 'top' | 'bottom';
  sideOffset?: number;
  className?: string;
};

type ElementProps<T> = {
  children: React.ReactNode;
  items: DropdownMenuItem<T>[];
  slotTopContent?: React.ReactNode;
};

export type DropdownMenuProps<T> = StyleProps &
  ElementProps<T> &
  RadixDropdownMenuProps & {
    triggerOptions?: RadixDropdownMenuTriggerProps;
  };

export const DropdownMenu = forwardRefFn(
  <T extends string>(
    {
      align = 'center',
      children,
      className,
      items,
      slotTopContent,
      side = 'bottom',
      sideOffset = 8,
      triggerOptions,
      ...rest
    }: DropdownMenuProps<T>,
    ref: Ref<HTMLButtonElement>
  ) => {
    return (
      <Root {...rest}>
        <$Trigger ref={ref} className={className} {...triggerOptions}>
          {children}
          <$DropdownIcon aria-hidden="true">
            <Icon iconName={IconName.Triangle} aria-hidden="true" />
          </$DropdownIcon>
        </$Trigger>
        <Portal>
          <$Content className={className} align={align} side={side} sideOffset={sideOffset}>
            {slotTopContent}
            {items.map((item: DropdownMenuItem<T>) => (
              <Fragment key={item.value}>
                <$Item
                  disabled={!item.onSelect}
                  $highlightColor={item.highlightColor}
                  onSelect={item?.onSelect}
                >
                  {item.icon}
                  {item.label}
                </$Item>
                {item.separator && <$Separator />}
              </Fragment>
            ))}
          </$Content>
        </Portal>
      </Root>
    );
  }
);

const $Separator = styled(Separator)`
  border-bottom: solid var(--border-width) var(--color-border);
  margin: 0.25rem 1rem;
`;

const $Item = styled(Item)<{ $highlightColor?: 'accent' | 'create' | 'destroy' }>`
  ${popoverMixins.item}
  --item-font-size: var(--dropdownMenu-item-font-size);
  ${({ $highlightColor }) =>
    $highlightColor != null
      ? {
          accent: `
        --item-highlighted-textColor: var(--color-accent);
      `,
          create: `
        --item-highlighted-textColor: var(--color-green);
      `,
          destroy: `
        --item-highlighted-textColor: var(--color-red);
      `,
        }[$highlightColor]
      : undefined}

  justify-content: start;
  color: var(--color-text-0);

  &[data-disabled] {
    cursor: default;
  }
`;

const $Trigger = styled(Trigger)`
  ${popoverMixins.trigger}
  ${popoverMixins.backdropOverlay}
`;

const $DropdownIcon = styled.span`
  display: inline-flex;
  font-size: 0.375em;
  transition: transform 0.3s var(--ease-out-expo);
  align-items: center;

  ${$Trigger}[data-state='open'] & {
    transform: scaleY(-1);
  }
`;

const $Content = styled(Content)`
  --dropdownMenu-item-font-size: inherit;

  ${popoverMixins.popover}
  ${popoverMixins.popoverAnimation}
`;
