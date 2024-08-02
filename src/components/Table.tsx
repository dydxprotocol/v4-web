import React, { Key, useCallback, useEffect, useState } from 'react';

import {
  Cell, // CollectionBuilderContext,
  Column,
  Row,
  TableBody,
  TableHeader,
  TableStateProps,
  useTableState,
  type TableState,
} from '@react-stately/table';
import { type GridNode } from '@react-types/grid';
import type { Node, SortDescriptor, SortDirection } from '@react-types/shared';
import { type ColumnSize, type TableCollection } from '@react-types/table';
import { isFunction } from 'lodash';
import {
  mergeProps,
  useCollator,
  useFocusRing,
  useTable,
  useTableCell,
  useTableColumnHeader,
  useTableHeaderRow,
  useTableRow,
  useTableRowGroup,
} from 'react-aria';
import { useAsyncList } from 'react-stately';
import styled, { css } from 'styled-components';

import { MediaQueryKeys, useBreakpoints } from '@/hooks/useBreakpoints';
import { useTablePagination } from '@/hooks/useTablePagination';

import breakpoints from '@/styles/breakpoints';
import { layoutMixins } from '@/styles/layoutMixins';

import { MustBigNumber } from '@/lib/numbers';

import { Icon, IconName } from './Icon';
import { PAGE_SIZES, PageSize, TablePaginationRow } from './Table/TablePaginationRow';
import { Tag } from './Tag';

export type CustomRowConfig = {
  key: string;
  slotCustomRow: (..._: Parameters<typeof TableRow>) => React.ReactNode;
};

function isCustomRow<TableRowData extends object>(
  v: TableRowData | CustomRowConfig
): v is CustomRowConfig {
  return (v as any).slotCustomRow != null && isFunction((v as any).slotCustomRow);
}

function isTableRowData<TableRowData extends object>(
  v: TableRowData | CustomRowConfig
): v is TableRowData {
  return !isCustomRow(v);
}

export type TableItem<TableRowData> = {
  value: TableRowData;

  slotBefore?: () => React.ReactNode;
  label: string;
  tag?: React.ReactNode;
  slotAfter?: () => React.ReactNode;

  onSelect?: (key: TableRowData) => void;
};

export type BaseTableRowData = {};

type SortableColumnDef<TableRowData extends BaseTableRowData | CustomRowConfig> = {
  allowsSorting?: true;
  getCellValue: (row: TableRowData) => string | number | undefined | null;
};

type NonSortableColumnDef = {
  allowsSorting: false;
};

export type ColumnDef<TableRowData extends BaseTableRowData | CustomRowConfig> = {
  columnKey: string;
  label: React.ReactNode;
  tag?: React.ReactNode;
  colspan?: number;
  childColumns?: ColumnDef<TableRowData>[];
  allowsResizing?: boolean;
  renderCell: (row: TableRowData) => React.ReactNode;
  isActionable?: boolean;
  hideOnBreakpoint?: MediaQueryKeys;
  width?: ColumnSize;
} & (SortableColumnDef<TableRowData> | NonSortableColumnDef);

export type TableElementProps<TableRowData extends BaseTableRowData | CustomRowConfig> = {
  label?: string;
  columns: ColumnDef<TableRowData>[];
  data: Array<TableRowData | CustomRowConfig>;
  getRowKey: (rowData: TableRowData, rowIndex?: number) => Key;
  getRowAttributes?: (rowData: TableRowData, rowIndex?: number) => Record<string, any>;
  defaultSortDescriptor?: SortDescriptor;
  selectionMode?: 'multiple' | 'single';
  selectionBehavior?: 'replace' | 'toggle';
  onRowAction?: (key: Key, row: TableRowData) => void;
  slotEmpty?: React.ReactNode;
  initialPageSize?: PageSize;
  paginationBehavior?: 'paginate' | 'showAll';
  firstClickSortDirection?: 'ascending' | 'descending';
};

export type TableStyleProps = {
  hideHeader?: boolean;
  withGradientCardRows?: boolean; // TODO: CT-662
  withFocusStickyRows?: boolean;
  withOuterBorder?: boolean;
  withInnerBorders?: boolean;
  withScrollSnapColumns?: boolean;
  withScrollSnapRows?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export type TableConfig<TableRowData> = TableItem<TableRowData>[];

export type AllTableProps<TableRowData extends BaseTableRowData | CustomRowConfig> =
  TableElementProps<TableRowData> & TableStyleProps & { style?: { [customProp: string]: number } };

export const Table = <TableRowData extends BaseTableRowData | CustomRowConfig>({
  label = '',
  columns,
  data = [],
  getRowKey,
  getRowAttributes,
  onRowAction,
  defaultSortDescriptor,
  selectionMode = 'single',
  selectionBehavior = 'toggle',
  slotEmpty,
  initialPageSize = 10,
  paginationBehavior = 'paginate',
  hideHeader = false,
  withGradientCardRows = false,
  withFocusStickyRows = false,
  withOuterBorder = false,
  withInnerBorders = false,
  withScrollSnapColumns = false,
  withScrollSnapRows = false,
  firstClickSortDirection,
  className,
  style,
}: AllTableProps<TableRowData>) => {
  const [selectedKeys, setSelectedKeys] = useState(new Set<Key>());

  const { currentPage, pageSize, pages, setCurrentPage, setPageSize } = useTablePagination({
    initialPageSize,
    totalRows: data.length,
  });

  const currentBreakpoints = useBreakpoints();
  const shownColumns = columns.filter(
    ({ hideOnBreakpoint }) => !hideOnBreakpoint || !currentBreakpoints[hideOnBreakpoint]
  );

  const collator = useCollator();

  const sortFn = (
    a: TableRowData | CustomRowConfig,
    b: TableRowData | CustomRowConfig,
    sortColumn?: Key,
    sortDirection?: SortDirection
  ) => {
    if (!sortColumn) return 0;

    const column = columns.find((c) => c.columnKey === sortColumn);
    if (column == null || column.allowsSorting === false) {
      return 0;
    }
    const first = (isCustomRow(a) ? 0 : column.getCellValue(a)) ?? undefined;
    const second = (isCustomRow(b) ? 0 : column.getCellValue(b)) ?? undefined;

    if (first == null || second == null) {
      if (first === second) {
        return 0;
      }
      if (first != null) {
        return 1;
      }
      return -1;
    }

    return (
      // Compare the items by the sorted column
      (Number.isNaN(Number(first))
        ? // String
          collator.compare(String(first), String(second))
        : // Number
          MustBigNumber(first).comparedTo(MustBigNumber(second))) *
      // Flip the direction if descending order is specified.
      (sortDirection === 'descending' ? -1 : 1)
    );
  };

  const internalGetRowKey = useCallback(
    (row: TableRowData | CustomRowConfig) => {
      return isCustomRow(row) ? row.key : getRowKey(row);
    },
    [getRowKey]
  );

  const list = useAsyncList<TableRowData | CustomRowConfig>({
    getKey: internalGetRowKey,
    load: async ({ sortDescriptor }) => ({
      items: sortDescriptor?.column
        ? [...data].sort((a, b) => sortFn(a, b, sortDescriptor?.column, sortDescriptor?.direction))
        : data,
    }),

    initialSortDescriptor: defaultSortDescriptor,

    sort: async ({ items, sortDescriptor }) => ({
      items: [...items].sort((a, b) =>
        sortFn(a, b, sortDescriptor?.column, sortDescriptor?.direction)
      ),
    }),
  });

  // FIX: refactor table so we don't have to manually reload
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => list.reload(), [data]);

  const isEmpty = data.length === 0;
  const shouldPaginate = paginationBehavior === 'paginate' && data.length > Math.min(...PAGE_SIZES);

  return (
    <$TableWrapper
      className={className}
      style={style}
      isEmpty={isEmpty}
      withGradientCardRows={withGradientCardRows}
      withOuterBorder={withOuterBorder}
    >
      {!isEmpty ? (
        <TableRoot
          aria-label={label}
          sortDescriptor={list.sortDescriptor}
          onSortChange={list.sort}
          selectedKeys={selectedKeys}
          setSelectedKeys={setSelectedKeys}
          selectionMode={selectionMode}
          selectionBehavior={selectionBehavior}
          getRowAttributes={getRowAttributes}
          onRowAction={
            onRowAction &&
            ((key: Key) =>
              onRowAction(
                key,
                data.filter(isTableRowData).find((row) => internalGetRowKey(row) === key)!
              ))
          }
          hideHeader={hideHeader}
          withGradientCardRows={withGradientCardRows}
          withFocusStickyRows={withFocusStickyRows}
          withOuterBorder={withOuterBorder}
          withInnerBorders={withInnerBorders}
          withScrollSnapColumns={withScrollSnapColumns}
          withScrollSnapRows={withScrollSnapRows}
          numColumns={shownColumns.length}
          firstClickSortDirection={firstClickSortDirection}
          paginationRow={
            shouldPaginate ? (
              <TablePaginationRow
                currentPage={currentPage}
                pageSize={pageSize}
                pages={pages}
                totalRows={data.length}
                setCurrentPage={setCurrentPage}
                setPageSize={setPageSize}
              />
            ) : undefined
          }
        >
          <TableHeader columns={shownColumns}>
            {(column) => (
              <Column
                key={column.columnKey}
                childColumns={column.childColumns}
                allowsSorting={column.allowsSorting ?? true}
                allowsResizing={column.allowsResizing}
                width={column.width}
              >
                {column.label}
                {column.tag && <Tag>{column.tag}</Tag>}
              </Column>
            )}
          </TableHeader>

          <TableBody
            items={
              shouldPaginate && list.items.length > pageSize
                ? list.items.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
                : list.items
            }
          >
            {(item) => (
              <Row key={internalGetRowKey(item)}>
                {(columnKey) => (
                  <Cell key={`${internalGetRowKey(item)}-${columnKey}`}>
                    {isTableRowData(item) &&
                      columns.find((column) => column.columnKey === columnKey)?.renderCell?.(item)}
                  </Cell>
                )}
              </Row>
            )}
          </TableBody>
        </TableRoot>
      ) : (
        <$Empty withOuterBorder={withOuterBorder}>{slotEmpty}</$Empty>
      )}
    </$TableWrapper>
  );
};

// TODO: remove useless extends
const TableRoot = <TableRowData extends BaseTableRowData | CustomRowConfig>(props: {
  'aria-label'?: string;
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  selectionMode: 'multiple' | 'single';
  selectionBehavior: 'replace' | 'toggle';
  selectedKeys: Set<Key>;
  setSelectedKeys: (selectedKeys: Set<Key>) => void;
  getRowAttributes?: (
    rowData: TableRowData,
    rowIndex?: number
  ) => Record<string, string | number | Record<string, string | number>>;
  onRowAction?: (key: Key) => void;
  children: TableStateProps<TableRowData>['children'];
  numColumns: number;
  paginationRow?: React.ReactNode;
  firstClickSortDirection?: 'ascending' | 'descending';

  hideHeader?: boolean;
  withGradientCardRows?: boolean;
  withFocusStickyRows?: boolean;
  withOuterBorder?: boolean;
  withInnerBorders?: boolean;
  withScrollSnapColumns?: boolean;
  withScrollSnapRows?: boolean;
}) => {
  const {
    'aria-label': ariaLabel,
    selectionMode,
    selectionBehavior,
    getRowAttributes,
    onRowAction,
    numColumns,
    paginationRow,
    hideHeader,
    withGradientCardRows,
    withFocusStickyRows,
    withOuterBorder,
    withInnerBorders,
    withScrollSnapColumns,
    withScrollSnapRows,
    firstClickSortDirection,
  } = props;

  const baseState = useTableState<TableRowData>({
    ...props,
    showSelectionCheckboxes: selectionMode === 'multiple' && selectionBehavior !== 'replace',
  });
  const state: typeof baseState = {
    ...baseState,
    sort: (columnKey, direction) => {
      const { column: curColumnKey, direction: curDirection } = baseState.sortDescriptor;
      // first time touching this column sort
      if (direction == null && (columnKey !== curColumnKey || curDirection == null)) {
        return baseState.sort(columnKey, firstClickSortDirection);
      }
      return baseState.sort(columnKey, direction);
    },
  };

  const ref = React.useRef<HTMLTableElement>(null);
  const { collection } = state;

  const { gridProps } = useTable(
    {
      'aria-label': ariaLabel,
      onRowAction,
    },
    state,
    ref
  );

  return (
    <$Table
      ref={ref}
      {...gridProps}
      hideHeader={hideHeader}
      withGradientCardRows={withGradientCardRows}
      withOuterBorder={withOuterBorder}
      withInnerBorders={withInnerBorders}
    >
      <TableHeadRowGroup
        hidden={hideHeader}
        withGradientCardRows={withGradientCardRows}
        withInnerBorders={withInnerBorders}
      >
        {collection.headerRows.map((headerRow) => (
          <TableHeaderRow
            key={headerRow.key}
            item={headerRow}
            state={state}
            withScrollSnapRows={withScrollSnapRows}
          >
            {[...headerRow.childNodes].map(
              (column) => (
                <TableColumnHeader
                  key={column.key}
                  column={column}
                  state={state}
                  withScrollSnapColumns={withScrollSnapColumns}
                />
              )
              // )
            )}
          </TableHeaderRow>
        ))}
      </TableHeadRowGroup>

      <TableBodyRowGroup
        withGradientCardRows={withGradientCardRows}
        withInnerBorders={withInnerBorders}
        withOuterBorder={withOuterBorder}
      >
        {[...collection.body.childNodes].map((row) =>
          (row.value as CustomRowConfig)?.slotCustomRow ? (
            (row.value as CustomRowConfig).slotCustomRow({
              item: row,
              state,
              ...getRowAttributes?.(row.value!),
              withGradientCardRows,
              withFocusStickyRows,
              withScrollSnapRows,
              children: null,
            })
          ) : (
            <TableRow
              key={row.key}
              item={row}
              state={state}
              hasRowAction={!!onRowAction}
              {...getRowAttributes?.(row.value!)}
              withGradientCardRows={withGradientCardRows}
              withFocusStickyRows={withFocusStickyRows}
              withScrollSnapRows={withScrollSnapRows}
            >
              {[...row.childNodes].map(
                (cell) => (
                  <TableCell
                    key={cell.key}
                    cell={cell}
                    state={state}
                    isActionable={
                      ((cell as GridNode<TableRowData>).column?.value as ColumnDef<TableRowData>)
                        ?.isActionable
                    }
                  />
                )
                // )
              )}
            </TableRow>
          )
        )}
      </TableBodyRowGroup>
      {paginationRow && (
        <$Tfoot>
          <$PaginationTr key="pagination">
            <td
              colSpan={numColumns}
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={(e) => e.preventDefault()}
            >
              {paginationRow}
            </td>
          </$PaginationTr>
        </$Tfoot>
      )}
    </$Table>
  );
};

const TableHeadRowGroup = ({
  children,
  hidden,
  withGradientCardRows,
  withInnerBorders,
}: { children: React.ReactNode } & {
  hidden?: boolean;
  withGradientCardRows?: boolean;
  withInnerBorders?: boolean;
}) => {
  const { rowGroupProps } = useTableRowGroup();

  return (
    <$Thead
      {...rowGroupProps}
      hidden={hidden}
      withGradientCardRows={withGradientCardRows}
      withInnerBorders={withInnerBorders}
    >
      {children}
    </$Thead>
  );
};

const TableBodyRowGroup = ({
  children,
  withGradientCardRows,
  withInnerBorders,
  withOuterBorder,
}: { children: React.ReactNode } & TableStyleProps) => {
  const { rowGroupProps } = useTableRowGroup();

  return (
    <$Tbody
      {...rowGroupProps}
      withGradientCardRows={withGradientCardRows}
      withInnerBorders={withInnerBorders}
      withOuterBorder={withOuterBorder}
    >
      {children}
    </$Tbody>
  );
};

const TableHeaderRow = <TableRowData extends BaseTableRowData>({
  item,
  state,
  children,
  withScrollSnapRows,
}: {
  item: TableCollection<TableRowData>['headerRows'][number];
  state: TableState<TableRowData>;
  children: React.ReactNode;
  withScrollSnapRows?: boolean;
}) => {
  const ref = React.useRef<HTMLTableRowElement>(null);
  const { rowProps } = useTableHeaderRow({ node: item }, state, ref);

  return (
    <$Tr ref={ref} {...rowProps} withScrollSnapRows={withScrollSnapRows}>
      {children}
    </$Tr>
  );
};

const TableColumnHeader = <TableRowData extends BaseTableRowData>({
  column,
  state,
  withScrollSnapColumns,
}: {
  column: Node<TableRowData>;
  state: TableState<TableRowData>;
  withScrollSnapColumns?: boolean;
}) => {
  const ref = React.useRef<HTMLTableCellElement>(null);
  const { columnHeaderProps } = useTableColumnHeader({ node: column }, state, ref);
  const { focusProps } = useFocusRing();

  return (
    <$Th
      {...mergeProps(columnHeaderProps, focusProps)}
      // data-focused={isFocusVisible || undefined}
      style={{ width: column.props?.width }}
      ref={ref}
      allowSorting={column.props?.allowsSorting ?? true}
      withScrollSnapColumns={withScrollSnapColumns}
    >
      <$Row>
        {column.rendered}
        {(column.props.allowsSorting ?? true) && (
          <$SortArrow
            aria-hidden="true"
            sortDirection={
              state.sortDescriptor?.column === column.key
                ? state.sortDescriptor?.direction ?? 'none'
                : 'none'
            }
          >
            <Icon iconName={IconName.Triangle} aria-hidden="true" />
          </$SortArrow>
        )}
      </$Row>
    </$Th>
  );
};

export const TableRow = <TableRowData extends BaseTableRowData>({
  item,
  children,
  state,
  hasRowAction,
  withGradientCardRows,
  withFocusStickyRows,
  withScrollSnapRows,
  ...attrs
}: {
  item: TableCollection<TableRowData>['rows'][number];
  children: React.ReactNode;
  state: TableState<TableRowData>;
  hasRowAction?: boolean;
  withGradientCardRows?: boolean;
  withFocusStickyRows?: boolean;
  withScrollSnapRows?: boolean;
}) => {
  const ref = React.useRef<HTMLTableRowElement>(null);
  const selectionManager = state.selectionManager;
  const isSelected = selectionManager.isSelected(item.key);
  const isClickable = selectionManager.selectionBehavior === 'toggle' && hasRowAction;

  const { rowProps, isPressed } = useTableRow(
    {
      node: item,
    },
    state,
    ref
  );

  const { focusProps } = useFocusRing();

  return (
    <$Tr
      ref={ref}
      data-selected={isSelected}
      $data-isPressed={isPressed}
      {...mergeProps(rowProps, focusProps)}
      {...attrs}
      withFocusStickyRows={withFocusStickyRows}
      withScrollSnapRows={withScrollSnapRows}
      isClickable={isClickable}
    >
      {children}
    </$Tr>
  );
};

const TableCell = <TableRowData extends BaseTableRowData>({
  cell,
  state,
  isActionable,
}: {
  cell: Node<TableRowData>;
  state: TableState<TableRowData>;
  isActionable?: boolean;
}) => {
  const ref = React.useRef<HTMLTableCellElement>(null);
  const { gridCellProps } = useTableCell({ node: cell }, state, ref);
  const { focusProps } = useFocusRing();

  return (
    <$Td
      {...mergeProps(
        isActionable
          ? {
              onMouseDown: (e: MouseEvent) => e.stopPropagation(),
              onPointerDown: (e: MouseEvent) => e.stopPropagation(),
              ...gridCellProps,
            }
          : gridCellProps,
        focusProps
      )}
      // data-focused={isFocusVisible || undefined}
      ref={ref}
    >
      {/* <Styled.Row> */}
      {cell.rendered}
      {/* </Styled.Row> */}
    </$Td>
  );
};

const $TableWrapper = styled.div<{
  isEmpty: boolean;
  withGradientCardRows?: boolean;
  withOuterBorder: boolean;
}>`
  // Params
  --tableStickyRow-textColor: var(--color-text-0, inherit);
  --tableStickyRow-backgroundColor: inherit;
  --table-header-height: 2rem;
  --table-footer-height: 2.75rem;

  --tableRow-hover-backgroundColor: var(--color-layer-3);
  --tableRow-backgroundColor: ;

  --table-cell-align: start; // start | center | end
  --table-firstColumn-cell-align: start; // start | center | end | var(--table-cell-align)
  --table-lastColumn-cell-align: end; // start | center | end | var(--table-cell-align)
  --tableCell-padding: 0 1rem;

  // Rules

  flex: 1;

  ${layoutMixins.contentSectionAttached}
  scroll-snap-align: none;

  ${layoutMixins.stack}

  overflow: clip;

  ${({ isEmpty, withGradientCardRows, withOuterBorder }) =>
    withOuterBorder &&
    (!withGradientCardRows || isEmpty) &&
    css`
      ${layoutMixins.withOuterBorderClipped}
    `}
`;

const $Empty = styled.div<{ withOuterBorder: boolean }>`
  ${layoutMixins.column}
  height: 100%;

  justify-items: center;
  align-content: center;
  padding: 4rem;
  gap: 0.75em;

  color: var(--color-text-0);
  font: var(--font-base-book);
`;

type StyledTableStyleProps = {
  hideHeader?: boolean;
  withGradientCardRows?: boolean;
  withOuterBorder?: boolean;
  withInnerBorders?: boolean;
  withSolidHeader?: boolean;
};

const $Table = styled.table<StyledTableStyleProps>`
  align-self: start;

  ${layoutMixins.stickyArea1}
  --stickyArea1-background: var(--color-layer-2);
  --stickyArea1-topHeight: var(--table-header-height);
  --stickyArea1-bottomHeight: var(--table-footer-height);

  ${({ hideHeader }) =>
    hideHeader &&
    css`
      --stickyArea1-topHeight: 0px;
    `}

  border-collapse: separate;
  border-spacing: 0;

  /* [data-selected] {} */

  ${({ withInnerBorders, hideHeader }) =>
    withInnerBorders &&
    css`
      border-spacing: 0 var(--border-width);
      --stickyArea1-topGap: var(--border-width);

      ${hideHeader &&
      css`
        --stickyArea1-topGap: 0px;
      `}

      // Compensate for outer <table> border (hidden and omitted from scroll with overflow: clip; on <TableWrapper>)
      margin: calc(-1 * var(--border-width)) 0;
    `}

  ${({ withGradientCardRows }) =>
    withGradientCardRows &&
    css`
      border-spacing: 0 0.75rem;

      // Use negative margin and 0 padding on 'th' element, so that border-spacing
      // doesn't affect the header row's height
      margin: -0.75rem clamp(0rem, 1rem - var(--contentContainerPage-paddingLeft, 0rem), 1rem) 0;

      th {
        padding: 0;
      }
    `}
  
  @media ${breakpoints.tablet} {
    min-height: 6.25rem;
  }
`;

const $Tr = styled.tr<{
  isClickable?: boolean;
  withFocusStickyRows?: boolean;
  withScrollSnapRows?: boolean;
}>`
  /* Computed */
  --tableRow-currentBackgroundColor: var(--tableRow-backgroundColor);

  /* Rules */
  background-color: var(--tableRow-currentBackgroundColor);

  ${({ isClickable }) =>
    isClickable &&
    css`
      cursor: pointer;

      &:hover,
      &:focus-visible,
      &:focus-within {
        --tableRow-currentBackgroundColor: var(--tableRow-hover-backgroundColor);
        filter: brightness(var(--hover-filter-base));
      }
    `};

  ${({ withFocusStickyRows }) =>
    withFocusStickyRows &&
    css`
      &:focus-visible,
      &:focus-within {
        ${layoutMixins.sticky}
        z-index: 1;
      }
    `}

  ${({ withScrollSnapRows }) =>
    withScrollSnapRows &&
    css`
      ${layoutMixins.scrollSnapItem}
    `}
`;

const $Th = styled.th<{ allowSorting: boolean; withScrollSnapColumns?: boolean }>`
  // Computed
  --table-cell-currentAlign: var(--table-cell-align);

  &:first-of-type {
    --table-cell-currentAlign: var(--table-firstColumn-cell-align, var(--table-cell-align));
  }
  &:last-of-type {
    --table-cell-currentAlign: var(--table-lastColumn-cell-align, var(--table-cell-align));
  }

  // Rules
  ${({ withScrollSnapColumns }) =>
    withScrollSnapColumns &&
    css`
      ${layoutMixins.scrollSnapItem}
    `}

  ${({ allowSorting }) =>
    allowSorting
      ? css`
          cursor: pointer;
        `
      : css`
          cursor: default;
          pointer-events: none;
        `}

  white-space: nowrap;
  text-align: var(--table-cell-currentAlign);
`;

const $Td = styled.td`
  // Computed
  --table-cell-currentAlign: var(--table-cell-align);

  &:first-of-type {
    --table-cell-currentAlign: var(--table-firstColumn-cell-align, var(--table-cell-align));
  }
  &:last-of-type {
    --table-cell-currentAlign: var(--table-lastColumn-cell-align, var(--table-cell-align));
  }

  // Rules
  padding: var(--tableCell-padding);

  text-align: var(--table-cell-currentAlign);

  > * {
    vertical-align: middle;
  }
`;

const $SortArrow = styled.span<{ sortDirection: 'ascending' | 'descending' | 'none' }>`
  float: right;
  margin-left: auto;

  display: inline-flex;
  transition:
    transform 0.3s var(--ease-out-expo),
    font-size 0.3s var(--ease-out-expo);

  font-size: 0.375em;

  ${({ sortDirection }) =>
    ({
      ascending: css`
        transform: scaleY(-1);
      `,
      descending: css`
        transform: scaleY(1);
      `,
      none: css`
        visibility: hidden;
      `,
    })[sortDirection]}
`;

const $Thead = styled.thead<TableStyleProps>`
  ${layoutMixins.stickyHeader}
  scroll-snap-align: none;
  font: var(--font-mini-book);

  > * {
    height: var(--stickyArea-topHeight);
  }

  color: var(--tableStickyRow-textColor);
  background-color: var(--tableStickyRow-backgroundColor);

  ${({ withInnerBorders, withGradientCardRows }) =>
    withInnerBorders &&
    !withGradientCardRows &&
    css`
      ${layoutMixins.withInnerHorizontalBorders}
    `}
`;

const $Tfoot = styled.tfoot`
  ${layoutMixins.stickyFooter}
  scroll-snap-align: none;
  font: var(--font-mini-book);

  > * {
    height: var(--stickyArea-bottomHeight);
  }

  color: var(--tableStickyRow-textColor);
  background-color: var(--tableStickyRow-backgroundColor);
`;

const $Tbody = styled.tbody<TableStyleProps>`
  ${layoutMixins.stickyArea2}
  font: var(--font-small-book);

  // If <table> height is fixed with not enough rows to overflow, vertically center the rows
  &:before {
    content: '';
    display: table-row;
  }

  ${({ withInnerBorders, withGradientCardRows }) =>
    withInnerBorders &&
    !withGradientCardRows &&
    css`
      ${layoutMixins.withInnerHorizontalBorders}

      --stickyArea2-paddingTop: var(--border-width);
      --stickyArea2-paddingBottom: var(--border-width);
      --stickyArea2-paddingLeft: var(--border-width);
      --stickyArea2-paddingRight: var(--border-width);

      tr:first-of-type {
        box-shadow: 0 calc(var(--border-width)) 0 0 var(--border-color);
      }
    `}

  ${({ withOuterBorder }) =>
    withOuterBorder &&
    css`
      tr:last-of-type:not(:only-of-type) {
        box-shadow: 0 calc(-1 * var(--border-width)) 0 0 var(--border-color);
      }

      tr:first-of-type {
        box-shadow: none;
      }
    `}

  ${({ withGradientCardRows }) =>
    withGradientCardRows &&
    css`
      --table-row-default-gradient: linear-gradient(
        342.62deg,
        var(--color-gradient-base-0) -9.23%,
        var(--color-gradient-base-1) 110.36%
      );

      --table-row-gradient-to-color: transparent;
      --tableCell-borderRadius: ;

      &:before,
      &:after {
        content: none;
      }

      tr {
        background: linear-gradient(
            270deg,
            var(--table-row-gradient-to-color) -32.39%,
            transparent 100%
          ),
          var(--table-row-default-gradient);

        @supports (background: -webkit-named-image(i)) {
          background: var(--table-row-gradient-to-color);
        }

        td:first-child {
          --tableCell-borderRadius: 1rem 0 0 1rem;
        }

        td:last-child {
          --tableCell-borderRadius: 0 1rem 1rem 0;
        }

        td {
          height: 4.25rem;
          border-radius: var(--tableCell-borderRadius);
        }
      }
    `}
`;

const $Row = styled.div`
  ${layoutMixins.inlineRow}
  padding: var(--tableCell-padding);
`;

const $PaginationTr = styled.tr`
  box-shadow: 0 calc(-1 * var(--border-width)) 0 0 var(--border-color);
`;
