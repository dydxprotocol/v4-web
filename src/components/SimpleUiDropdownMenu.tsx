import { Content, Item, Portal, Root, Separator, Trigger } from '@radix-ui/react-dropdown-menu';
import { Fragment } from 'react/jsx-runtime';

import { forwardRefFn } from '@/lib/genericFunctionalComponentUtils';

import { DropdownMenuItem } from './DropdownMenu';

type StyleProps = {
  align?: 'center' | 'start' | 'end';
  side?: 'top' | 'bottom';
  sideOffset?: number;
  className?: string;
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
  }: StyleProps & {
    children: React.ReactNode;
    items: DropdownMenuItem<T>[];
    slotTop?: React.ReactNode;
  }) => {
    return (
      <Root>
        <Trigger className={className} asChild>
          {children}
        </Trigger>

        <Portal>
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
        </Portal>
      </Root>
    );
  }
);
