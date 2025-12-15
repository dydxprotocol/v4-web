import { css } from 'styled-components';

export const headerMixins = {
  dropdownTrigger: css`
    --trigger-backgroundColor: transparent;
    --trigger-textColor: var(--color-text-2);

    --trigger-hover-backgroundColor: var(--color-layer-3);
    --trigger-hover-textColor: var(--color-text-2);

    --trigger-open-backgroundColor: transparent;
    --trigger-open-textColor: var(--color-text-2);

    &:hover:not(:disabled) {
      --trigger-textColor: var(--trigger-hover-textColor);
    }
  `,

  button: css`
    --button-backgroundColor: transparent;
    --button-textColor: var(--color-text-2);

    --button-hover-backgroundColor: var(--color-layer-4);
    --button-hover-textColor: var(--color-text-2);

    &:hover:not(:disabled) {
      color: var(--button-hover-textColor);
    }
  `,
};
