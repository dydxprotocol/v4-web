import { type ReactNode, useState } from 'react';

import {
  Content as CollapsibleContent,
  Root as CollapsibleRoot,
  Trigger as CollapsibleTrigger,
} from '@radix-ui/react-collapsible';
import {
  Content as TabsContent,
  List as TabsList,
  Root as TabsRoot,
  Trigger as TabsTrigger,
} from '@radix-ui/react-tabs';
import styled, { type AnyStyledComponent, css, keyframes } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { type TabItem } from '@/components/Tabs';
import { Tag } from '@/components/Tag';
import { Toolbar } from '@/components/Toolbar';

type ElementProps<TabItemsValue> = {
  defaultValue?: TabItemsValue;
  items: TabItem<TabItemsValue>[];
  slotToolbar?: ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
};

type StyleProps = {
  className?: string;
  fullWidthTabs?: boolean;
};

export type CollapsibleTabsProps<TabItemsValue> = ElementProps<TabItemsValue> & StyleProps;

export const CollapsibleTabs = <TabItemsValue extends string>({
  defaultValue,
  items,
  slotToolbar,
  defaultOpen,
  onOpenChange,

  fullWidthTabs,

  className,
}: CollapsibleTabsProps<TabItemsValue>) => {
  const [value, setValue] = useState(defaultValue);

  const currentItem = items.find((item) => item.value === value);

  return (
    <Styled.TabsRoot
      className={className}
      defaultValue={defaultValue}
      value={value}
      onValueChange={setValue}
      asChild
    >
      <Styled.CollapsibleRoot
        defaultOpen={defaultOpen}
        open={defaultOpen}
        onOpenChange={(isOpen: boolean) => onOpenChange?.(isOpen)}
      >
        <Styled.Header>
          <Styled.TabsList $fullWidthTabs={fullWidthTabs}>
            {items.map((item) => (
              <Styled.TabsTrigger
                key={item.value}
                value={item.value}
                onClick={() => onOpenChange?.(true)}
              >
                {item.label}
                {item.tag && <Tag>{item.tag}</Tag>}
                {item.slotRight}
              </Styled.TabsTrigger>
            ))}
          </Styled.TabsList>

          <Styled.Toolbar>
            {currentItem?.slotToolbar || slotToolbar}
            <CollapsibleTrigger asChild>
              <Styled.IconButton iconName={IconName.Caret} isToggle />
            </CollapsibleTrigger>
          </Styled.Toolbar>
        </Styled.Header>

        <Styled.CollapsibleContent>
          {items.map(({ asChild, value, content }) => (
            <Styled.TabsContent key={value} asChild={asChild} value={value}>
              {content}
            </Styled.TabsContent>
          ))}
        </Styled.CollapsibleContent>
      </Styled.CollapsibleRoot>
    </Styled.TabsRoot>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.TabsRoot = styled(TabsRoot)`
  /* Overrides */
  --trigger-backgroundColor: var(--color-layer-2);
  --trigger-textColor: var(--color-text-0);

  --trigger-active-backgroundColor: var(--color-layer-1);
  --trigger-active-textColor: var(--color-text-2);

  /* Rules */
  ${layoutMixins.scrollArea}
  overscroll-behavior: contain;

  ${layoutMixins.stickyArea0}
  --stickyArea0-background: var(--color-layer-2);
  --stickyArea0-topHeight: var(--tabs-height);
  --stickyArea0-topGap: var(--border-width);

  ${layoutMixins.contentContainer}
  ${layoutMixins.expandingColumnWithHeader}

  ${layoutMixins.withInnerHorizontalBorders}
`;

Styled.TabsList = styled(TabsList)<{ $fullWidthTabs?: boolean }>`
  ${layoutMixins.withOuterAndInnerBorders}

  align-self: stretch;

  ${({ $fullWidthTabs }) =>
    $fullWidthTabs
      ? css`
          flex: 1;
          ${layoutMixins.flexEqualColumns}
        `
      : css`
          ${layoutMixins.row}
        `}

  overflow-x: auto;
  margin: 0 calc(-1 * var(--border-width));
  padding: 0 var(--border-width);
`;

Styled.TabsTrigger = styled(TabsTrigger)`
  ${layoutMixins.withOuterBorder}

  ${layoutMixins.row}
  justify-content: center;
  gap: 0.5ch;

  align-self: stretch;
  padding: 0 1.5rem;
  font: var(--font-base-book);
  color: var(--trigger-textColor);
  background-color: var(--trigger-backgroundColor);

  &[data-state='active'] {
    color: var(--trigger-active-textColor);
    background-color: var(--trigger-active-backgroundColor);
  }
`;

Styled.Toolbar = styled(Toolbar)`
  ${layoutMixins.inlineRow}
`;

Styled.TabsContent = styled(TabsContent)`
  ${layoutMixins.flexColumn}

  outline: none;
  box-shadow: none;

  &[data-state='inactive'] {
    pointer-events: none;
  }

  @media (prefers-reduced-motion: no-preference) {
    &[data-state='active'] {
      animation: ${keyframes`
        from {
          translate: 0 -0.25rem -0.25rem;
          opacity: 0;
          filter: blur(3px);
        }
      `} 0.2s var(--ease-out-expo);
    }

    &[data-state='inactive'] {
      min-height: 0;

      animation: ${keyframes`
        to {
          translate: 0 -0.25rem -0.25rem;
          opacity: 0;
          filter: blur(3px);
        }
      `} 0.2s var(--ease-out-expo);
    }
  }
`;

Styled.CollapsibleRoot = styled(CollapsibleRoot)``;

Styled.Header = styled.header`
  ${layoutMixins.sticky}
  height: var(--stickyArea-topHeight);

  ${layoutMixins.contentSectionDetached}
  scroll-snap-align: none;

  ${layoutMixins.row}
  justify-content: space-between;

  ${Styled.CollapsibleRoot}[data-state='closed'] & {
    box-shadow: none;
  }
`;

Styled.CollapsibleContent = styled(CollapsibleContent)`
  ${layoutMixins.stack}

  box-shadow: none;
`;

Styled.IconButton = styled(IconButton)`
  --button-icon-size: 1em;
  ${Styled.CollapsibleRoot}[data-state='closed'] & {
    rotate: -0.5turn;
  }
`;
