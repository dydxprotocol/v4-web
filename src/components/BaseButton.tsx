import { forwardRef } from 'react';

import styled, { css } from 'styled-components';

import { ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';

type ElementProps = {
  disabled?: boolean;
  type?: ButtonType;
  children?: React.ReactNode;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement> | React.MouseEventHandler<HTMLAnchorElement>;
};

type StyleProps = {
  size?: ButtonSize;
  shape?: ButtonShape;
  className?: string;
};

export type BaseButtonProps = ElementProps & Omit<StyleProps, keyof ElementProps>;

export const BaseButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, BaseButtonProps>(
  (
    {
      disabled,
      type = ButtonType.Button,
      size,
      shape,

      href,

      onClick,

      children,
      className,

      ...otherProps
    },
    ref
  ) => {
    return type === ButtonType.Link ? (
      <StyledLinkButton
        // React
        ref={ref as React.ForwardedRef<HTMLAnchorElement>}
        // Native
        href={href}
        rel={href ? 'noopener noreferrer' : undefined}
        target={href ? '_blank' : undefined}
        // Style
        size={size}
        shape={shape}
        className={className}
        // Events
        onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}
        // Other
        {...otherProps}
      >
        {children}
      </StyledLinkButton>
    ) : (
      <StyledButton
        // React
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        // Native
        type={type}
        disabled={disabled}
        // Style
        size={size}
        shape={shape}
        className={className}
        // Events
        onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
        // Other
        {...otherProps}
      >
        {children}
      </StyledButton>
    );
  }
);

const buttonSizeVariants = {
  [ButtonSize.XSmall]: css`
    --button-font: var(--font-mini-book);
    --button-height: 1.75rem;
  `,
  [ButtonSize.Small]: css`
    --button-font: var(--font-small-book);
    --button-height: 2.25rem;
  `,
  [ButtonSize.Base]: css`
    --button-font: var(--font-base-book);
    --button-height: 2.75rem;
  `,
  [ButtonSize.Medium]: css`
    --button-font: var(--font-medium-medium);
    --button-height: 3.25rem;
  `,
  [ButtonSize.Large]: css`
    --button-font: var(--font-large-book);
    --button-height: 3.5rem;
  `,
  [ButtonSize.XLarge]: css`
    --button-font: var(--font-large-medium);
    --button-height: 3.75rem;
  `,
};

const buttonShapeVariants = {
  [ButtonShape.Circle]: css`
    --button-width: var(--button-height);
    --button-radius: 50%;
  `,
  [ButtonShape.Rectangle]: css`
    --button-radius: 0.5em;
  `,
  [ButtonShape.Square]: css`
    --button-width: var(--button-height);
    --button-radius: 0.5em;
  `,
  [ButtonShape.Pill]: css`
    --button-radius: 6em;
  `,
};

const ButtonStyle = css<StyleProps>`
  // Props/defaults

  --button-font: var(--font-base-book);

  --button-width: auto;
  --button-height: 2.75rem;
  --button-padding: 0 0.625em;

  --button-textColor: var(--color-text-0);
  --button-backgroundColor: transparent;
  --button-active-filter: brightness(var(--active-filter));
  --button-hover-filter: brightness(var(--hover-filter-base));
  --button-hover-textColor: var(--button-textColor);

  --button-radius: 0.5em;
  --button-border: solid var(--border-width) var(--color-layer-6);

  --button-cursor: pointer;

  // Variants

  ${({ size }) => size && buttonSizeVariants[size]}
  ${({ shape }) => shape && buttonShapeVariants[shape]}

  // Rules

  font: var(--button-font);

  display: inline-flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: var(--button-width);
  height: var(--button-height);
  padding: var(--button-padding);
  gap: 0.5ch;

  background-color: var(--button-backgroundColor);
  border: var(--button-border);
  border-radius: var(--button-radius);

  color: var(--button-textColor);
  text-align: center;
  white-space: nowrap;

  cursor: var(--button-cursor);

  &:hover:not(:disabled) {
    color: var(--button-hover-textColor);
    filter: var(--button-hover-filter);
  }

  &:active:not(:disabled) {
    filter: var(--button-active-filter);
  }
`;

const StyledButton = styled.button<StyleProps>`
  ${ButtonStyle}
`;

const StyledLinkButton = styled.a<StyleProps>`
  ${ButtonStyle}

  &:hover {
    text-decoration: none;
  }

  &:visited {
    color: var(--button-textColor);
  }
`;
