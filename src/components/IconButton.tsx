import { forwardRef, type ElementType } from 'react';

import styled, { css } from 'styled-components';

import { ButtonAction, ButtonShape, ButtonSize, ButtonState } from '@/constants/buttons';

import { Button, ButtonStateConfig } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { ToggleButton, type ToggleButtonProps } from '@/components/ToggleButton';

type ElementProps = {
  isToggle?: boolean;
  iconName?: IconName;
  iconSize?: string;
  iconComponent?: ElementType;
  action?: ButtonAction;
  state?: ButtonState | ButtonStateConfig;
};

type StyleProps = {
  withoutBackground?: boolean;
};

export type IconButtonProps = ElementProps & ToggleButtonProps & StyleProps;

export const IconButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, IconButtonProps>(
  (
    {
      size = ButtonSize.XSmall,
      shape = ButtonShape.Circle,

      href,
      isToggle,
      iconName,
      iconSize,
      iconComponent,

      onClick,
      onPressedChange,
      className,
      withoutBackground = false,

      ...otherProps
    },
    ref
  ) => {
    return isToggle ? (
      <$IconToggleButton
        ref={ref}
        className={className}
        size={size}
        shape={shape}
        href={href}
        onPressedChange={onPressedChange ?? (onClick as any)} // TODO fix types
        $withoutBackground={withoutBackground}
        {...otherProps}
      >
        <Icon iconName={iconName} iconComponent={iconComponent} />
      </$IconToggleButton>
    ) : (
      <$IconButton
        ref={ref}
        className={className}
        size={size}
        shape={shape}
        href={href}
        onClick={onClick}
        $withoutBackground={withoutBackground}
        {...otherProps}
      >
        <Icon iconName={iconName} iconComponent={iconComponent} size={iconSize} />
      </$IconButton>
    );
  }
);
const buttonMixin = css`
  // Params
  --button-icon-size: 1.125em;
  --button-padding: 0;

  // Rules
  > * {
    font-size: var(--button-icon-size);
  }
`;

const withoutBackgroundMixin = css`
  --button-icon-size: 1.5em;
  --button-border: none;
  --button-backgroundColor: transparent;
`;

const $IconButton = styled(Button)<{ $withoutBackground?: boolean }>`
  ${buttonMixin}

  ${({ $withoutBackground }) => $withoutBackground && withoutBackgroundMixin}
`;

const $IconToggleButton = styled(ToggleButton)<{ $withoutBackground?: boolean }>`
  ${buttonMixin}

  ${({ $withoutBackground }) => $withoutBackground && withoutBackgroundMixin}
`;
