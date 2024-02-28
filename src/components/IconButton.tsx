import { forwardRef, type ElementType } from 'react';

import styled, { css } from 'styled-components';

import { ButtonAction, ButtonShape, ButtonSize, ButtonState } from '@/constants/buttons';

import { Button, ButtonStateConfig } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { ToggleButton, type ToggleButtonProps } from '@/components/ToggleButton';

type ElementProps = {
  isToggle?: boolean;
  iconName?: IconName;
  iconComponent?: ElementType;
  action?: ButtonAction;
  state?: ButtonState | ButtonStateConfig;
};

export type IconButtonProps = ElementProps & ToggleButtonProps;

export const IconButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, IconButtonProps>(
  (
    {
      size = ButtonSize.XSmall,
      shape = ButtonShape.Circle,

      href,
      isToggle,
      iconName,
      iconComponent,

      onClick,
      onPressedChange,
      className,

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
        {...otherProps}
      >
        <Icon iconName={iconName} iconComponent={iconComponent} />
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

const $IconButton = styled(Button)`
  ${buttonMixin}
`;

const $IconToggleButton = styled(ToggleButton)`
  ${buttonMixin}
`;
