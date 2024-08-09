import { useEffect, useState } from 'react';

import { Item, Link, List, Root, Sub } from '@radix-ui/react-navigation-menu';
import { NavLink, matchPath, useLocation } from 'react-router-dom';
import styled, { css } from 'styled-components';

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
      <List tw="gap-0.5">
        {items.map((item) =>
          !item.subitems ? (
            <$NavItem key={item.value} onSelect={onSelectItem} {...item} />
          ) : (
            <Collapsible
              key={item.value}
              open={expandedKey === item.value}
              onOpenChange={(open) => {
                setExpandedKey(!open ? '' : item.value);
              }}
              label={<$CollapsibleItem value={item.value}>{item.label}</$CollapsibleItem>}
              transitionDuration={0.2}
            >
              <$Sub defaultValue={item.subitems?.[0]?.value}>
                {item.subitems.map((subitem: MenuItem<MenuItemValue>) => (
                  <$NavItem key={subitem.value} onSelect={onSelectItem} {...subitem} />
                ))}
              </$Sub>
            </Collapsible>
          )
        )}
      </List>
    </Root>
  );
};
const navItemStyle = css`
  ${popoverMixins.item}
  --item-padding: 0.5em 0.75em;
  --item-radius: 0.5rem;
  --item-checked-backgroundColor: var(--color-layer-1);
  --item-checked-textColor: var(--color-text-0);
`;
const $CollapsibleItem = styled(Item)`
  ${navItemStyle}
  --item-padding: 0;
`;

const $Sub = styled(Sub)`
  margin: -0.25rem 0.5rem 0;
  padding-left: 0.5em;
  border-left: solid var(--border-width) var(--color-border);

  font-size: 0.92em;
`;

const $NavItem = styled(NavItem)`
  ${navItemStyle}
  margin: 0.25em 0;
  justify-content: flex-start;

  ${$Sub} & {
    --item-padding: 0.5em 0.7em;
  }
` as typeof NavItem;
