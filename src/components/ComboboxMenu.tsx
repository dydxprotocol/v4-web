import { Fragment, type ReactNode, useState } from 'react';
import styled, { type AnyStyledComponent, css } from 'styled-components';
import { Command } from 'cmdk';

import { type MenuConfig } from '@/constants/menus';
import { popoverMixins } from '@/styles/popoverMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { Tag } from '@/components/Tag';

type ElementProps<MenuItemValue extends string, MenuGroupValue extends string> = {
  items: MenuConfig<MenuItemValue, MenuGroupValue>;
  onItemSelected?: () => void;

  title?: string;
  inputPlaceholder?: string;
  slotEmpty?: ReactNode;
  withSearch?: boolean;
};

type StyleProps = {
  className?: string;
  withStickyLayout?: boolean;
};

export const ComboboxMenu = <MenuItemValue extends string, MenuGroupValue extends string>({
  items,
  onItemSelected,

  title,
  inputPlaceholder = 'Search…',
  slotEmpty = 'No items found.',
  withSearch = true,

  className,
  withStickyLayout,
}: ElementProps<MenuItemValue, MenuGroupValue> & StyleProps) => {
  const [highlightedCommand, setHighlightedCommand] = useState<MenuItemValue>();
  const [searchValue, setSearchValue] = useState('');
  // const inputRef = useRef<HTMLInputElement | null>(null);

  // console.log({ commandValue: highlightedCommand });

  // useEffect(() => {
  //   inputRef?.current?.focus();
  // }, []);

  return (
    <Styled.Command
      label={title}
      // value={highlightedCommand}
      // onValueChange={setHighlightedCommand}
      filter={(value: string, search: string) => {
        if (value.replace(/ /g, '').includes(search.replace(/ /g, ''))) return 1;
        return 0;
      }}
      className={className}
      $withStickyLayout={withStickyLayout}
    >
      {withSearch && (
        <Styled.Header $withStickyLayout={withStickyLayout}>
          <Styled.Input
            // ref={inputRef}
            type="search"
            value={searchValue}
            onValueChange={setSearchValue}
            autoFocus
            placeholder={inputPlaceholder}
          />
        </Styled.Header>
      )}

      <Styled.List $withStickyLayout={withStickyLayout}>
        {items.map((group) => (
          <Styled.Group
            key={group.group}
            heading={group.groupLabel}
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
                >
                  {item.slotBefore}
                  <Styled.ItemLabel>
                    <span>
                      {`${item.label}${item.subitems?.length ? '…' : ''}`}
                      {item.tag && (
                        <>
                          {' '}
                          <Tag>{item.tag}</Tag>
                        </>
                      )}
                    </span>
                    {item.description && <span>{item.description}</span>}
                  </Styled.ItemLabel>
                  {item.slotAfter}
                  {item.subitems && '→'}
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

Styled.Group = styled(Command.Group)<{ $withStickyLayout?: boolean }>`
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
      }

      > [cmdk-group-items] {
        ${layoutMixins.stickyArea3}
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

Styled.Item = styled(Command.Item)`
  ${popoverMixins.item}
  --item-checked-backgroundColor: var(--comboboxMenu-item-checked-backgroundColor);
  --item-checked-textColor: var(--comboboxMenu-item-checked-textColor);
  --item-highlighted-textColor: var(--comboboxMenu-item-highlighted-textColor);

  ${layoutMixins.scrollSnapItem}

  background-color: var(--comboboxMenu-backgroundColor, inherit);

  display: flex;
  align-items: center;
  gap: 0.5rem;

  &[aria-disabled='true'] {
    opacity: 0.75;
    cursor: not-allowed;
  }
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
`;

Styled.Empty = styled(Command.Empty)`
  color: var(--color-text-0);
  padding: 1rem;
  height: 100%;
`;
