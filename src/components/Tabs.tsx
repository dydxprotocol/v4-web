import { useRef, type ReactNode, type Ref } from 'react';

import { Content, List, Root, Trigger } from '@radix-ui/react-tabs';
import styled, { css, keyframes } from 'styled-components';

import { type MenuItem } from '@/constants/menus';

import { useFadeOnHorizontalScrollContainer } from '@/hooks/useFadeOnHorizontalScrollContainer';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';
import { tabMixins } from '@/styles/tabMixins';

import { DropdownSelectMenu } from '@/components/DropdownSelectMenu';
import { Tag } from '@/components/Tag';
import { Toolbar } from '@/components/Toolbar';

import { getSimpleStyledOutputType } from '@/lib/genericFunctionalComponentUtils';
import { testFlags } from '@/lib/testFlags';

export type TabItem<TabItemsValue> = {
  value: TabItemsValue;
  label: React.ReactNode;
  forceMount?: boolean;
  tag?: React.ReactNode;
  slotRight?: React.ReactNode;
  slotToolbar?: React.ReactNode;
  content?: React.ReactNode;
  subitems?: TabItem<TabItemsValue>[];
  customTrigger?: ReactNode;
  asChild?: boolean;
  ref?: Ref<HTMLDivElement>;
};

type ElementProps<TabItemsValue> = {
  defaultValue?: TabItemsValue;
  value?: TabItemsValue;
  items: TabItem<TabItemsValue>[];
  slotToolbar?: ReactNode;
  sharedContent?: ReactNode;
  disabled?: boolean;
  onValueChange?: (value: TabItemsValue) => void;
  onWheel?: (event: React.WheelEvent) => void;
};

type StyleProps = {
  fullWidthTabs?: boolean;
  side?: 'top' | 'bottom';
  dividerStyle?: 'border' | 'underline' | 'none';
  withTransitions?: boolean;
  className?: string;
};

export type TabsProps<TabItemsValue> = ElementProps<TabItemsValue> & StyleProps;

export const Tabs = <TabItemsValue extends string>({
  defaultValue,
  value,
  items,
  slotToolbar,
  sharedContent,
  onValueChange,
  onWheel,
  fullWidthTabs,
  side = 'top',
  dividerStyle = 'none',
  withTransitions = true,
  disabled = false,
  className,
}: ElementProps<TabItemsValue> & StyleProps) => {
  const currentItem = items.find((item) => item.value === value);
  const { uiRefresh } = testFlags;
  const withBorders = dividerStyle === 'border';
  const withUnderline = dividerStyle === 'underline';

  const headerRef = useRef<HTMLDivElement>(null);
  const { showFadeStart, showFadeEnd } = useFadeOnHorizontalScrollContainer({
    scrollRef: headerRef,
  });

  const triggers = (
    <>
      <$List $fullWidthTabs={fullWidthTabs} $withBorders={withBorders}>
        {items.map((item) =>
          !item.subitems ? (
            item.customTrigger ?? (
              <$Trigger
                key={item.value}
                value={item.value}
                $withBorders={withBorders}
                $withUnderline={withUnderline}
                disabled={disabled}
              >
                <$Label>{item.label}</$Label>
                {item.tag && <Tag>{item.tag}</Tag>}
                {item.slotRight}
              </$Trigger>
            )
          ) : (
            <$DropdownSelectMenu
              key={item.value ?? item.label}
              items={item.subitems as unknown as MenuItem<TabItemsValue>[]}
              value={value}
              onValueChange={onValueChange}
              align="end"
              $isActive={item.subitems.some((subitem) => subitem.value === value)}
              $withUnderline={withUnderline}
              slotTrigger={
                <$DropdownTabTrigger value={value ?? ''} $withUnderline={withUnderline} />
              }
              disabled={disabled}
            >
              <$Label>{item.label}</$Label>
            </$DropdownSelectMenu>
          )
        )}
      </$List>

      {(currentItem?.slotToolbar ?? slotToolbar) && (
        <Toolbar>{currentItem?.slotToolbar ?? slotToolbar}</Toolbar>
      )}
    </>
  );

  return (
    <$Root
      className={className}
      defaultValue={defaultValue}
      value={value}
      onValueChange={
        onValueChange != null ? (val) => onValueChange(val as TabItemsValue) : undefined
      }
      onWheel={onWheel}
      $side={side}
      $withInnerBorder={withBorders || withUnderline}
      $uiRefreshEnabled={uiRefresh}
    >
      {showFadeStart || showFadeEnd ? (
        <$HorizontalScrollContainer showFadeStart={showFadeStart} showFadeEnd={showFadeEnd}>
          <$Header $side={side} ref={headerRef}>
            {triggers}
          </$Header>
        </$HorizontalScrollContainer>
      ) : (
        <$Header $side={side} ref={headerRef}>
          {triggers}
        </$Header>
      )}

      {sharedContent ?? (
        <div tw="stack shadow-none">
          {items.map(({ asChild, value: childValue, content, forceMount, ref }) => (
            <$Content
              ref={ref}
              key={childValue}
              asChild={asChild}
              value={childValue}
              forceMount={forceMount ? true : undefined}
              $hide={forceMount && currentItem?.value !== childValue}
              $withTransitions={withTransitions}
            >
              {content}
            </$Content>
          ))}
        </div>
      )}
    </$Root>
  );
};

const $Root = styled(Root)<{
  $side: 'top' | 'bottom';
  $withInnerBorder?: boolean;
  $uiRefreshEnabled: boolean;
}>`
  /* Overrides */
  --trigger-backgroundColor: var(--color-layer-2);
  --trigger-textColor: var(--color-text-0);

  --trigger-active-backgroundColor: var(--color-layer-1);
  --trigger-active-textColor: var(--color-text-2);
  --trigger-hover-textColor: var(--trigger-active-textColor);
  --trigger-active-underlineColor: ${({ $uiRefreshEnabled }) => css`
    ${$uiRefreshEnabled ? css`var(--color-accent);` : css`var(--color-text-2);`}
  `};
  --trigger-active-underline-backgroundColor: transparent;
  --trigger-active-underline-size: 2px;
  --trigger-underline-size: 0px;

  /* Variants */
  --tabs-currentHeight: var(--tabs-height);
  @media ${breakpoints.tablet} {
    --tabs-currentHeight: var(--tabs-height-mobile);
  }

  /* Rules */
  ${layoutMixins.scrollArea}
  overscroll-behavior: contain;

  ${layoutMixins.stickyArea0}
  --stickyArea0-background: var(--color-layer-2);
  --stickyArea0-topGap: var(--border-width);

  --activeTab-zIndex: 1;
  --stickyHeader-zIndex: calc(var(--activeTab-zIndex) + 1);

  ${layoutMixins.contentContainer}

  ${({ $side }) =>
    ({
      top: css`
        --stickyArea0-topHeight: var(--tabs-currentHeight);
        ${layoutMixins.expandingColumnWithHeader}
      `,
      bottom: css`
        --stickyArea0-bottomHeight: var(--tabs-currentHeight);
        ${layoutMixins.expandingColumnWithFooter}
      `,
    })[$side]}

  ${({ $withInnerBorder }) =>
    $withInnerBorder &&
    css`
      ${layoutMixins.withInnerHorizontalBorders}
    `}

  @media ${breakpoints.tablet} {
    overscroll-behavior: contain auto;
  }
`;

const $HorizontalScrollContainer = styled.div<{
  showFadeStart: boolean;
  showFadeEnd: boolean;
}>`
  ${layoutMixins.horizontalFadeScrollArea}
  --scrollArea-fade-zIndex: calc(var(--stickyHeader-zIndex) + 1);

  ${({ showFadeStart }) =>
    !showFadeStart &&
    css`
      &:before {
        opacity: 0;
      }
    `}

  ${({ showFadeEnd }) =>
    !showFadeEnd &&
    css`
      &:after {
        opacity: 0;
      }
    `};
`;

const $Header = styled.header<{ $side: 'top' | 'bottom' }>`
  ${layoutMixins.contentSectionDetachedScrollable}
  flex: 1;

  ${({ $side }) =>
    ({
      top: css`
        ${layoutMixins.stickyHeader}
      `,
      bottom: css`
        ${layoutMixins.stickyFooter}
        grid-row: 2;
      `,
    })[$side]}

  ${layoutMixins.row}
  justify-content: space-between;
  z-index: var(--stickyHeader-zIndex);
`;

const $List = styled(List)<{ $fullWidthTabs?: boolean; $withBorders?: boolean }>`
  align-self: stretch;

  ${({ $withBorders }) =>
    $withBorders &&
    css`
      ${layoutMixins.withOuterAndInnerBorders}
    `}

  ${({ $fullWidthTabs }) =>
    $fullWidthTabs
      ? css`
          flex: 1;
          ${layoutMixins.gridEqualColumns}
        `
      : css`
          ${layoutMixins.row}
        `}
`;

const $Trigger = styled(Trigger)<{
  $withBorders?: boolean;
  $withUnderline?: boolean;
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

const $Label = styled.div`
  ${layoutMixins.textTruncate}
`;

const $Content = styled(Content)<{ $hide?: boolean; $withTransitions: boolean }>`
  ${layoutMixins.flexColumn}
  outline: none;
  box-shadow: none;

  &[data-state='inactive'] {
    pointer-events: none;
  }

  &[data-state='active'] {
    z-index: var(--activeTab-zIndex);
  }

  ${({ $hide }) =>
    $hide &&
    css`
      display: none;
    `}

  @media (prefers-reduced-motion: no-preference) {
    ${({ $withTransitions }) =>
      $withTransitions &&
      css`
        &[data-state='active'] {
          animation: ${keyframes`
            from {
              translate: 0 -0.25rem -1.5rem;
              opacity: 0;
              /* filter: blur(3px); */
            }
          `} 0.2s var(--ease-out-expo);
        }

        &[data-state='inactive'] {
          min-height: 0;

          animation: ${keyframes`
            to {
              translate: 0 -0.25rem -1.5rem;
              opacity: 0;
              /* filter: blur(3px); */
            }
          `} 0.2s var(--ease-out-expo);
        }
      `}
  }
`;

const $DropdownTabTrigger = styled(Trigger)<{
  $withUnderline?: boolean;
}>`
  ${tabMixins.tabTriggerStyle}
  height: 100%;
  width: 100%;

  ${({ $withUnderline }) =>
    $withUnderline &&
    css`
      ${tabMixins.tabTriggerUnderlineStyle}
    `}
`;

const dropdownSelectMenuType = getSimpleStyledOutputType(
  DropdownSelectMenu,
  {} as { $isActive?: boolean; $withUnderline?: boolean }
);
const $DropdownSelectMenu = styled(DropdownSelectMenu)<{
  $isActive?: boolean;
  $withUnderline?: boolean;
}>`
  --trigger-radius: 0;
  --dropdownSelectMenu-item-font-size: var(--fontSize-base);

  ${({ $isActive, $withUnderline }) =>
    $isActive
      ? $withUnderline
        ? css`
            ${tabMixins.tabTriggerUnderlineStyle}
            ${tabMixins.tabTriggerActiveUnderlineStyle}
          `
        : css`
            --trigger-textColor: var(--trigger-active-textColor);
            --trigger-backgroundColor: var(--trigger-active-backgroundColor);
            --trigger-underline-size: var(--trigger-active-underline-size);
          `
      : css``}
` as typeof dropdownSelectMenuType;

export const MobileTabs = styled(Tabs)`
  --trigger-backgroundColor: transparent;
  --trigger-active-backgroundColor: transparent;
  --tableStickyRow-backgroundColor: var(--color-layer-2);
  --trigger-font: var(--font-extra-book);

  padding-bottom: 1rem;
  gap: var(--border-width);

  > header {
    padding: 0 1rem;

    button {
      padding: 0 0.5rem;
    }
  }
`;
