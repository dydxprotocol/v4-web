import { forwardRef } from 'react';

import styled, { css, RuleSet } from 'styled-components';

import { ButtonShape, ButtonSize, ButtonType } from '@/constants/buttons';

import { useSimpleUiEnabled } from '@/hooks/useSimpleUiEnabled';

import breakpoints from '@/styles/breakpoints';

type ElementProps = {
  disabled?: boolean;
  type?: ButtonType;
  children?: React.ReactNode;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement> | React.MouseEventHandler<HTMLAnchorElement>;
  onMouseDown?:
    | React.MouseEventHandler<HTMLButtonElement>
    | React.MouseEventHandler<HTMLAnchorElement>;
  onPointerDown?:
    | React.PointerEventHandler<HTMLButtonElement>
    | React.PointerEventHandler<HTMLAnchorElement>;
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
      onMouseDown,
      onPointerDown,

      children,
      className,

      ...otherProps
    },
    ref
  ) => {
    const isSimpleUi = useSimpleUiEnabled();

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
        onMouseDown={onMouseDown as React.MouseEventHandler<HTMLAnchorElement>}
        onPointerDown={onPointerDown as React.PointerEventHandler<HTMLAnchorElement>}
        // Other
        $isSimpleUi={isSimpleUi}
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
        onMouseDown={onMouseDown as React.MouseEventHandler<HTMLButtonElement>}
        onPointerDown={onPointerDown as React.PointerEventHandler<HTMLButtonElement>}
        // Other
        $isSimpleUi={isSimpleUi}
        {...otherProps}
      >
        {children}
      </StyledButton>
    );
  }
);

const buttonSizeVariants = {
  [ButtonSize.XXSmall]: css`
    --button-font: var(--font-tiny-book);
    --button-height: 1.25rem;
  `,
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
  [ButtonSize.BasePlus]: css`
    --button-font: var(--font-base-book);
    --button-height: 3rem;
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

const buttonShapeVariants: Record<ButtonShape, RuleSet<StyleProps & { $isSimpleUi?: boolean }>> = {
  [ButtonShape.Circle]: css`
    --button-width: var(--button-height);
    min-width: var(--button-width);
    --button-radius: 50%;
  `,
  [ButtonShape.Rectangle]: css<StyleProps & { $isSimpleUi?: boolean }>`
    --button-radius: 0.5em;

    @media ${breakpoints.tablet} {
      ${({ $isSimpleUi, size }) => {
        if ($isSimpleUi) {
          switch (size) {
            case ButtonSize.XXSmall:
            case ButtonSize.XSmall:
            case ButtonSize.Small:
              return css`
                --button-radius: 0.75rem;
              `;
            default: {
              return css`
                --button-radius: 1rem;
              `;
            }
          }
        }

        return '';
      }}
    }
  `,
  [ButtonShape.Square]: css`
    --button-width: var(--button-height);
    --button-radius: 0.5em;
  `,
  [ButtonShape.Pill]: css`
    --button-radius: 6em;
  `,
};

const ButtonStyle = css<StyleProps & { $isSimpleUi?: boolean }>`
  // Props/defaults

  --button-font: var(--font-base-book);

  --button-width: auto;
  --button-height: 2.75rem;
  --button-padding: 0 0.625rem;

  --button-textColor: var(--color-text-0);
  --button-backgroundColor: transparent;
  --button-active-filter: brightness(var(--active-filter));
  --button-hover-filter: brightness(var(--hover-filter-base));
  --button-hover-textColor: var(--button-textColor);

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
  border-radius: var(--button-radius, 0.5em);

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

  @media ${breakpoints.tablet} {
    ${({ $isSimpleUi }) =>
      $isSimpleUi &&
      css`
        &:active:not(:disabled) {
          background: linear-gradient(0deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.1) 100%),
            var(--button-backgroundColor);
        }
      `}
  }
`;

const StyledButton = styled.button<StyleProps & { $isSimpleUi?: boolean }>`
  ${ButtonStyle}
`;

const StyledLinkButton = styled.a<StyleProps & { $isSimpleUi?: boolean }>`
  ${ButtonStyle}

  &:hover {
    text-decoration: none;
  }

  &:visited {
    color: var(--button-textColor);
  }
`;
