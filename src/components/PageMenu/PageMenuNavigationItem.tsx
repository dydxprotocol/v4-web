import { Link } from 'react-router-dom';
import styled from 'styled-components';

import type { MenuItem } from '@/constants/menus';

import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

import { Icon, IconName } from '@/components/Icon';

export const PageMenuNavigationItem = <
  MenuItemValue extends string,
  PageMenuItemType extends string,
>({
  href,
  label,
  labelRight,
}: MenuItem<MenuItemValue, PageMenuItemType>) => (
  <Link to={href ?? ''}>
    <$MenuItem>
      <div>{label}</div>
      <$RightRow>
        {labelRight && <span>{labelRight}</span>}
        <$Icon iconName={IconName.ChevronRight} />
      </$RightRow>
    </$MenuItem>
  </Link>
);
const $MenuItem = styled.ul`
  ${popoverMixins.item}

  --item-padding: 1.25rem 1.625rem;
  /* --item-border-width: var(--border-width); */

  ${layoutMixins.spacedRow}
`;

const $RightRow = styled.div`
  ${layoutMixins.row}
  gap: 1rem;

  font: var(--font-base-book);
  color: var(--color-text-0);
`;

const $Icon = styled(Icon)`
  color: var(--color-text-0);
`;
