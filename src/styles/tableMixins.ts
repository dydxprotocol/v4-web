import {
  css,
  type FlattenInterpolation,
  type FlattenSimpleInterpolation,
  type ThemeProps,
} from 'styled-components';

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
      :before {
        content: '| ';
      }
    }
  `,
} satisfies Record<string, FlattenSimpleInterpolation | FlattenInterpolation<ThemeProps<any>>>;
