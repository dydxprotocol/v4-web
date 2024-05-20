import { Item, Root } from '@radix-ui/react-radio-group';
import styled from 'styled-components';

import type { MenuItem } from '@/constants/menus';

import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

import { Icon, IconName } from '@/components/Icon';

export const PageMenuRadioGroupItem = <
  MenuItemValue extends string,
  PageMenuItemType extends string
>({
  value: curentValue,
  onSelect,
  subitems,
}: MenuItem<MenuItemValue, PageMenuItemType>) =>
  subitems?.length ? (
    <$Root value={curentValue} onValueChange={onSelect}>
      {subitems.map(({ disabled, value, label, slotBefore }) => (
        <$MenuItem key={value} value={value} disabled={disabled}>
          <div>
            {slotBefore}
            <span>{label}</span>
          </div>
          {value === curentValue ? <$CheckIcon iconName={IconName.Check} /> : <$EmptyIcon />}
        </$MenuItem>
      ))}
    </$Root>
  ) : null;
const $Root = styled(Root)`
  ${layoutMixins.flexColumn}
  ${layoutMixins.withInnerHorizontalBorders}

  gap: var(--border-width);
`;

const $MenuItem = styled(Item)`
  ${layoutMixins.spacedRow}
  ${popoverMixins.item}

  --item-padding: 1.25rem 1.625rem;
  --item-checked-backgroundColor: var(--color-layer-0);
`;

const $CheckIcon = styled(Icon)`
  padding: 4px;

  border-radius: 50%;

  color: var(--color-text-1);
  background-color: var(--color-accent);
`;

const $EmptyIcon = styled.div`
  width: 0.9em;
  height: 0.9em;

  box-shadow: 0 0 0 0.1em var(--color-layer-5);
  border-radius: 50%;

  background-color: var(--color-layer-0);
`;
