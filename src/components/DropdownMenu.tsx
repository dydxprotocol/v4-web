import { type Ref, forwardRef } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';
import { Root, Trigger, Content, Portal, Item, Separator } from '@radix-ui/react-dropdown-menu';

import { popoverMixins } from '@/styles/popoverMixins';

import { Icon, IconName } from '@/components/Icon';
import { Fragment } from 'react';

export type DropdownMenuItem<T> = {
  value: T;
  icon?: React.ReactNode;
  label: React.ReactNode;
  onSelect?: () => void;
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

type DropdownMenuProps<T> = StyleProps & ElementProps<T>;

export const DropdownMenu = forwardRef(
  <T extends string>(
    {
      align = 'center',
      children,
      className,
      items,
      slotTopContent,
      side = 'bottom',
      sideOffset = 8,
    }: DropdownMenuProps<T>,
    ref: Ref<T>
  ) => {
    return (
      <Root>
        <Styled.Trigger ref={ref} className={className}>
          {children}
          <Styled.DropdownIcon aria-hidden="true">
            <Icon iconName={IconName.Triangle} aria-hidden="true" />
          </Styled.DropdownIcon>
        </Styled.Trigger>
        <Portal>
          <Styled.Content className={className} align={align} side={side} sideOffset={sideOffset}>
            {slotTopContent}
            {items.map((item: DropdownMenuItem<T>) => (
              <Fragment key={item.value}>
                <Styled.Item
                  disabled={!item.onSelect}
                  $highlightColor={item.highlightColor}
                  onSelect={item?.onSelect}
                >
                  {item.icon}
                  {item.label}
                </Styled.Item>
                {item.separator && <Styled.Separator />}
              </Fragment>
            ))}
          </Styled.Content>
        </Portal>
      </Root>
    );
  }
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Separator = styled(Separator)`
  border-bottom: solid var(--border-width) var(--color-border);
  margin: 0.25rem 1rem;
`;

Styled.Item = styled(Item)<{ $highlightColor: 'accent' | 'create' | 'destroy' }>`
  ${popoverMixins.item}
  --item-font-size: var(--dropdownMenu-item-font-size);
  ${({ $highlightColor }) =>
    ({
      ['accent']: `
        --item-highlighted-textColor: var(--color-accent);
      `,
      ['create']: `
        --item-highlighted-textColor: var(--color-success);
      `,
      ['destroy']: `
        --item-highlighted-textColor: var(--color-error);
      `,
    }[$highlightColor])}

  justify-content: start;
  color: var(--color-text-0);

  &[data-disabled] {
    cursor: default;
  }
`;

Styled.Trigger = styled(Trigger)`
  ${popoverMixins.trigger}
  ${popoverMixins.backdropOverlay}
`;

Styled.DropdownIcon = styled.span`
  display: inline-flex;
  font-size: 0.375em;
  transition: transform 0.3s var(--ease-out-expo);
  align-items: center;

  ${Styled.Trigger}[data-state='open'] & {
    transform: scaleY(-1);
  }
`;

Styled.Content = styled(Content)`
  --dropdownMenu-item-font-size: inherit;

  ${popoverMixins.popover}
  ${popoverMixins.popoverAnimation}
`;
