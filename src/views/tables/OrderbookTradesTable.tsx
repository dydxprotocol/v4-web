import styled, { css, keyframes } from 'styled-components';

import breakpoints from '@/styles/breakpoints';

import { Output } from '@/components/Output';
import { Table, BaseTableRowData, AllTableProps } from '@/components/Table';

import { getSimpleStyledOutputType } from '@/lib/genericFunctionalComponentUtils';

type OrderbookTradesTableStyleProps = { histogramSide?: 'left' | 'right' };
const orderbookTradesTableType = getSimpleStyledOutputType(
  Table,
  {} as OrderbookTradesTableStyleProps
);

export const OrderbookTradesTable = <TableRowData extends BaseTableRowData>(
  props: AllTableProps<TableRowData>
) => <$OrderbookTradesTable {...props} paginationBehavior="showAll" />;

const $OrderbookTradesTable = styled(Table)<OrderbookTradesTableStyleProps>`
  // Params
  --histogram-width: 100%;

  // Computed
  --histogram-side: 1;

  ${({ histogramSide }) =>
    histogramSide === 'left'
      ? css`
          --histogram-side: 1;
        `
      : css`
          --histogram-side: -1;
        `}

  --histogram-gradient-to: ${({ histogramSide }) => histogramSide};

  // Overrides
  --stickyArea1-background: var(--color-layer-2);

  --table-header-height: 1.75rem;

  @media ${breakpoints.notTablet} {
    --table-cell-align: end;
    --table-firstColumn-cell-align: end;
    --table-lastColumn-cell-align: end;
  }

  // Rules
  text-align: right;

  transform-style: flat;

  thead {
    font: var(--font-mini-book);
  }

  tbody tr {
    --histogram-bucket-size: 1;

    isolation: isolate;
    contain: strict;

    position: relative;

    &[data-side='1'] {
      --accent-color: var(--color-positive);
    }
    &[data-side='2'] {
      --accent-color: var(--color-negative);
    }

    transition: outline var(--ease-out-expo) 0.2s, background-color 0.2s;
  }

  td {
    transition: outline 0.2s;
    height: 1.25rem;
    font: var(--font-mini-book);

    @media ${breakpoints.tablet} {
      height: 1rem;
    }
  }

  tbody tr:hover,
  tr:focus-visible,
  td:focus-visible {
    color: var(--color-text-2);
    background-color: var(--color-layer-3);
  }

  /*
    Safari:
    "position: relative;" doesn't apply to <tr> ;-;
    Workaround: make <td> ("Size" column) the "position: relative" container instead
    and scale bar widths back up by dividing by approximate column/table ratio
  */
  @supports (background: -webkit-named-image(i)) {
    td {
      position: relative;
      --approximate-column-width: 0.39;
      --histogram-width: calc(100% / var(--approximate-column-width));
    }
  }
` as typeof orderbookTradesTableType;

const colorAnimation = keyframes`
20% {
  color: var(--accent-color);
}
`;

export const OrderbookTradesOutput = styled(Output)<{ highlightText?: boolean }>`
  color: var(--color-text-1);

  ${({ highlightText }) =>
    highlightText &&
    css`
      @media (prefers-reduced-motion: no-preference) {
        transition: outline 0.2s, color var(--ease-out-expo) 0.3s;

        animation: ${colorAnimation} 0.5s;
      }
    `}

  &:empty {
    &:before,
    &:after {
      content: '';
    }

    opacity: 1;
  }
`;
