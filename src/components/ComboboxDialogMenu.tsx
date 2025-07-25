import React from 'react';

import styled, { css } from 'styled-components';

import { type MenuConfig } from '@/constants/menus';

import { useSimpleUiEnabled } from '@/hooks/useSimpleUiEnabled';

import breakpoints from '@/styles/breakpoints';

import { ComboboxMenu, type ComboboxMenuProps } from '@/components/ComboboxMenu';
import { Dialog, DialogPlacement, type DialogProps } from '@/components/Dialog';

type ElementProps<MenuItemValue extends string | number, MenuGroupValue extends string | number> = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  items: MenuConfig<MenuItemValue, MenuGroupValue>;
};

type StyleProps = {
  className?: string;
};

type PickComboxMenuProps<
  MenuItemValue extends string | number,
  MenuGroupValue extends string | number,
> = Pick<
  ComboboxMenuProps<MenuItemValue, MenuGroupValue>,
  | 'inputPlaceholder'
  | 'onItemSelected'
  | 'slotEmpty'
  | 'withItemBorders'
  | 'withSearch'
  | 'withStickyLayout'
>;

type PickDialogProps = Pick<
  DialogProps,
  | 'description'
  | 'isOpen'
  | 'placement'
  | 'setIsOpen'
  | 'slotHeaderInner'
  | 'slotTrigger'
  | 'slotFooter'
  | 'preventClose'
  | 'withOverlay'
>;

export const ComboboxDialogMenu = <
  MenuItemValue extends string | number,
  MenuGroupValue extends string | number,
>({
  isOpen = false,
  setIsOpen,
  title,
  description,
  slotTrigger,
  slotHeaderInner,
  slotFooter,
  withOverlay,

  items,
  onItemSelected,
  inputPlaceholder,
  slotEmpty,
  withItemBorders,
  withSearch = true,
  withStickyLayout = true,
  children,

  placement = DialogPlacement.Default,
  preventClose,
  className,
}: ElementProps<MenuItemValue, MenuGroupValue> &
  PickComboxMenuProps<MenuItemValue, MenuGroupValue> &
  PickDialogProps &
  StyleProps) => {
  const isSimpleUi = useSimpleUiEnabled();

  return (
    // TODO: sub-menu state management
    <$Dialog
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title={title}
      description={description}
      slotHeaderInner={slotHeaderInner}
      slotTrigger={slotTrigger}
      slotFooter={slotFooter}
      withOverlay={withOverlay}
      placement={placement}
      preventClose={preventClose}
      className={className}
      $withSearch={withSearch}
      $isSimpleUi={isSimpleUi}
    >
      <$ComboboxMenu
        items={items}
        onItemSelected={onItemSelected}
        title={title}
        inputPlaceholder={inputPlaceholder}
        slotEmpty={slotEmpty}
        withItemBorders={withItemBorders}
        withSearch={withSearch}
        withStickyLayout={withStickyLayout}
      />
      {children}
    </$Dialog>
  );
};
const $Dialog = styled(Dialog)<{ $withSearch?: boolean; $isSimpleUi?: boolean }>`
  /* Params */
  --comboboxDialogMenu-backgroundColor: var(--color-layer-2);
  --comboboxDialogMenu-item-gap: 0.5rem;
  --comboboxDialogMenu-item-padding: 0.5rem 1rem;

  @media ${breakpoints.tablet} {
    ${({ $isSimpleUi }) =>
      $isSimpleUi &&
      css`
        --comboboxDialogMenu-backgroundColor: var(--color-layer-1);
      `}
  }

  /* Overrides */
  & {
    --dialog-backgroundColor: var(--comboboxDialogMenu-backgroundColor);

    --dialog-paddingX: 1rem;

    ${({ $withSearch }) =>
      $withSearch &&
      css`
        --dialog-header-z: 0; /* allow input field to scroll on top of header */
        --dialog-header-paddingTop: 1rem;
        --dialog-header-height: 2.75rem;
        --dialog-header-paddingBottom: 0rem;
      `}

    --dialog-content-paddingLeft: 0rem;
    --dialog-content-paddingRight: 0rem;
    --dialog-content-paddingBottom: 0rem;

    /* Net 0 sticky top inset (let stickyArea1 header stick to top) */
    --stickyArea0-topGap: calc(-1 * var(--stickyArea0-topHeight));
    overflow-x: clip;
  }
`;

const $ComboboxMenu = styled(ComboboxMenu)`
  --comboboxMenu-backgroundColor: var(--comboboxDialogMenu-backgroundColor);
  --comboboxMenu-item-gap: var(--comboboxDialogMenu-item-gap);
  --comboboxMenu-item-padding: var(--comboboxDialogMenu-item-padding);
` as typeof ComboboxMenu;
