import { css } from 'styled-components';

export const headerMixins = {
  dropdownTrigger: css`
    --trigger-backgroundColor: transparent;
    --trigger-textColor: var(--color-text-0);

    --trigger-hover-backgroundColor: var(--color-layer-3);
    --trigger-hover-textColor: var(--color-text-2);

    --trigger-open-backgroundColor: var(--color-layer-1);
    --trigger-open-textColor: var(--color-text-2);

    &:hover:not(:disabled) {
      --trigger-backgroundColor: var(--trigger-hover-backgroundColor);
      --trigger-textColor: var(--trigger-hover-textColor);
    }
  `,

  button: css`
    --button-backgroundColor: transparent;
    --button-textColor: var(--color-text-0);

    --button-hover-backgroundColor: var(--color-layer-4);
    --button-hover-textColor: var(--color-text-2);

    &:hover:not(:disabled) {
      background-color: var(--button-hover-backgroundColor);
      color: var(--button-hover-textColor);
    }
  `,
};
