import styled, { AnyStyledComponent } from 'styled-components';
import { Root, Item } from '@radix-ui/react-radio-group';

import type { MenuItem } from '@/constants/menus';

import { Icon, IconName } from '@/components/Icon';

import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

export const PageMenuRadioGroupItem = <
  MenuItemValue extends string,
  PageMenuItemType extends string
>({
  value: curentValue,
  onSelect,
  subitems,
}: MenuItem<MenuItemValue, PageMenuItemType>) =>
  subitems?.length ? (
    <Styled.Root value={curentValue} onValueChange={onSelect}>
      {subitems.map(({ disabled, value, label, slotBefore }) => (
        <Styled.MenuItem key={value} value={value} disabled={disabled}>
          <div>
            <>{slotBefore}</>
            <span>{label}</span>
          </div>
          {value === curentValue ? (
            <Styled.CheckIcon iconName={IconName.Check} />
          ) : (
            <Styled.EmptyIcon />
          )}
        </Styled.MenuItem>
      ))}
    </Styled.Root>
  ) : null;

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Root = styled(Root)`
  ${layoutMixins.flexColumn}
  ${layoutMixins.withInnerHorizontalBorders}

  gap: var(--border-width);
`;

Styled.MenuItem = styled(Item)<{ $selected: boolean }>`
  ${layoutMixins.spacedRow}
  ${popoverMixins.item}

  --item-padding: 1.25rem 1.625rem;
  --item-checked-backgroundColor: var(--color-layer-0);
`;

Styled.CheckIcon = styled(Icon)`
  padding: 4px;

  border-radius: 50%;

  color: var(--color-text-1);
  background-color: var(--color-accent);
`;

Styled.EmptyIcon = styled.div`
  width: 0.9em;
  height: 0.9em;

  box-shadow: 0 0 0 0.1em var(--color-layer-5);
  border-radius: 50%;

  background-color: var(--color-layer-0);
`;

