import { forwardRef } from 'react';

import { Content, Item, Portal, Root, Separator, Trigger } from '@radix-ui/react-dropdown-menu';
import { CaretDownIcon } from '@radix-ui/react-icons';
import { Fragment } from 'react/jsx-runtime';
import styled from 'styled-components';

import { forwardRefFn } from '@/lib/genericFunctionalComponentUtils';

import { Button, ButtonProps } from './Button';
import { DropdownMenuItem } from './DropdownMenu';

type StyleProps = {
  align?: 'center' | 'start' | 'end';
  side?: 'top' | 'bottom';
  sideOffset?: number;
  className?: string;
  withPortal?: boolean;
};

export const SimpleUiDropdownMenu = forwardRefFn(
  <T extends string>({
    className,
    children,
    items,
    slotTop,
    align,
    side,
    sideOffset,
    withPortal = true,
  }: StyleProps & {
    children: React.ReactNode;
    items: DropdownMenuItem<T>[];
    slotTop?: React.ReactNode;
  }) => {
    const content = (
      <Content
        align={align}
        side={side}
        sideOffset={sideOffset}
        tw="z-1 w-fit overflow-hidden rounded-[0.5rem] border border-solid border-color-border bg-color-layer-4"
      >
        {slotTop && (
          <>
            <div tw="px-1 py-0.5">{slotTop}</div>
            <Separator tw="border-b-[length:--border-width] border-b-color-border [border-bottom-style:solid]" />
          </>
        )}
        {items.map((item, idx) => (
          <Fragment key={item.value}>
            <Item
              tw="row cursor-pointer select-none justify-between px-1 py-0.75 font-medium-book first:rounded-tl-[0.5rem] first:rounded-tr-[0.5rem] last:rounded-bl-[0.5rem] last:rounded-br-[0.5rem] disabled:cursor-default"
              onSelect={item.onSelect}
              disabled={!item.onSelect}
              css={{
                ...(item.active ? { backgroundColor: 'var(--color-layer-3)' } : {}),
                cursor: item.onSelect ? 'pointer' : 'not-allowed',
                color: {
                  active: 'var(--color-text-0)',
                  accent: 'var(--color-accent)',
                  create: 'var(--color-green)',
                  destroy: 'var(--color-red)',
                  none: item.onSelect ? undefined : 'var(--color-text-1)',
                }[item.highlightColor ?? (item.active ? 'active' : 'none')],
              }}
            >
              <span tw="whitespace-nowrap">{item.label}</span>
              {item.icon && <span tw="row ml-1">{item.icon}</span>}
            </Item>
            {idx !== items.length - 1 && (
              <Separator tw="border-b-[length:--border-width] border-b-color-border [border-bottom-style:solid]" />
            )}
          </Fragment>
        ))}
      </Content>
    );

    const dropdownContent = withPortal ? <Portal>{content}</Portal> : content;

    return (
      <Root>
        <Trigger className={className} asChild>
          {children}
        </Trigger>

        {dropdownContent}
      </Root>
    );
  }
);

export const DropdownMenuTrigger = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ children, ...props }, ref) => (
    <DropdownMenuButton {...props} ref={ref}>
      {children} <CaretDownIcon />
    </DropdownMenuButton>
  )
);

const DropdownMenuButton = styled(Button)`
  &[data-state='open'] {
    svg {
      transition: rotate 0.3s var(--ease-out-expo);
      rotate: -0.5turn;
    }
  }
`;
