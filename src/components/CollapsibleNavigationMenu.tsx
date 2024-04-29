import { useEffect, useState } from 'react';

import { Item, Link, List, Root, Sub } from '@radix-ui/react-navigation-menu';
import { NavLink, matchPath, useLocation } from 'react-router-dom';
import styled, { css, type AnyStyledComponent } from 'styled-components';

import { type MenuItem } from '@/constants/menus';

import { popoverMixins } from '@/styles/popoverMixins';

import { Collapsible } from './Collapsible';

type ElementProps<MenuItemValue extends string> = {
  items: MenuItem<MenuItemValue>[];
  onSelectItem?: (value: MenuItemValue) => void;
};

const NavItem = <MenuItemValue extends string>({
  value,
  label,
  href,
  onSelect,
  subitems,

  ...props
}: MenuItem<MenuItemValue>) => {
  const location = useLocation();

  return !href ? null : (
    <Item asChild key={value} value={value}>
      <Link
        asChild
        active={!!matchPath(href, location.pathname)}
        onSelect={() => onSelect?.(value)}
      >
        <NavLink to={href} {...props}>
          {label}
        </NavLink>
      </Link>
    </Item>
  );
};

export const CollapsibleNavigationMenu = <MenuItemValue extends string>({
  onSelectItem,
  items,
}: ElementProps<MenuItemValue>) => {
  const { pathname } = useLocation();
  const [expandedKey, setExpandedKey] = useState('');

  useEffect(() => {
    const itemWithActiveSubitem = items.find((item) =>
      item.subitems?.some((subitem) => matchPath(subitem.href ?? '', pathname))
    );
    if (itemWithActiveSubitem) {
      setExpandedKey(itemWithActiveSubitem.value);
    }
  }, [pathname]);

  return (
    <Root orientation="vertical">
      <Styled.List>
        {items.map((item) =>
          !item.subitems ? (
            <Styled.NavItem key={item.value} onSelect={onSelectItem} {...item} />
          ) : (
            <Collapsible
              key={item.value}
              open={expandedKey === item.value}
              onOpenChange={(open) => {
                setExpandedKey(!open ? '' : item.value);
              }}
              label={
                <Styled.CollapsibleItem value={item.value}>{item.label}</Styled.CollapsibleItem>
              }
              transitionDuration={0.2}
            >
              <Styled.Sub defaultValue={item.subitems?.[0]}>
                {item.subitems.map((subitem: MenuItem<MenuItemValue>) => (
                  <Styled.NavItem key={subitem.value} onSelect={onSelectItem} {...subitem} />
                ))}
              </Styled.Sub>
            </Collapsible>
          )
        )}
      </Styled.List>
    </Root>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

const navItemStyle = css`
  ${popoverMixins.item}
  --item-padding: 0.5em 0.75em;
  --item-radius: 0.5rem;
  --item-checked-backgroundColor: var(--color-layer-1);
  --item-checked-textColor: var(--color-text-0);
`;

Styled.List = styled(List)`
  gap: 0.5rem;
`;

Styled.CollapsibleItem = styled(Item)`
  ${navItemStyle}
  --item-padding: 0;
`;

Styled.Sub = styled(Sub)`
  margin: -0.25rem 0.5rem 0;
  padding-left: 0.5em;
  border-left: solid var(--border-width) var(--color-border);

  font-size: 0.92em;
`;

Styled.NavItem = styled(NavItem)`
  ${navItemStyle}
  margin: 0.25em 0;
  justify-content: flex-start;

  ${Styled.Sub} & {
    --item-padding: 0.5em 0.7em;
  }
`;
