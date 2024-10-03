import { Dispatch, SetStateAction, type ReactNode } from 'react';

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
import styled, { css, keyframes } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';
import { tabMixins } from '@/styles/tabMixins';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { type TabItem } from '@/components/Tabs';
import { Tag } from '@/components/Tag';
import { Toolbar } from '@/components/Toolbar';

import { testFlags } from '@/lib/testFlags';

type ElementProps<TabItemsValue> = {
  defaultTab?: TabItemsValue;
  tab: TabItemsValue;
  setTab?: Dispatch<SetStateAction<TabItemsValue>>;
  tabItems: TabItem<TabItemsValue>[];
  slotToolbar?: ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
};

type StyleProps = {
  fullWidthTabs?: boolean;
  dividerStyle?: 'border' | 'underline' | 'none';
  className?: string;
};

export type CollapsibleTabsProps<TabItemsValue> = ElementProps<TabItemsValue> & StyleProps;

export const CollapsibleTabs = <TabItemsValue extends string>({
  defaultTab,
  tab,
  setTab,
  tabItems,
  slotToolbar,
  defaultOpen,
  onOpenChange,

  fullWidthTabs,
  dividerStyle = 'none',

  className,
}: CollapsibleTabsProps<TabItemsValue>) => {
  const { uiRefresh } = testFlags;

  const currentTab = tabItems.find((tabItem) => tabItem.value === tab);
  const withBorders = dividerStyle === 'border';
  const withUnderline = dividerStyle === 'underline';

  return (
    <$TabsRoot
      className={className}
      defaultValue={defaultTab}
      value={tab}
      onValueChange={(v) => setTab?.(v as TabItemsValue)}
      $uiRefreshEnabled={uiRefresh}
      asChild
    >
      <$CollapsibleRoot
        defaultOpen={defaultOpen}
        open={defaultOpen}
        onOpenChange={(isOpen: boolean) => onOpenChange?.(isOpen)}
      >
        <$Header>
          <$TabsList $fullWidthTabs={fullWidthTabs} $withBorders={withBorders}>
            {tabItems.map(({ value, label, tag, slotRight }) => (
              <$TabsTrigger
                key={value}
                value={value}
                $withBorders={withBorders}
                $withUnderline={withUnderline}
                onClick={() => onOpenChange?.(true)}
              >
                {label}
                {tag && <Tag>{tag}</Tag>}
                {slotRight}
              </$TabsTrigger>
            ))}
          </$TabsList>

          <Toolbar tw="inlineRow">
            {currentTab?.slotToolbar ?? slotToolbar}
            <CollapsibleTrigger asChild>
              <$IconButton iconName={IconName.Caret} isToggle />
            </CollapsibleTrigger>
          </Toolbar>
        </$Header>

        <CollapsibleContent tw="stack shadow-none">
          {tabItems.map(({ asChild, value, content }) => (
            <$TabsContent key={value} asChild={asChild} value={value}>
              {content}
            </$TabsContent>
          ))}
        </CollapsibleContent>
      </$CollapsibleRoot>
    </$TabsRoot>
  );
};
const $TabsRoot = styled(TabsRoot)<{ $uiRefreshEnabled: boolean }>`
  /* Overrides */
  --trigger-backgroundColor: var(--color-layer-2);
  --trigger-textColor: var(--color-text-0);

  --trigger-active-backgroundColor: var(--color-layer-1);
  --trigger-active-textColor: var(--color-text-2);
  --trigger-active-underlineColor: ${({ $uiRefreshEnabled }) => css`
    ${$uiRefreshEnabled ? css`var(--color-accent);` : css`var(--color-text-2);`}
  `};
  --trigger-active-underline-size: 2px;
  --trigger-underline-size: 0px;

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

const $TabsList = styled(TabsList)<{ $fullWidthTabs?: boolean; $withBorders: boolean }>`
  align-self: stretch;

  ${({ $withBorders }) =>
    $withBorders &&
    css`
      ${layoutMixins.withOuterAndInnerBorders}

      margin: 0 calc(-1 * var(--border-width));
      padding: 0 var(--border-width);
    `}

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
`;

const $TabsTrigger = styled(TabsTrigger)<{
  $withBorders: boolean;
  $withUnderline: boolean;
}>`
  ${tabMixins.tabTriggerStyle}

  ${({ $withBorders }) =>
    $withBorders &&
    css`
      ${layoutMixins.withOuterBorder}
    `}

      ${({ $withUnderline }) =>
    $withUnderline &&
    css`
      ${tabMixins.tabTriggerUnderlineStyle}
    `}
`;
const $TabsContent = styled(TabsContent)`
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

const $CollapsibleRoot = styled(CollapsibleRoot)``;

const $Header = styled.header`
  ${layoutMixins.sticky}
  height: var(--stickyArea-topHeight);

  ${layoutMixins.contentSectionDetached}
  scroll-snap-align: none;

  ${layoutMixins.row}
  justify-content: space-between;

  ${$CollapsibleRoot}[data-state='closed'] & {
    box-shadow: none;
  }
`;

const $IconButton = styled(IconButton)`
  --button-icon-size: 1em;
  ${$CollapsibleRoot}[data-state='closed'] & {
    rotate: -0.5turn;
  }
`;
