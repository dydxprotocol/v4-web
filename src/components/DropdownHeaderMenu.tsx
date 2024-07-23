import { Content, Item, Portal, Root, Trigger } from '@radix-ui/react-dropdown-menu';
import styled from 'styled-components';

import { type MenuItem } from '@/constants/menus';

import { useBreakpoints } from '@/hooks/useBreakpoints';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';
import { popoverMixins } from '@/styles/popoverMixins';

import { IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';

type ElementProps<MenuItemValue extends string> = {
  items: MenuItem<MenuItemValue>[];
  onValueChange?: (value: MenuItemValue) => void;
  children?: React.ReactNode;
};

type StyleProps = {
  sideOffset?: number;
  className?: string;
};

export const DropdownHeaderMenu = <MenuItemValue extends string>({
  items,
  onValueChange,
  children,
  sideOffset = 8,
  className,
}: ElementProps<MenuItemValue> & StyleProps) => {
  const { isMobile } = useBreakpoints();

  return (
    <Root>
      <$Trigger className={className} asChild>
        <div>
          {children}
          <$DropdownIconButton iconName={IconName.Caret} isToggle />
        </div>
      </$Trigger>
      <Portal>
        <$Content
          align={isMobile ? 'center' : 'start'}
          sideOffset={sideOffset}
          loop
          className={className}
        >
          {items.map(({ value, label, description, onSelect, disabled }) => (
            <$Item
              key={value}
              textValue={value}
              onSelect={() => (onSelect ?? onValueChange)?.(value)}
              disabled={disabled}
            >
              <span tw="text-text-2 font-medium-book">{label}</span>
              <span tw="text-text-0 font-small-book">{description}</span>
            </$Item>
          ))}
        </$Content>
      </Portal>
    </Root>
  );
};
const $Trigger = styled(Trigger)`
  ${popoverMixins.trigger}
  ${popoverMixins.backdropOverlay}

  --trigger-padding: 0.33rem 0.5rem;
  --trigger-textColor: var(--color-text-2);
  --trigger-backgroundColor: none;
  --trigger-open-backgroundColor: none;
  --trigger-open-textColor: var(--color-text-2);

  &[data-state='open']:after {
    backdrop-filter: blur(6px);
    height: 100vh;
  }

  ${layoutMixins.row}

  width: 100%;
  font: var(--font-extra-medium);
  outline: none;

  :hover {
    filter: brightness(var(--hover-filter-base));
  }
`;

const $DropdownIconButton = styled(IconButton)`
  --button-textColor: var(--color-text-2);

  ${$Trigger}[data-state='open'] & {
    rotate: -0.5turn;
  }
`;

const $Content = styled(Content)`
  ${layoutMixins.withOuterAndInnerBorders}
  ${popoverMixins.popover}
  ${popoverMixins.popoverAnimation}

  --popover-shadow-size: var(--border-width);

  @media ${breakpoints.mobile} {
    --popover-width: calc(100vw - 3rem);
    --popover-margin: 0 1.5rem;
  }

  > * {
    background-color: inherit;
  }
`;

const $Item = styled(Item)`
  ${popoverMixins.item}

  --item-padding: 0.75rem 1rem;

  ${layoutMixins.column}
  gap: 0.5rem;
`;
