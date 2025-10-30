import { css } from 'styled-components';

import { layoutMixins } from './layoutMixins';

/** Use as a direct child of tableMixins.cellContent */
const cellContentColumn = css`
  ${layoutMixins.rowColumn}
  gap: 0.125rem;

  color: var(--primary-content-color);

  > * {
    justify-content: var(--table-cell-currentAlign);
  }
`;

/** Use as a direct child of <th> or <td> */
const cellContent = css`
  ${layoutMixins.row}
  gap: 0.5em;

  --primary-content-color: var(--color-text-1);
  --secondary-content-color: var(--color-text-0);

  color: var(--primary-content-color);
  text-align: var(--table-cell-currentAlign);
  justify-content: var(--table-cell-currentAlign);
`;

export const tableMixins = {
  cellContent,
  cellContentColumn,

  cellContentColumnSecondary: css`
    ${() => cellContentColumn}
    gap: 0;

    > :nth-child(2) {
      font: var(--font-mini-book);
      color: var(--secondary-content-color);
      margin-top: 0.125rem;
    }
  `,

  /** Use as a direct child of <th> */
  headerCellContent: css`
    ${() => cellContent}
    gap: 0.25em;

    color: var(--tableStickyRow-textColor, var(--color-text-0));

    span:nth-child(2) {
      &:before {
        content: '| ';
      }
    }
  `,
} satisfies Record<string, ReturnType<typeof css>>;

/**
 * @description Default Table Styling
 */
export const defaultTableMixins = css`
  --tableCell-padding: 0.25rem;
  --tableStickyRow-backgroundColor: var(--color-layer-2);
  --tableRow-backgroundColor: var(--color-layer-2);
  font: var(--font-mini-book);

  thead,
  tbody {
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
  }

  tbody {
    font: var(--font-small-book);
  }

  tfoot {
    --tableCell-padding: 0.5rem 1rem 0.5rem 1rem;
  }
`;

/**
 * @description Card - Based Table Styling
 */

export const cardBasedTableMixins = css`
  --tableCell-padding: 0.25rem;
  --tableStickyRow-backgroundColor: var(--color-layer-3);
  --tableRow-backgroundColor: var(--color-layer-3);
  --table-header-height: 3.1875rem;
  --border-spacing: 0;

  // Override border color
  --color-border: var(--color-layer-2);

  th {
    font: var(--font-base-medium);
  }

  thead,
  tbody {
    tr {
      td:first-of-type,
      th:first-of-type {
        --tableCell-padding: 0.75rem 0.25rem 0.75rem 1rem;
      }
      td:last-of-type,
      th:last-of-type {
        --tableCell-padding: 0.75rem 1rem 0.75rem 0.25rem;
      }
    }
  }

  tbody {
    font: var(--font-small-book);
  }

  tfoot {
    --tableCell-padding: 0.75rem 1rem 0.75rem 1rem;
  }
`;
