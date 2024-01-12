import { Key, useState } from 'react';
import styled, { type AnyStyledComponent, css } from 'styled-components';

import { STRING_KEYS } from '@/constants/localization';

import { useStringGetter } from '@/hooks';
import { CaretIcon } from '@/icons';

import { Button } from './Button';

import {
  Table,
  type ElementProps as TableElementProps,
  type StyleProps as TableStyleProps,
} from './Table';

type CollapsibleTableAdditionalProps = {
  initialNumRowsToShow: number;
};

type CollapsibleTableProps<
  TableRowData extends object,
  TableRowKey extends Key
> = TableElementProps<TableRowData, TableRowKey> &
  TableStyleProps &
  CollapsibleTableAdditionalProps;

export const CollapsibleTable = <TableRowData extends object, TableRowKey extends Key>({
  data = [],
  initialNumRowsToShow,

  className,
  ...tableProps
}: CollapsibleTableProps<TableRowData, TableRowKey>) => {
  const [numRowsToShow, setNumRowsToShow] = useState(initialNumRowsToShow);
  const stringGetter = useStringGetter();
  const showViewMoreButton = numRowsToShow !== undefined && numRowsToShow < data.length;

  return (
    <Styled.Container>
      <Styled.Table
        {...tableProps}
        data={data}
        numRowsToShow={numRowsToShow}
        showViewMoreButton={showViewMoreButton}
        className={className}
      />
      {showViewMoreButton && (
        <Styled.ViewMoreButton
          onClick={() => setNumRowsToShow(data.length)}
          slotRight={<CaretIcon />}
        >
          {stringGetter({ key: STRING_KEYS.VIEW_MORE })}
        </Styled.ViewMoreButton>
      )}
    </Styled.Container>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Container = styled.div`
  display: grid;
  grid-template-areas: 'table' 'viewmore';
  grid-template-rows: auto 1fr;
`;

Styled.Table = styled(Table)<{ showViewMoreButton?: boolean }>`
  grid-area: table;

  ${({ showViewMoreButton }) =>
    showViewMoreButton &&
    css`
      table tbody tr:last-of-type {
        box-shadow: 0 calc(-1 * var(--border-width)) 0 0 var(--border-color);
      }
    `}
`;

Styled.ViewMoreButton = styled(Button)`
  --button-backgroundColor: var(--color-layer-2);
  --button-textColor: var(--color-text-1);

  width: 100%;
  grid-area: viewmore;

  svg {
    width: 0.675rem;
    margin-left: 0.5ch;
  }
`;
