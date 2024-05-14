import { forwardRef, type ElementType } from 'react';

import styled, { css } from 'styled-components';

import { ButtonShape, ButtonSize } from '@/constants/buttons';

import { Button, type ButtonProps } from '@/components/Button';
import { Icon, IconName } from '@/components/Icon';
import { ToggleButton, type ToggleButtonProps } from '@/components/ToggleButton';

type ElementProps = {
  isToggle?: boolean;
  iconName?: IconName;
  iconComponent?: ElementType;
};

export type IconButtonProps = ElementProps &
  Omit<ButtonProps, 'onClick'> &
  ToggleButtonProps & { onClick?(): void };

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
        onPressedChange={onPressedChange ?? onClick}
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
