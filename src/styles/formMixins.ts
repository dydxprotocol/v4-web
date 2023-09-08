import {
  css,
  type FlattenInterpolation,
  type FlattenSimpleInterpolation,
  type ThemeProps,
} from 'styled-components';

import { layoutMixins } from './layoutMixins';
import breakpoints from './breakpoints';

export const formMixins: Record<
  string,
  FlattenSimpleInterpolation | FlattenInterpolation<ThemeProps<any>>
> = {
  inputsColumn: css`
    ${layoutMixins.flexColumn}
    gap: var(--form-input-gap);
  `,

  inputContainer: css`
    --input-radius: 0.5em;
    --input-height: var(--form-input-height);
    --input-width: 100%;
    --input-backgroundColor: var(--color-layer-4);
    --input-borderColor: var(--color-layer-6);

    ${layoutMixins.row}
    justify-content: space-between;
    width: var(--input-width);
    min-width: var(--input-width);
    flex: 1;

    height: var(--input-height);
    min-height: var(--input-height);

    background-color: var(--input-backgroundColor);
    border: var(--border-width) solid var(--input-borderColor);
    border-radius: var(--input-radius);

    &:focus-within {
      filter: brightness(1.1);
    }

    @media ${breakpoints.tablet} {
      --input-height: var(--form-input-height-mobile);
    }
  `,

  inputInnerButton: css`
    --button-textColor: var(--color-text-1);
    --button-backgroundColor: var(--color-layer-5);
    --button-border: var(--border-width) solid var(--color-layer-6);
  `,

  inputInnerToggleButton: css`
    ${() => formMixins.inputInnerButton}

    --button-toggle-off-backgroundColor: var(--color-layer-5);
    --button-toggle-off-textColor: var(--color-text-1);
    --button-toggle-on-backgroundColor: var(--color-layer-5);
    --button-toggle-on-textColor: var(--color-text-1);
  `,

  // TODO: replace with select menu design system
  inputSelectMenu: css`
    --trigger-textColor: var(--color-text-2);
    --trigger-backgroundColor: var(--color-layer-4);
    --trigger-open-backgroundColor: var(--color-layer-4);
    --trigger-border: solid var(--border-width) var(--color-layer-6);
    --trigger-padding: var(--form-input-paddingY) var(--form-input-paddingX);
    --trigger-height: var(--form-input-height);

    --popover-backgroundColor: var(--color-layer-5);
    --popover-border: var(--border-width) solid var(--color-layer-6);

    font: var(--font-base-book);

    @media ${breakpoints.tablet} {
      --trigger-height: var(--form-input-height-mobile);
    }
  `,

  inputSelectMenuItem: css`
    --item-checked-backgroundColor: var(--color-layer-4);
    --item-padding: 1rem var(--form-input-paddingX);
    font: var(--font-small-book);
  `,

  inputInnerSelectMenu: css`
    --trigger-textColor: var(--color-text-1);
    --trigger-backgroundColor: var(--color-layer-5);
    --trigger-open-backgroundColor: var(--color-layer-5);
    --trigger-border: solid var(--border-width) var(--color-layer-6);
    --trigger-padding: 0 0.33rem;
    --trigger-height: 1.875rem;

    --popover-backgroundColor: var(--color-layer-5);
    --popover-border: solid var(--border-width) var(--color-layer-6);

    font: var(--font-small-book);
  `,

  inputInnerSelectMenuItem: css`
    --item-checked-backgroundColor: var(--color-layer-4);

    font: var(--font-small-book);
  `,

  inputLabel: css`
    position: relative;
    height: 100%;
    width: 100%;
    gap: 0;

    border-radius: inherit;
  `,

  inputToggleGroup: css`
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    gap: 0.5rem;

    > * {
      flex: 1 1 0.625rem;
    }

    > button {
      --button-toggle-off-backgroundColor: var(--color-layer-4);
      --button-toggle-off-textColor: var(--color-text-1);
    }
  `,
};
