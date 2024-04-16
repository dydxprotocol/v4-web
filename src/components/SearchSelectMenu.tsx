import { type ReactNode, useState, useRef } from 'react';

import styled, { type AnyStyledComponent, css } from 'styled-components';

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

import cctpTokens from '../../public/configs/cctp.json';

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

type TokenInfo = {
  chainId: string;
  tokenAddress: string;
  name: string;
};

export const SearchSelectMenu = ({
  asChild,
  children,
  className,
  disabled,
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

  const cctpChainsById = cctpTokens.reduce((acc, token) => {
    // Check if the key for this chainId already exists
    if (!acc[token.chainId]) {
      acc[token.chainId] = []; // Initialize it with an empty array if not existing
    }
    acc[token.chainId].push(token); // Push the current token into the corresponding array
    return acc;
  }, {} as Record<string, TokenInfo[]>);

  const Trigger = asChild ? (
    children
  ) : (
    <Styled.MenuTrigger>
      {label ? <Styled.WithLabel label={label}>{children}</Styled.WithLabel> : children}
      <Styled.TriggerIcon iconName={IconName.Triangle} open={open} />
    </Styled.MenuTrigger>
  );

  return (
    <Styled.SearchSelectMenu className={className} ref={searchSelectMenuRef}>
      <Styled.WithDetailsReceipt detailItems={withReceiptItems} side="bottom">
        <Styled.Popover
          open={open}
          onOpenChange={setOpen}
          slotTrigger={Trigger}
          triggerType={TriggerType.SearchSelect}
          fullWidth
          noBlur
        >
          <Styled.ComboboxMenu
            items={items}
            withSearch={withSearch}
            onItemSelected={() => setOpen(false)}
            withStickyLayout
            $withSearch={withSearch}
          />
        </Styled.Popover>
      </Styled.WithDetailsReceipt>
    </Styled.SearchSelectMenu>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.SearchSelectMenu = styled.div`
  ${layoutMixins.column}
`;

Styled.MenuTrigger = styled.div`
  height: var(--form-input-height);

  ${layoutMixins.spacedRow}
  align-items: center;
  padding: var(--form-input-paddingY) var(--form-input-paddingX);

  @media ${breakpoints.tablet} {
    height: var(--form-input-height-mobile);
  }
`;

Styled.WithLabel = styled(WithLabel)`
  ${formMixins.inputLabel}

  label {
    font: var(--font-mini-book);
  }
`;

Styled.WithDetailsReceipt = styled(WithDetailsReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);

  abbr {
    background-color: var(--withReceipt-backgroundColor);
  }
`;

Styled.Popover = styled(Popover)`
  max-height: 30vh;
  margin-top: 1rem;
  border: var(--border-width) solid var(--color-layer-6);
  border-radius: 0.5rem;
  z-index: 2;
  box-shadow: none;
`;

Styled.ComboboxMenu = styled(ComboboxMenu)<{ $withSearch?: boolean }>`
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
`;

Styled.TriggerIcon = styled(Icon)<{ open?: boolean }>`
  width: 0.625rem;
  height: 0.375rem;
  color: var(--color-text-0);

  ${({ open }) =>
    open &&
    css`
      transform: rotate(180deg);
    `}
`;
