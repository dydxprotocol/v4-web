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
    --tableCell-padding: 0.5rem 0.25rem;
    --tableStickyRow-backgroundColor: var(--color-layer-2);
    --tableRow-backgroundColor: var(--color-layer-2);
    font: var(--font-mini-book);

    tr {
      td:first-of-type,
      th:first-of-type {
        --tableCell-padding: 0.5rem 0.25rem 0.5rem 1rem;
      }
      td:last-of-type,
      th:last-of-type {
        --tableCell-padding: 0.5rem 1rem 0.5rem 0.25rem;
      }
    }

    tr:last-of-type {
      td {
        // Padding for the last row, which is the pagination row (a single cell)
        --tableCell-padding: 0.5rem 1rem 0.5rem 1rem;
      }
    }

    tbody {
      font: var(--font-small-book);
    }
  `,
};
