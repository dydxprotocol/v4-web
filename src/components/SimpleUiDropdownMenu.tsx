import { Content, Item, Portal, Root, Trigger } from '@radix-ui/react-dropdown-menu';

import { ButtonShape, ButtonSize } from '@/constants/buttons';

import { forwardRefFn } from '@/lib/genericFunctionalComponentUtils';

import { Button } from './Button';
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
        <Trigger tw="w-fit rounded-[50%]" className={className}>
          <Button shape={ButtonShape.Circle} size={ButtonSize.XSmall}>
            {children}
          </Button>
        </Trigger>

        <Portal>
          <Content tw="w-10 overflow-hidden rounded-[0.5rem] bg-color-layer-4">
            {items.map((item) => (
              <Item
                tw="row justify-between p-1 font-small-book first:rounded-tl-[0.5rem] first:rounded-tr-[0.5rem] last:rounded-bl-[0.5rem] last:rounded-br-[0.5rem]"
                key={item.value}
                onSelect={item.onSelect}
                css={{
                  color: {
                    accent: 'var(--color-accent)',
                    create: 'var(--color-green)',
                    destroy: 'var(--color-red)',
                    none: undefined,
                  }[item.highlightColor ?? 'none'],
                }}
              >
                <span>{item.label}</span>
                {item.icon}
              </Item>
            ))}
          </Content>
        </Portal>
      </Root>
    );
  }
);
