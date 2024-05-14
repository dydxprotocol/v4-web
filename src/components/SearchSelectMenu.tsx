import { useRef, useState, type ReactNode } from 'react';

import styled, { css } from 'styled-components';

import { type MenuConfig } from '@/constants/menus';

import { useOnClickOutside } from '@/hooks';

import breakpoints from '@/styles/breakpoints';
import { formMixins } from '@/styles/formMixins';
import { layoutMixins } from '@/styles/layoutMixins';

import { ComboboxMenu } from '@/components/ComboboxMenu';
import { type DetailsItem } from '@/components/Details';
import { Icon, IconName } from '@/components/Icon';
import { Popover, TriggerType } from '@/components/Popover';
import { WithDetailsReceipt } from '@/components/WithDetailsReceipt';
import { WithLabel } from '@/components/WithLabel';

type ElementProps = {
  asChild?: boolean;
  children: ReactNode;
  disabled?: boolean;
  label?: string;
  items: MenuConfig<string, string>;
  slotEmpty?: ReactNode;
  withSearch?: boolean;
  withReceiptItems?: DetailsItem[];
};

type StyleProps = {
  className?: string;
};

export type SearchSelectMenuProps = ElementProps & StyleProps;

export const SearchSelectMenu = ({
  asChild,
  children,
  className,
  label,
  items,
  withSearch = true,
  withReceiptItems,
}: SearchSelectMenuProps) => {
  const [open, setOpen] = useState(false);
  const searchSelectMenuRef = useRef<HTMLDivElement & HTMLButtonElement>(null);

  useOnClickOutside({
    onClickOutside(e: MouseEvent) {
      setOpen(false);
    },
    ref: searchSelectMenuRef,
  });

  const Trigger = asChild ? (
    children
  ) : (
    <$MenuTrigger>
      {label ? <$WithLabel label={label}>{children}</$WithLabel> : children}
      <$TriggerIcon iconName={IconName.Triangle} open={open} />
    </$MenuTrigger>
  );

  return (
    <$SearchSelectMenu className={className} ref={searchSelectMenuRef}>
      <$WithDetailsReceipt detailItems={withReceiptItems} side="bottom">
        <$Popover
          open={open}
          onOpenChange={setOpen}
          slotTrigger={Trigger}
          triggerType={TriggerType.SearchSelect}
          fullWidth
          noBlur
        >
          <$ComboboxMenu
            items={items}
            withSearch={withSearch}
            onItemSelected={() => setOpen(false)}
            withStickyLayout
            $withSearch={withSearch}
          />
        </$Popover>
      </$WithDetailsReceipt>
    </$SearchSelectMenu>
  );
};
const $SearchSelectMenu = styled.div`
  ${layoutMixins.column}
`;

const $MenuTrigger = styled.div`
  height: var(--form-input-height);

  ${layoutMixins.spacedRow}
  align-items: center;
  padding: var(--form-input-paddingY) var(--form-input-paddingX);

  @media ${breakpoints.tablet} {
    height: var(--form-input-height-mobile);
  }
`;

const $WithLabel = styled(WithLabel)`
  ${formMixins.inputLabel}

  label {
    font: var(--font-mini-book);
  }
`;

const $WithDetailsReceipt = styled(WithDetailsReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);

  abbr {
    background-color: var(--withReceipt-backgroundColor);
  }
`;

const $Popover = styled(Popover)`
  max-height: 30vh;
  margin-top: 1rem;
  border: var(--border-width) solid var(--color-layer-6);
  border-radius: 0.5rem;
  z-index: 2;
  box-shadow: none;
`;

type ComboboxMenuStyleProps = { $withSearch?: boolean };

const $ComboboxMenu = styled(ComboboxMenu)<ComboboxMenuStyleProps>`
  ${layoutMixins.withInnerHorizontalBorders}

  --comboboxMenu-backgroundColor: var(--color-layer-4);

  --comboboxMenu-input-backgroundColor: var(--color-layer-4);
  --comboboxMenu-input-height: 1.375rem;

  --comboboxMenu-item-checked-backgroundColor: var(--color-layer-4);
  --comboboxMenu-item-highlighted-backgroundColor: var(--color-layer-5);
  --comboboxMenu-item-checked-textColor: var(--color-text-2);
  --comboboxMenu-item-highlighted-textColor: var(--color-text-2);

  --stickyArea1-topHeight: ${({ $withSearch }) =>
    !$withSearch ? '0' : 'var(--form-input-height)'};

  input:focus-visible {
    outline: none;
  }

  border-radius: 0.5rem;
  max-height: 30vh;
  overflow: auto;
` as <MenuItemValue extends string | number, MenuGroupValue extends string | number>(
  props: React.ComponentProps<typeof ComboboxMenu<MenuItemValue, MenuGroupValue>> &
    ComboboxMenuStyleProps
) => JSX.Element;

const $TriggerIcon = styled(Icon)<{ open?: boolean }>`
  width: 0.625rem;
  height: 0.375rem;
  color: var(--color-text-0);

  ${({ open }) =>
    open &&
    css`
      transform: rotate(180deg);
    `}
`;
