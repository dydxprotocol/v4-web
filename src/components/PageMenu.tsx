import styled, { AnyStyledComponent } from 'styled-components';

import type { MenuGroup } from '@/constants/menus';

import { layoutMixins } from '@/styles/layoutMixins';

import { PageMenuItem, type PageMenuItemType } from './PageMenu/PageMenuItem';

export const PageMenu = <MenuItemValue extends string, MenuGroupValue extends string>({
  items,
}: MenuGroup<MenuItemValue, MenuGroupValue, PageMenuItemType>) => (
  <Styled.PageMenu>
    {items.map((item) => (
      <PageMenuItem key={item.value} {...item} />
    ))}
  </Styled.PageMenu>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.PageMenu = styled.menu`
  ${layoutMixins.flexColumn}
  ${layoutMixins.withInnerHorizontalBorders}

  font: var(--font-medium-book);
`;
