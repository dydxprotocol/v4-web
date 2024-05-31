import { Ref } from 'react';

import {
  Content,
  Item,
  Link,
  List,
  Root,
  Sub,
  Trigger,
  Viewport,
} from '@radix-ui/react-navigation-menu';
import { NavLink, matchPath, useLocation } from 'react-router-dom';
import styled, { css, keyframes } from 'styled-components';

import { MenuConfig, MenuItem } from '@/constants/menus';

import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

import { forwardRefFn, getSimpleStyledOutputType } from '@/lib/genericFunctionalComponentUtils';
import { isExternalLink } from '@/lib/isExternalLink';

import { Icon, IconName } from './Icon';
import { Tag } from './Tag';

type ElementProps<MenuItemValue extends string, MenuGroupValue extends string> = {
  items: MenuConfig<MenuItemValue, MenuGroupValue>;
  onSelectItem?: (value: MenuItemValue) => void;
};

type StyleProps = {
  orientation?: 'vertical' | 'horizontal';
  itemOrientation?: 'vertical' | 'horizontal';
  submenuPlacement?: 'inline' | 'viewport';
  dir?: 'ltr' | 'rtl';
  className?: string;
};

const NavItemWithRef = <MenuItemValue extends string>(
  {
    value,
    slotBefore,
    label,
    tag,
    href,
    slotAfter = isExternalLink(href) ? <Icon iconName={IconName.LinkOut} /> : undefined,
    onSelect,
    subitems,
    type,
    ...props
  }: MenuItem<MenuItemValue, string | number>,
  ref: Ref<HTMLAnchorElement | HTMLButtonElement | HTMLDivElement>
) => {
  const location = useLocation();

  const children = (
    <>
      {slotBefore}
      <span>
        {label}
        {tag && (
          <>
            {' '}
            <Tag>{tag}</Tag>
          </>
        )}
      </span>
      {slotAfter}
      {subitems?.length && <$Icon iconName={IconName.Triangle} />}
    </>
  );

  return href ? (
    <Link
      active={!!matchPath(href, location.pathname)}
      onSelect={() => onSelect?.(value)}
      asChild
      target={isExternalLink(href) ? '_blank' : undefined}
    >
      <NavLink to={href} ref={ref as Ref<HTMLAnchorElement>} type={`${type}`} {...props}>
        {children}
      </NavLink>
    </Link>
  ) : props.onClick ? (
    <Link asChild onSelect={() => onSelect?.(value)}>
      <button ref={ref as Ref<HTMLButtonElement>} {...props} type="button">
        {children}
      </button>
    </Link>
  ) : (
    <div ref={ref as Ref<HTMLDivElement>} {...props}>
      {children}
    </div>
  );
};

const NavItem = forwardRefFn(NavItemWithRef);

export const NavigationMenu = <MenuItemValue extends string, MenuGroupValue extends string>({
  onSelectItem,
  items,
  orientation = 'vertical',
  itemOrientation = 'horizontal',
  submenuPlacement = 'inline', // orientation === 'horizontal' ? 'viewport' : 'inline',
  dir = 'ltr',
  className,
}: ElementProps<MenuItemValue, MenuGroupValue> & StyleProps) => {
  const renderSubitems = ({
    item,
    depth = 0,
  }: {
    item: MenuItem<MenuItemValue, string | number>;
    depth: number;
  }) => (
    <>
      <$SubMenuTrigger
        asChild
        onPointerMove={(e: React.MouseEvent) => e.preventDefault()}
        onPointerLeave={(e: React.MouseEvent) => e.preventDefault()}
      >
        <$NavItem onSelect={onSelectItem} orientation={itemOrientation} {...item} />
      </$SubMenuTrigger>

      <$Content
        onPointerEnter={(e: React.MouseEvent) => e.preventDefault()}
        onPointerLeave={(e: React.MouseEvent) => e.preventDefault()}
        data-placement={submenuPlacement}
      >
        <$Sub data-placement={submenuPlacement}>
          <$List
            data-orientation={depth > 0 ? 'menu' : orientation === 'vertical' ? 'vertical' : 'menu'}
          >
            {item?.subitems?.map((subitem) => (
              <$ListItem key={subitem.value} value={subitem.value} data-item={subitem.value}>
                {subitem?.subitems ? (
                  renderSubitems({ item: subitem, depth: depth + 1 })
                ) : (
                  <$NavItem onSelect={onSelectItem} orientation={itemOrientation} {...subitem} />
                )}
              </$ListItem>
            ))}
          </$List>
        </$Sub>
      </$Content>
    </>
  );

  return (
    <$Root orientation={orientation} dir={dir} className={className}>
      {items.map((group) => (
        <$Group key={group.group}>
          {group.groupLabel && (
            <$GroupHeader>
              <h3>{group.groupLabel}</h3>
            </$GroupHeader>
          )}

          <$List data-orientation={orientation}>
            {group.items.map((item) => (
              <$ListItem key={item.value} value={item.value} data-item={item.value}>
                {item.subitems ? (
                  renderSubitems({ item, depth: 0 })
                ) : (
                  <$NavItem onSelect={onSelectItem} orientation={itemOrientation} {...item} />
                )}
              </$ListItem>
            ))}
          </$List>
        </$Group>
      ))}

      {submenuPlacement === 'viewport' && <$Viewport data-orientation={orientation} />}
    </$Root>
  );
};
const $Root = styled(Root)`
  /* Params */
  --navigationMenu-height: auto;

  --navigationMenu-item-height: 2rem;

  --navigationMenu-item-checked-backgroundColor: var(--color-layer-1);
  --navigationMenu-item-checked-textColor: var(--color-text-2);
  --navigationMenu-item-highlighted-backgroundColor: var(--color-layer-4);
  --navigationMenu-item-highlighted-textColor: var(--color-text-2);
  --navigationMenu-item-radius: 0.5rem;
  --navigationMenu-item-padding: 0.5rem 1rem;

  /* Rules */
  align-self: stretch;

  --submenu-side-offset: 0.75rem; // placement="viewport"
  // --submenu-side-offset: 1rem; // placement="inline"

  position: relative;

  &[data-orientation='horizontal'] {
    ${layoutMixins.row}
    align-items: stretch;

    margin: calc((var(--navigationMenu-height) - var(--navigationMenu-item-height)) / 2) 0;
    height: max-content;
  }
  &[data-orientation='vertical'] {
    ${layoutMixins.column}
  }

  div[style='position: relative;'] {
    display: grid;
  }
`;

const $Viewport = styled(Viewport)`
  ${popoverMixins.popover}
  ${popoverMixins.popoverAnimation}
  --popover-origin: center top;

  ${layoutMixins.stack}
  align-content: start;
  justify-items: center;

  width: var(--radix-navigation-menu-viewport-width);
  height: var(--radix-navigation-menu-viewport-height);
  max-height: var(--radix-navigation-menu-viewport-height);
  transition: 0.3s;
  box-sizing: content-box;

  position: absolute;

  &[data-orientation='horizontal'] {
    top: calc(100% + var(--submenu-side-offset));
    left: 0;
    right: 0;
    margin: auto;
    display: grid;
    justify-content: center;

    z-index: 2;
  }

  &[data-orientation='vertical'] {
    left: 100%;
    /* top: 100%; */
  }
`;

const $List = styled(List)`
  align-self: center;

  &[data-orientation='horizontal'] {
    ${layoutMixins.row}
    gap: 0.5rem;
    align-items: start;
  }

  &[data-orientation='vertical'] {
    ${layoutMixins.flexColumn}
    gap: 0.25rem;
  }
`;

const $Content = styled(Content)`
  ${popoverMixins.popoverAnimation}
  transform-origin: center top;

  &[data-placement='inline'] {
    max-height: 100vh;

    ${$List}[data-orientation="horizontal"] & {
      /* position: absolute;
      top: calc(100% + var(--submenu-side-offset));
      left: 50%;
      right: 50%; */

      position: relative;
      width: 0;
      left: 50%;
      right: 50%;

      display: grid;
      justify-content: center;

      z-index: 2;
    }

    ${$List}[data-orientation="menu"] & {
      position: absolute;
      left: 100%;
      top: 0;
      right: auto;
      display: grid;
      justify-content: start;
    }
  }

  &[data-placement='viewport'] {
    position: absolute;

    &[data-motion='from-start'] {
      animation: ${keyframes`
        from {
          filter: blur(3px);
          opacity: 0;
        }
      `} var(--ease-out-circ) 0.2s;
    }
    &[data-motion='from-end'] {
      animation: ${keyframes`
        from {
          filter: blur(3px);
          opacity: 0;
        }
      `} var(--ease-out-circ) 0.2s;
    }
    &[data-motion='to-start'] {
      animation: ${keyframes`
        to {
          filter: blur(3px);
          opacity: 0;
        }
      `} var(--ease-out-circ) 0.2s;
    }
    &[data-motion='to-end'] {
      animation: ${keyframes`
        to {
          filter: blur(3px);
          opacity: 0;
        }
      `} var(--ease-out-circ) 0.2s;
    }
  }
`;

const $Sub = styled(Sub)`
  &[data-placement='inline'] {
    ${popoverMixins.popover}
    --popover-width: max-content;
    overflow: visible;

    ${$List}[data-orientation="vertical"] > & {
      margin-top: var(--gap, 0.25rem);

      padding: 0.5rem;
    }

    ${$List}[data-orientation="menu"] & {
      border-top-left-radius: 0 !important;
    }
  }
`;

const $Group = styled.section`
  ${$Root}[data-orientation="vertical"] & {
    ${layoutMixins.stickyArea0}
    --stickyArea0-topHeight: 3rem;
  }

  ${layoutMixins.column}

  color: var(--color-text-0);
`;

const $GroupHeader = styled.header`
  ${layoutMixins.stickyHeader}
  ${layoutMixins.row}

  padding: 0.5rem 0.75rem 0rem;
  font: var(--font-small-medium);
`;

const $ListItem = styled(Item)`
  display: grid;
  position: relative;

  ${$List}[data-orientation="horizontal"] > & {
    gap: var(--submenu-side-offset);
  }
`;

const $SubMenuTrigger = styled(Trigger)`
  border-radius: var(--navigationMenu-item-radius);
  outline-offset: -2px;

  &[data-state='open'] {
    svg {
      rotate: 0.5turn;
    }
  }
`;

type NavItemStyleProps = { orientation: 'horizontal' | 'vertical' };
const NavItemTypeTemp = getSimpleStyledOutputType(NavItem, {} as NavItemStyleProps);

const $NavItem = styled(NavItem)<NavItemStyleProps>`
  ${({ subitems }) =>
    subitems?.length
      ? css`
          ${popoverMixins.trigger}
          --trigger-open-backgroundColor: var(--navigationMenu-item-checked-backgroundColor);
        `
      : css`
          &:hover:not(:active) {
            background-color: var(--navigationMenu-item-highlighted-backgroundColor);
            color: var(--navigationMenu-item-highlighted-textColor);
          }
        `}

  ${popoverMixins.item}
  --item-checked-backgroundColor: var(--navigationMenu-item-checked-backgroundColor);
  --item-checked-textColor: var(--navigationMenu-item-checked-textColor);
  --item-highlighted-backgroundColor: var(--navigationMenu-item-highlighted-backgroundColor);
  --item-highlighted-textColor: var(--navigationMenu-item-highlighted-textColor);
  --item-radius: var(--navigationMenu-item-radius);
  --item-padding: var(--navigationMenu-item-padding);

  ${layoutMixins.scrollSnapItem}

  min-height: var(--navigationMenu-item-height);

  ${({ orientation }) =>
    ({
      horizontal: css`
        ${layoutMixins.row}
      `,
      vertical: css`
        ${layoutMixins.column}
        justify-items: center;
        align-content: center;
      `,
    })[orientation]}
  gap: 0.7rem 0.5rem;

  > span {
    flex: 1;

    display: inline-flex;
    align-items: center;
    gap: 0.5ch;
  }

  /* Border-radius! */

  ${$List}[data-orientation="menu"] & {
    --item-radius: 0;
  }

  ${$List}[data-orientation="menu"] > ${$ListItem}:first-child > & {
    border-top-left-radius: var(--popover-radius);

    &:not([data-state='open']) {
      border-top-right-radius: var(--popover-radius);
    }
  }

  ${$List}[data-orientation="menu"] > ${$ListItem}:last-child > & {
    border-bottom-left-radius: var(--popover-radius);

    &:not([data-state='open']) {
      border-bottom-right-radius: var(--popover-radius);
    }
  }

  ${$List}[data-orientation="menu"] ${$List}[data-orientation="menu"] > ${$ListItem}:first-child > & {
    border-top-left-radius: 0;
  }
` as typeof NavItemTypeTemp;

const $Icon = styled(Icon)`
  font-size: 0.375em;
  transition: rotate 0.3s var(--ease-out-expo);

  ${$List}[data-orientation="menu"] & {
    rotate: -0.25turn;
  }
`;
