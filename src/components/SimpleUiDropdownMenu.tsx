import { Content, Item, Portal, Root, Separator, Trigger } from '@radix-ui/react-dropdown-menu';
import { Fragment } from 'react/jsx-runtime';

import { forwardRefFn } from '@/lib/genericFunctionalComponentUtils';

import { DropdownMenuItem } from './DropdownMenu';

export const SimpleUiDropdownMenu = forwardRefFn(
  <T extends string>({
    className,
    children,
    items,
  }: {
    className?: string;
    children: React.ReactNode;
    items: DropdownMenuItem<T>[];
  }) => {
    return (
      <Root>
        <Trigger tw="w-fit" className={className} asChild>
          {children}
        </Trigger>

        <Portal>
          <Content tw="w-10 overflow-hidden rounded-[0.5rem] bg-color-layer-4">
            {items.map((item, idx) => (
              <Fragment key={item.value}>
                <Item
                  tw="row cursor-pointer select-none justify-between px-1 py-0.75 font-small-book first:rounded-tl-[0.5rem] first:rounded-tr-[0.5rem] last:rounded-bl-[0.5rem] last:rounded-br-[0.5rem] disabled:cursor-default"
                  onSelect={item.onSelect}
                  disabled={!item.onSelect}
                  css={{
                    cursor: item.onSelect ? 'pointer' : 'not-allowed',
                    color: {
                      accent: 'var(--color-accent)',
                      create: 'var(--color-green)',
                      destroy: 'var(--color-red)',
                      none: item.onSelect ? undefined : 'var(--color-text-0)',
                    }[item.highlightColor ?? 'none'],
                  }}
                >
                  <span>{item.label}</span>
                  {item.icon}
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
