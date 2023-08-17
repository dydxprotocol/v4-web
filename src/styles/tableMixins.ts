import {
  css,
  type FlattenInterpolation,
  type FlattenSimpleInterpolation,
  type ThemeProps,
} from 'styled-components';

import breakpoints from './breakpoints';
import { layoutMixins } from './layoutMixins';

export const tableMixins: Record<
  string,
  FlattenSimpleInterpolation | FlattenInterpolation<ThemeProps<any>>
> = {
  /** Use as a direct child of <th> or <td> */
  cellContent: css`
    ${layoutMixins.row}
    gap: 0.5em;

    color: var(--color-text-1);
    text-align: var(--table-cell-currentAlign);
    justify-content: var(--table-cell-currentAlign);
  `,

  /** Use as a direct child of tableMixins.cellContent */
  cellContentColumn: css`
    ${layoutMixins.rowColumn}

    color: var(--color-text-1);

    > * {
      justify-content: var(--table-cell-currentAlign);
    }

    > :nth-child(2) {
      font: var(--font-mini-book);
      color: var(--color-text-0);
      margin-top: 0.125rem;
    }
  `,

  /** Use as a direct child of <th> */
  headerCellContent: css`
    ${() => tableMixins.cellContent}

    color: var(--tableHeader-textColor, var(--color-text-0));

    span:nth-child(2) {
      :before {
        content: ' / ';
      }
    }
  `,
};
