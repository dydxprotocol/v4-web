import styled, { type AnyStyledComponent } from 'styled-components';
import { Root, Trigger, Content, Portal, Item } from '@radix-ui/react-dropdown-menu';

import { type MenuItem } from '@/constants/menus';

import { popoverMixins } from '@/styles/popoverMixins';
import { layoutMixins } from '@/styles/layoutMixins';
import { breakpoints } from '@/styles';
import { useBreakpoints } from '@/hooks';

import { IconButton } from '@/components/IconButton';
import { IconName } from '@/components/Icon';

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
      <Styled.Trigger className={className}>
        {children}
        <Styled.DropdownIconButton iconName={IconName.Caret} isToggle />
      </Styled.Trigger>
      <Portal>
        <Styled.Content
          align={isMobile ? 'center' : 'start'}
          sideOffset={sideOffset}
          loop
          className={className}
        >
          {items.map(({ value, label, description, onSelect, disabled }) => (
            <Styled.Item
              key={value}
              value={value}
              onSelect={() => (onSelect ?? onValueChange)?.(value)}
              disabled={disabled}
            >
              <Styled.ItemLabel>{label}</Styled.ItemLabel>
              <Styled.Description>{description}</Styled.Description>
            </Styled.Item>
          ))}
        </Styled.Content>
      </Portal>
    </Root>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Trigger = styled(Trigger)`
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
    filter: brightness(1.1);
  }
`;

Styled.DropdownIconButton = styled(IconButton)`
  --button-textColor: var(--color-text-2);

  ${Styled.Trigger}[data-state='open'] & {
    rotate: -0.5turn;
  }
`;

Styled.Content = styled(Content)`
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

Styled.Item = styled(Item)`
  ${popoverMixins.item}

  --item-padding: 0.75rem 1rem;

  ${layoutMixins.column}
  gap: 0.5rem;
`;

Styled.ItemLabel = styled.span`
  color: var(--color-text-2);
  font: var(--font-medium-book);
`;

Styled.Description = styled.span`
  color: var(--color-text-0);
  font: var(--font-small-book);
`;
