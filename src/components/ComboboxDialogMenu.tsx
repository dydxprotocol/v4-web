import React from 'react';
import styled, { AnyStyledComponent } from 'styled-components';

import { type MenuConfig } from '@/constants/menus';

import { Dialog, DialogPlacement } from '@/components/Dialog';
import { ComboboxMenu } from '@/components/ComboboxMenu';

type ElementProps<MenuItemValue extends string | number, MenuGroupValue extends string | number> = {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  slotTrigger?: React.ReactNode;
  slotHeaderInner?: React.ReactNode;
  slotFooter?: React.ReactNode;
  children?: React.ReactNode;

  items: MenuConfig<MenuItemValue, MenuGroupValue>;
  onItemSelected?: () => void;
  inputPlaceholder?: string;
  slotEmpty?: React.ReactNode;
};

type StyleProps = {
  placement: DialogPlacement,
  className?: string;
};

export const ComboboxDialogMenu = <MenuItemValue extends string | number, MenuGroupValue extends string | number>({
  isOpen = false,
  setIsOpen,
  title,
  description,
  slotTrigger,
  slotHeaderInner,
  slotFooter,

  items,
  onItemSelected,
  inputPlaceholder,
  slotEmpty,
  children,
  
  placement = DialogPlacement.Default,
  className,
}: ElementProps<MenuItemValue, MenuGroupValue> & StyleProps) => (
  // TODO: sub-menu state management
  <Styled.Dialog
    isOpen={isOpen}
    setIsOpen={setIsOpen}
    title={title}
    description={description}
    slotHeaderInner={slotHeaderInner}
    slotTrigger={slotTrigger}
    slotFooter={slotFooter}

    placement={placement}
    className={className}
  >
    <Styled.ComboboxMenu
      items={items}
      onItemSelected={onItemSelected}
      title={title}
      inputPlaceholder={inputPlaceholder}
      slotEmpty={slotEmpty}
      withStickyLayout
    />
    {children}
  </Styled.Dialog>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Dialog = styled(Dialog)`
  /* Params */
  --comboboxDialogMenu-backgroundColor: var(--color-layer-2);

  /* Overrides */
  & {
    --dialog-backgroundColor: var(--comboboxDialogMenu-backgroundColor);

    --dialog-paddingX: 1rem;

    --dialog-header-z: 0; /* allow input field to scroll on top of header */
    --dialog-header-paddingTop: 1rem;
    --dialog-header-height: 2.75rem;
    --dialog-header-paddingBottom: 0rem;

    --dialog-content-paddingLeft: 0rem;
    --dialog-content-paddingRight: 0rem;
    --dialog-content-paddingBottom: 0rem;

    /* Net 0 sticky top inset (let stickyArea1 header stick to top) */
    --stickyArea0-topGap: calc(-1 * var(--stickyArea0-topHeight));
  }
`;

Styled.ComboboxMenu = styled(ComboboxMenu)`
  --comboboxMenu-backgroundColor: var(--comboboxDialogMenu-backgroundColor);
`;
