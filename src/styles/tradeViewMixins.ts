import {
  css,
  type FlattenInterpolation,
  type FlattenSimpleInterpolation,
  type ThemeProps,
} from 'styled-components';

export const tradeViewMixins: Record<
  string,
  FlattenSimpleInterpolation | FlattenInterpolation<ThemeProps<any>>
> = {
  horizontalTable: css`
    --tableCell-padding: 0.5rem 1rem;
    --tableHeader-backgroundColor: var(--color-layer-2);
    --tableRow-backgroundColor: var(--color-layer-2);
    font: var(--font-mini-book);

    tbody {
      font: var(--font-small-book);
    }
  `,
};
