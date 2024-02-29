import { Fragment, type ReactNode, useState } from 'react';

import { Command } from 'cmdk';
import styled, { type AnyStyledComponent, css } from 'styled-components';

import { MenuItem, type MenuConfig } from '@/constants/menus';

import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

import { Tag } from '@/components/Tag';

type ElementProps<MenuItemValue extends string | number, MenuGroupValue extends string | number> = {
  items: MenuConfig<MenuItemValue, MenuGroupValue>;
  onItemSelected?: () => void;

  title?: string;
  inputPlaceholder?: string;
  slotEmpty?: ReactNode;
  withSearch?: boolean;
};

type StyleProps = {
  className?: string;
  withItemBorders?: boolean;
  withStickyLayout?: boolean;
};

export type ComboboxMenuProps<
  MenuItemValue extends string | number,
  MenuGroupValue extends string | number
> = ElementProps<MenuItemValue, MenuGroupValue> & StyleProps;

export const ComboboxMenu = <MenuItemValue extends string, MenuGroupValue extends string>({
  items,
  onItemSelected,

  title,
  inputPlaceholder = 'Search…',
  slotEmpty = 'No items found.',
  withSearch = true,

  className,
  withItemBorders,
  withStickyLayout,
}: ComboboxMenuProps<MenuItemValue, MenuGroupValue>) => {
  const [highlightedCommand, setHighlightedCommand] = useState<MenuItemValue>();
  const [searchValue, setSearchValue] = useState('');

  return (
    <Styled.Command
      label={title}
      // value={highlightedCommand}
      // onValueChange={setHighlightedCommand}
      filter={(value: string, search: string) =>
        value.replace(/ /g, '').toLowerCase().includes(search.replace(/ /g, '').toLowerCase())
          ? 1
          : 0
      }
      className={className}
      $withStickyLayout={withStickyLayout}
    >
      {withSearch && (
        <Styled.Header $withStickyLayout={withStickyLayout}>
          <Styled.Input
            /**
             * Mobile Issue: Search Input will always trigger mobile keyboard drawer. There is no fix.
             * https://github.com/pacocoursey/cmdk/issues/127
             */
            autoFocus
            type="search"
            value={searchValue}
            onValueChange={setSearchValue}
            placeholder={inputPlaceholder}
          />
        </Styled.Header>
      )}

      <Styled.List $withStickyLayout={withStickyLayout}>
        {items.map((group) => (
          <Styled.Group
            key={group.group}
            heading={group.groupLabel}
            $withItemBorders={withItemBorders}
            $withStickyLayout={withStickyLayout}
          >
            {group.items.map((item) => (
              <Fragment key={item.value}>
                <Styled.Item
                  // value={item.value} // search by both value and textContent
                  // value={[group.groupLabel, item.label, item.tag].filter(Boolean).join('|')} // exclude item.value from searchable terms (not guaranteed to be unique)
                  value={[group.groupLabel, item.value, item.description, item.label, item.tag]
                    .filter(Boolean)
                    .join('|')}
                  onSelect={() => {
                    if (item.subitems) {
                      // open submenu
                    } else {
                      item.onSelect?.(item.value);
                      onItemSelected?.();
                    }
                  }}
                  disabled={item.disabled}
                  $withItemBorders={withItemBorders}
                >
                  {
                    <>
                      {item.slotBefore}
                      {item.slotCustomContent ?? (
                        <Styled.ItemLabel>
                          <span>
                            {typeof item.label === 'string'
                              ? `${item.label}${item.subitems?.length ? '…' : ''}`
                              : item.label}
                            {item.tag && (
                              <>
                                {' '}
                                <Tag>{item.tag}</Tag>
                              </>
                            )}
                          </span>
                          {item.description && <span>{item.description}</span>}
                        </Styled.ItemLabel>
                      )}
                      {item.slotAfter}
                      {item.subitems && '→'}
                    </>
                  }
                </Styled.Item>

                {searchValue &&
                  item.subitems?.map((subitem) => (
                    <Fragment key={subitem.value}>
                      <Styled.Item
                        // value={subitem.value} // search by both value and textContent
                        // value={[group.groupLabel, item.label, subitem.label, subitem.tag].filter(Boolean).join('|')}
                        value={[
                          group.groupLabel,
                          item.value,
                          item.description,
                          item.label,
                          item.tag,
                        ]
                          .filter(Boolean)
                          .join('|')}
                        onSelect={() => {
                          subitem.onSelect?.(subitem.value);
                          onItemSelected?.();
                        }}
                        disabled={subitem.disabled}
                        $withItemBorders={withItemBorders}
                      >
                        {subitem.slotBefore}
                        <Styled.ItemLabel>
                          <span>
                            {subitem.label}
                            {subitem.tag && (
                              <>
                                {' '}
                                <Tag>{subitem.tag}</Tag>
                              </>
                            )}
                          </span>
                          {item.description && <span>{item.description}</span>}
                        </Styled.ItemLabel>
                        {subitem.slotAfter}
                      </Styled.Item>
                    </Fragment>
                  ))}
              </Fragment>
            ))}
          </Styled.Group>
        ))}
        {slotEmpty && searchValue.trim() !== '' && <Styled.Empty>{slotEmpty}</Styled.Empty>}
      </Styled.List>
    </Styled.Command>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Command = styled(Command)<{ $withStickyLayout?: boolean }>`
  --comboboxMenu-backgroundColor: var(--color-layer-2);

  --comboboxMenu-input-backgroundColor: var(--color-layer-3);
  --comboboxMenu-input-height: 2.5rem;

  --comboboxMenu-item-checked-backgroundColor: ;
  --comboboxMenu-item-checked-textColor: ;
  --comboboxMenu-item-highlighted-backgroundColor: var(--color-layer-3);
  --comboboxMenu-item-highlighted-textColor: var(--color-text-1);
  --comboboxMenu-item-backgroundColor: ;
  --comboboxMenu-item-gap: 0.5rem;
  --comboboxMenu-item-padding: 0.5em 1em;

  display: grid;
  align-content: start;

  background-color: var(--comboboxMenu-backgroundColor);
  border-radius: inherit;

  input:focus-visible {
    outline: none;
  }

  ${({ $withStickyLayout }) =>
    $withStickyLayout
      ? css`
          ${layoutMixins.stickyArea1}
          --stickyArea1-background: var(--comboboxMenu-backgroundColor);
          --stickyArea1-topHeight: 4rem;
        `
      : css`
          ${() => Styled.List} {
            overflow-y: auto;
          }
        `}
`;

Styled.Header = styled.header<{ $withStickyLayout?: boolean }>`
  display: grid;
  align-items: center;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  background-color: var(--comboboxMenu-backgroundColor);

  ${({ $withStickyLayout }) =>
    $withStickyLayout &&
    css`
      ${layoutMixins.stickyHeader}
      ${layoutMixins.scrollSnapItem}
    `}
`;

Styled.Input = styled(Command.Input)`
  height: var(--comboboxMenu-input-height);
  padding: 0.5rem;
  background-color: var(--comboboxMenu-input-backgroundColor);
  border-radius: 0.5rem;
  gap: 0.5rem;
`;

Styled.Group = styled(Command.Group)<{ $withItemBorders?: boolean; $withStickyLayout?: boolean }>`
  color: var(--color-text-0);

  > [cmdk-group-heading] {
    padding: 0.5rem 0.75rem 0.3rem;
    font: var(--font-base-medium);
    background-color: var(--comboboxMenu-backgroundColor, inherit);
  }

  ${({ $withStickyLayout }) =>
    $withStickyLayout &&
    css`
      ${layoutMixins.stickyArea2}
      --stickyArea2-topHeight: 2rem;

      > [cmdk-group-heading] {
        ${layoutMixins.stickyHeader}
        z-index: 2;
      }

      > [cmdk-group-items] {
        ${layoutMixins.stickyArea3}
      }
    `}

  ${({ $withItemBorders }) =>
    $withItemBorders &&
    css`
      > [cmdk-group-items] {
        padding: var(--border-width) 0;
      }
    `}
`;

Styled.List = styled(Command.List)<{ $withStickyLayout?: boolean }>`
  isolation: isolate;
  background-color: var(--comboboxMenu-backgroundColor, inherit);

  > [cmdk-list-sizer] {
    display: grid;
    ${layoutMixins.withOuterAndInnerBorders}
  }

  @media (prefers-reduced-motion: no-preference) {
    /* transition: height 0.3s var(--ease-in-out-expo); */
    transition: height 0.5s var(--ease-out-expo);
    /* transition: height 0.5s ease-in-out; */
  }

  ${({ $withStickyLayout }) =>
    $withStickyLayout &&
    css`
      /* prevent sticky group borders from randomly bleeding under sticky group headers' backdrop-filter */
      contain: strict;
      height: var(--cmdk-list-height);
    `}
`;

Styled.Item = styled(Command.Item)<{ $withItemBorders?: boolean }>`
  ${layoutMixins.scrollSnapItem}
  ${popoverMixins.item}
  --item-checked-backgroundColor: var(--comboboxMenu-item-checked-backgroundColor);
  --item-checked-textColor: var(--comboboxMenu-item-checked-textColor);
  --item-highlighted-textColor: var(--comboboxMenu-item-highlighted-textColor);
  --item-gap: var(--comboboxMenu-item-gap);
  --item-padding: var(--comboboxMenu-item-padding);

  background-color: var(--comboboxMenu-backgroundColor, inherit);

  display: flex;
  align-items: center;

  &[aria-disabled='true'] {
    opacity: 0.75;
    cursor: not-allowed;
  }

  ${({ $withItemBorders }) =>
    $withItemBorders &&
    css`
      ${layoutMixins.withOuterBorder}
    `}
`;

Styled.ItemLabel = styled.div`
  flex: 1;

  ${layoutMixins.rowColumn}

  > span {
    display: inline-flex;
    align-items: center;
    gap: 0.5ch;

    &:nth-child(2) {
      font: var(--font-small-book);
      color: var(--color-text-0);
      opacity: 0.8;
    }
  }

  min-width: 0;
`;

Styled.Empty = styled(Command.Empty)`
  color: var(--color-text-0);
  padding: 1rem;
  height: 100%;
`;
