import { forwardRef } from 'react';
import styled, { type AnyStyledComponent } from 'styled-components';
import { Root } from '@radix-ui/react-toggle';

import { BaseButton, type BaseButtonProps } from '@/components/BaseButton';

type ElementProps = {
  isPressed?: boolean;
  onPressedChange?: (isPressed: boolean) => void;
  disabled?: boolean;
  slotLeft?: React.ReactNode;
  slotRight?: React.ReactNode;
  children?: React.ReactNode;
};

type StyleProps = {
  className?: string;
};

export type ToggleButtonProps = BaseButtonProps &
  ElementProps &
  Omit<StyleProps, keyof ElementProps>;

export const ToggleButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, ToggleButtonProps>(
  (
    {
      isPressed,
      onPressedChange,
      disabled,
      slotLeft = null,
      slotRight = null,
      children,
      className,
      ...buttonProps
    },
    ref
  ) => {
    return (
      <Root pressed={isPressed} onPressedChange={onPressedChange} className={className} asChild>
        <Styled.BaseButton ref={ref} disabled={disabled} {...buttonProps}>
          {slotLeft}
          {children}
          {slotRight}
        </Styled.BaseButton>
      </Root>
    );
  }
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.BaseButton = styled(BaseButton)`
  --button-toggle-off-backgroundColor: var(--color-layer-3);
  --button-toggle-off-textColor: var(--color-text-0);
  --button-toggle-off-borderColor: var(--border-color);
  --button-toggle-on-backgroundColor: var(--color-layer-1);
  --button-toggle-on-textColor: var(--color-text-2);
  --button-toggle-on-borderColor: var(--border-color);

  --button-backgroundColor: var(--button-toggle-off-backgroundColor);
  --button-textColor: var(--button-toggle-off-textColor);
  --button-border: solid var(--border-width) var(--button-toggle-off-borderColor);

  &[data-state='on'],
  &[data-state='active'] {
    --button-backgroundColor: var(--button-toggle-on-backgroundColor);
    --button-textColor: var(--button-toggle-on-textColor);
    --button-border: solid var(--border-width) var(--button-toggle-on-borderColor);
  }
`;
