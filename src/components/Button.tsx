import { forwardRef } from 'react';

import styled, {
  css,
  type FlattenInterpolation,
  type FlattenSimpleInterpolation,
  type ThemeProps,
} from 'styled-components';

import { ButtonAction, ButtonShape, ButtonSize, ButtonState } from '@/constants/buttons';

import { LoadingDots } from '@/components/Loading/LoadingDots';

import { BaseButton, BaseButtonProps } from './BaseButton';

export type ButtonStateConfig = {
  isDisabled?: boolean;
  isLoading?: boolean;
};

type ElementProps = {
  children?: React.ReactNode;
  // eslint-disable-next-line react/no-unused-prop-types
  href?: string;
  // eslint-disable-next-line react/no-unused-prop-types
  onClick?: React.MouseEventHandler<HTMLButtonElement> | React.MouseEventHandler<HTMLAnchorElement>;
  slotLeft?: React.ReactNode;
  slotRight?: React.ReactNode;
  state?: ButtonState | ButtonStateConfig;
};

type StyleProps = {
  action?: ButtonAction;
  state: Record<string, boolean | undefined>;
  className?: string;
};

export type ButtonProps = BaseButtonProps & ElementProps & Omit<StyleProps, keyof ElementProps>;

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      action = ButtonAction.Secondary,
      size = ButtonSize.Base,
      shape = ButtonShape.Rectangle,
      state: stateConfig = ButtonState.Default,

      children,
      slotLeft = null,
      slotRight = null,

      ...otherProps
    },
    ref
  ) => {
    const state: Record<string, boolean | undefined> =
      typeof stateConfig === 'string'
        ? { [stateConfig as ButtonState]: true }
        : {
            [ButtonState.Loading]: stateConfig.isLoading,
            [ButtonState.Disabled]: stateConfig.isDisabled,
          };

    return (
      <StyledBaseButton
        disabled={!!state[ButtonState.Disabled] || !!state[ButtonState.Loading]}
        {...{ ref, action, size, shape, state, ...otherProps }}
      >
        {state[ButtonState.Loading] ? (
          <LoadingDots size={3} />
        ) : (
          <>
            {slotLeft}
            {children}
            {slotRight}
          </>
        )}
      </StyledBaseButton>
    );
  }
);

const buttonActionVariants = {
  [ButtonAction.Base]: css`
    --button-textColor: var(--color-text-1);
    --button-backgroundColor: var(--color-layer-5);
    --button-border: solid var(--border-width) var(--color-border);
  `,
  [ButtonAction.Primary]: css`
    --button-textColor: var(--color-text-button);
    --button-backgroundColor: var(--color-accent);
    --button-border: solid var(--border-width) var(--color-border-white);
    --button-hover-filter: brightness(var(--hover-filter-variant));
  `,

  [ButtonAction.Secondary]: css`
    --button-textColor: var(--color-text-1);
    --button-backgroundColor: var(--color-layer-3);
    --button-border: solid var(--border-width) var(--color-border);
  `,

  [ButtonAction.Create]: css`
    --button-textColor: var(--color-text-button);
    --button-backgroundColor: var(--color-green);
    --button-border: solid var(--border-width) var(--color-border-white);
    --button-hover-filter: brightness(var(--hover-filter-variant));
  `,

  [ButtonAction.Destroy]: css`
    --button-textColor: var(--color-text-button);
    --button-backgroundColor: var(--color-red);
    --button-border: solid var(--border-width) var(--color-border-white);
    --button-hover-filter: brightness(var(--hover-filter-variant));
  `,

  [ButtonAction.Navigation]: css`
    --button-textColor: var(--color-text-1);
    --button-backgroundColor: transparent;
    --button-border: none;
  `,

  [ButtonAction.Reset]: css`
    --button-textColor: var(--color-red);
    --button-backgroundColor: var(--color-layer-3);
    --button-border: solid var(--border-width) var(--color-border-red);
    --button-hover-filter: brightness(var(--hover-filter-variant));
  `,
};

const getDisabledStateForButtonAction = (action?: ButtonAction) => {
  switch (action) {
    case ButtonAction.Navigation:
      return css`
        --button-textColor: var(--color-text-0);
        --button-hover-filter: none;
        --button-cursor: not-allowed;
      `;
    default:
      return css`
        --button-textColor: var(--color-text-0);
        --button-backgroundColor: var(--color-layer-2);
        --button-border: solid var(--border-width) var(--color-layer-6);
        --button-hover-filter: none;
        --button-cursor: not-allowed;
      `;
  }
};

const buttonStateVariants = (
  action?: ButtonAction
): Record<ButtonState, FlattenSimpleInterpolation | FlattenInterpolation<ThemeProps<any>>> => ({
  [ButtonState.Default]: css``,

  [ButtonState.Disabled]: getDisabledStateForButtonAction(action),

  [ButtonState.Loading]: css`
    ${() => buttonStateVariants(action)[ButtonState.Disabled]}
    min-width: 4em;
  `,
});

const StyledBaseButton = styled(BaseButton)<StyleProps>`
  ${({ action }) => action && buttonActionVariants[action]}

  ${({ action, state }) =>
    state &&
    css`
      // Ordered from lowest to highest priority (ie. Disabled should overwrite Active and Loading states)
      ${state[ButtonState.Loading] && buttonStateVariants(action)[ButtonState.Loading]}
      ${state[ButtonState.Disabled] && buttonStateVariants(action)[ButtonState.Disabled]}
    `}
`;
