import { Link } from 'react-router-dom';
import styled, { AnyStyledComponent } from 'styled-components';

import type { MenuItem } from '@/constants/menus';

import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

import { Icon, IconName } from '@/components/Icon';

export const PageMenuNavigationItem = <
  MenuItemValue extends string,
  PageMenuItemType extends string
>({
  href,
  label,
  labelRight,
}: MenuItem<MenuItemValue, PageMenuItemType>) => (
  <Link to={href || ''}>
    <Styled.MenuItem>
      <div>{label}</div>
      <Styled.RightRow>
        {labelRight && <span>{labelRight}</span>}
        <Styled.Icon iconName={IconName.ChevronRight} />
      </Styled.RightRow>
    </Styled.MenuItem>
  </Link>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.MenuItem = styled.ul`
  ${popoverMixins.item}

  --item-padding: 1.25rem 1.625rem;
  /* --item-border-width: var(--border-width); */

  ${layoutMixins.spacedRow}
`;

Styled.RightRow = styled.div`
  ${layoutMixins.row}
  gap: 1rem;

  font: var(--font-base-book);
  color: var(--color-text-0);
`;

Styled.Icon = styled(Icon)`
  color: var(--color-text-0);
`;
