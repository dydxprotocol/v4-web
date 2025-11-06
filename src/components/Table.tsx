import React, { Key, useCallback, useMemo, useState } from 'react';

import {
  Cell,
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
import { flatMap, isFunction } from 'lodash';
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
import styled, { css } from 'styled-components';

import { MediaQueryKeys, useBreakpoints } from '@/hooks/useBreakpoints';
import { useTablePagination } from '@/hooks/useTablePagination';

import { layoutMixins } from '@/styles/layoutMixins';

import { MustBigNumber } from '@/lib/numbers';
import { objectFromEntries } from '@/lib/objectHelpers';

import { SortIcon } from './SortIcon';
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

export type SelectedKey = 'all' | Iterable<string | number> | undefined;

export type ColumnDef<TableRowData extends BaseTableRowData | CustomRowConfig> = {
  columnKey: string;
  label: NonNullable<React.ReactNode>;
  tag?: React.ReactNode;
  colspan?: number;
  childColumns?: ColumnDef<TableRowData>[];
  isRowHeader?: boolean;
  allowsResizing?: boolean;
  renderCell?: (row: TableRowData) => React.ReactNode;
  isActionable?: boolean;
  hideOnBreakpoint?: MediaQueryKeys;
  width?: ColumnSize;
  align?: 'start' | 'center' | 'end';
} & (SortableColumnDef<TableRowData> | NonSortableColumnDef);

export type TableElementProps<TableRowData extends BaseTableRowData | CustomRowConfig> = {
  label?: string;
  columns: ColumnDef<TableRowData>[];
  data: Array<TableRowData | CustomRowConfig>;
  tableId: string;
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
  shouldResetOnTotalRowsChange?: boolean;
  getIsRowPinned?: (rowData: TableRowData) => boolean;
};

export type TableStyleProps = {
  hideHeader?: boolean;
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
  tableId,
  data = [],
  getRowKey,
  getRowAttributes,
  getIsRowPinned,
  onRowAction,
  defaultSortDescriptor,
  selectionMode = 'single',
  selectionBehavior = 'toggle',
  slotEmpty,
  initialPageSize = 10,
  paginationBehavior = 'paginate',
  hideHeader = false,
  withFocusStickyRows = false,
  withOuterBorder = false,
  withInnerBorders = false,
  withScrollSnapColumns = false,
  withScrollSnapRows = false,
  firstClickSortDirection = 'descending',
  shouldResetOnTotalRowsChange = false,
  className,
  style,
}: AllTableProps<TableRowData>) => {
  const [selectedKeys, setSelectedKeys] = useState<SelectedKey>(new Set());

  const { currentPage, pageSize, pages, setCurrentPage, setPageSize } = useTablePagination({
    initialPageSize,
    totalRows: data.length,
    shouldResetOnTotalRowsChange,
    tableId,
  });

  const currentBreakpoints = useBreakpoints();
  const shownColumns = columns.filter(
    ({ hideOnBreakpoint }) => !hideOnBreakpoint || !currentBreakpoints[hideOnBreakpoint]
  );

  const collator = useCollator();
  const sortFn = useCallback(
    (
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

      const first = isCustomRow(a) ? 0 : column.getCellValue(a);
      const second = isCustomRow(b) ? 0 : column.getCellValue(b);
      const sortDirectionAsNumber = sortDirection === 'descending' ? -1 : 1;

      // Pinned check: show items that are isPinned first
      const isFirstPinned = isTableRowData(a) && getIsRowPinned?.(a);
      const isSecondPinned = isTableRowData(b) && getIsRowPinned?.(b);

      if (isFirstPinned !== isSecondPinned) {
        return isFirstPinned ? -1 : 1;
      }

      if (first == null || second == null) {
        if (first === second) {
          return 0;
        }
        if (first != null) {
          return sortDirectionAsNumber;
        }
        return -1 * sortDirectionAsNumber;
      }

      return (
        // Compare the items by the sorted column
        (Number.isNaN(Number(first!))
          ? // String
            collator.compare(String(first), String(second))
          : // Number
            (MustBigNumber(first).comparedTo(MustBigNumber(second)) ?? 0)) *
        // Flip the direction if descending order is specified.
        sortDirectionAsNumber
      );
    },
    [collator, columns]
  );

  const internalGetRowKey = useCallback(
    (row: TableRowData | CustomRowConfig) => {
      return isCustomRow(row) ? row.key : getRowKey(row);
    },
    [getRowKey]
  );

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>(
    defaultSortDescriptor ?? ({} as SortDescriptor)
  );
  const items = useMemo(() => {
    return sortDescriptor.column
      ? [...data].sort((a, b) => sortFn(a, b, sortDescriptor.column, sortDescriptor.direction))
      : data;
  }, [data, sortDescriptor.column, sortDescriptor.direction, sortFn]);

  const isEmpty = data.length === 0;
  const shouldPaginate = paginationBehavior === 'paginate' && data.length > Math.min(...PAGE_SIZES);

  const bodyListItems = useMemo(
    () =>
      shouldPaginate && items.length > pageSize
        ? items.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
        : items,
    [currentPage, items, pageSize, shouldPaginate]
  );

  const renderCell = useCallback(
    (
      item: TableRowData | CustomRowConfig,
      columnKey: string | number,
      allColumns: ColumnDef<TableRowData>[]
    ) => {
      if (isTableRowData(item)) {
        const columnMapByKey = objectFromEntries(
          [...allColumns, ...flatMap(allColumns, (column) => column.childColumns ?? [])].map(
            (column) => [column.columnKey, column]
          )
        );

        const maybeRenderColumn = columnMapByKey[columnKey];
        return maybeRenderColumn?.renderCell?.(item) ?? null;
      }

      return null;
    },
    []
  );

  /**
   * | column header 1 | column header 2 |
   * | header A  | header B  | Header C  |
   * @returns column defs when nested columns are considered and whether the columnDefs are nested
   */
  const { leafColumns, hasNestedColumns } = useMemo(() => {
    const allColumns: ColumnDef<TableRowData>[] = [];
    let hasChildColumns: boolean = false;

    const findAndAppendColumns = (cols: ColumnDef<TableRowData>[]) => {
      cols.forEach((c) => {
        if (c.childColumns?.length) {
          hasChildColumns = true;
          findAndAppendColumns(c.childColumns);
        } else {
          allColumns.push(c);
        }
      });
    };
    findAndAppendColumns(shownColumns);
    return {
      leafColumns: allColumns,
      hasNestedColumns: hasChildColumns,
    };
  }, [shownColumns]);

  return (
    <$TableWrapper
      className={className}
      style={style}
      isEmpty={isEmpty}
      withOuterBorder={withOuterBorder}
    >
      {!isEmpty ? (
        <TableRoot
          aria-label={label}
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
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
          withFocusStickyRows={withFocusStickyRows}
          withOuterBorder={withOuterBorder}
          withInnerBorders={withInnerBorders}
          withScrollSnapColumns={withScrollSnapColumns}
          withScrollSnapRows={withScrollSnapRows}
          numColumns={leafColumns.length}
          hasNestedColumns={hasNestedColumns}
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
                isRowHeader={column.isRowHeader ?? true}
                key={column.columnKey}
                allowsSorting={column.allowsSorting ?? true}
                allowsResizing={column.allowsResizing}
                width={column.width}
                childColumns={column.childColumns}
              >
                {column.label}
                {column.tag && <Tag>{column.tag}</Tag>}
              </Column>
            )}
          </TableHeader>

          <TableBody items={bodyListItems}>
            {(item) => {
              return (
                <Row key={internalGetRowKey(item)}>
                  {(columnKey) => (
                    <Cell key={`${internalGetRowKey(item)}-${columnKey}`}>
                      {renderCell(item, columnKey, columns)}
                    </Cell>
                  )}
                </Row>
              );
            }}
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
  selectedKeys: SelectedKey;
  setSelectedKeys: (selectedKeys: SelectedKey) => void;
  getRowAttributes?: (
    rowData: TableRowData,
    rowIndex?: number
  ) => Record<string, string | number | Record<string, string | number>>;
  onRowAction?: (key: Key) => void;
  children: TableStateProps<TableRowData>['children'];
  numColumns: number;
  paginationRow?: React.ReactNode;
  firstClickSortDirection?: 'ascending' | 'descending';

  hasNestedColumns?: boolean;
  hideHeader?: boolean;
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
    hasNestedColumns,
    hideHeader,
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
      const { column: currentColumnKey, direction: currentDirection } =
        baseState.sortDescriptor ?? {};
      // first time touching this column sort
      if (direction == null && (columnKey !== currentColumnKey || currentDirection == null)) {
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

  const rows = React.useMemo(
    () => Array.from(collection.body.childNodes),
    [collection.body.childNodes]
  );

  return (
    <$Table
      ref={ref}
      {...gridProps}
      hideHeader={hideHeader}
      withOuterBorder={withOuterBorder}
      withInnerBorders={withInnerBorders}
    >
      <TableHeadRowGroup hidden={hideHeader} withInnerBorders={withInnerBorders}>
        {collection.headerRows.map((headerRow) => (
          <TableHeaderRowContent
            key={headerRow.key}
            headerRow={headerRow}
            state={state}
            withScrollSnapRows={withScrollSnapRows}
            withScrollSnapColumns={withScrollSnapColumns}
          />
        ))}
      </TableHeadRowGroup>

      <TableBodyRowGroup withInnerBorders={withInnerBorders} withOuterBorder={withOuterBorder}>
        {rows.map((row) => {
          return (row.value as CustomRowConfig | null)?.slotCustomRow ? (
            (row.value as CustomRowConfig).slotCustomRow({
              item: row,
              state,
              ...getRowAttributes?.(row.value!),
              withFocusStickyRows,
              withScrollSnapRows,
              children: null,
            })
          ) : (
            <TableRowContent
              key={row.key}
              row={row}
              state={state}
              onRowAction={onRowAction}
              getRowAttributes={getRowAttributes}
              hasNestedColumns={hasNestedColumns}
              withFocusStickyRows={withFocusStickyRows}
              withScrollSnapRows={withScrollSnapRows}
            />
          );
        })}
      </TableBodyRowGroup>

      {paginationRow && (
        <$Tfoot>
          <tr
            key="pagination"
            tw="shadow-[0_calc(-1_*_var(--border-width))_0_0_var(--border-color)]"
          >
            <td
              colSpan={numColumns}
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={(e) => e.preventDefault()}
            >
              {paginationRow}
            </td>
          </tr>
        </$Tfoot>
      )}
    </$Table>
  );
};

const TableHeadRowGroup = ({
  children,
  hidden,
  withInnerBorders,
}: { children: React.ReactNode } & {
  hidden?: boolean;
  withInnerBorders?: boolean;
}) => {
  const { rowGroupProps } = useTableRowGroup();

  return (
    <$Thead {...rowGroupProps} hidden={hidden} withInnerBorders={withInnerBorders}>
      {children}
    </$Thead>
  );
};

const TableBodyRowGroup = ({
  children,
  withInnerBorders,
  withOuterBorder,
}: { children: React.ReactNode } & TableStyleProps) => {
  const { rowGroupProps } = useTableRowGroup();

  return (
    <$Tbody
      {...rowGroupProps}
      withInnerBorders={withInnerBorders}
      withOuterBorder={withOuterBorder}
    >
      {children}
    </$Tbody>
  );
};

const TableRowContent = <TableRowData extends BaseTableRowData>({
  row,
  state,
  onRowAction,
  getRowAttributes,
  hasNestedColumns,
  withFocusStickyRows,
  withScrollSnapRows,
}: {
  row: TableCollection<TableRowData>['rows'][number];
  state: TableState<TableRowData>;
  onRowAction?: (key: Key) => void;
  getRowAttributes?: (
    rowData: TableRowData,
    rowIndex?: number
  ) => Record<string, string | number | Record<string, string | number>>;
  hasNestedColumns?: boolean;
  withFocusStickyRows?: boolean;
  withScrollSnapRows?: boolean;
}) => {
  const cells = Array.from(row.childNodes);

  // The initial cells on first render
  const initialCells = useMemo(() => {
    return cells;
  }, [row.key]);

  /**
   * This is pretty jank, but for some reason when you have a columnDef where there are nested columns (childColumns prop) the table API clears `cells` after the first render.
   * This is a workaround to ensure that we can display table cells for nested columns without the `collection` lib clearing it between renders.
   */
  const tableCellData = hasNestedColumns ? initialCells : cells;

  const tableCells = (
    <>
      {tableCellData.map((cellData) => {
        return (
          <TableCell
            key={cellData.key}
            cell={cellData}
            state={state}
            isActionable={
              (
                (cellData as GridNode<TableRowData>).column?.value as
                  | ColumnDef<TableRowData>
                  | undefined
              )?.isActionable ?? onRowAction === undefined
            }
          />
        );
      })}
    </>
  );

  return (
    <TableRow
      key={row.key}
      item={row}
      state={state}
      hasRowAction={!!onRowAction}
      {...getRowAttributes?.(row.value!)}
      withFocusStickyRows={withFocusStickyRows}
      withScrollSnapRows={withScrollSnapRows}
    >
      {tableCells}
    </TableRow>
  );
};

const TableHeaderRowContent = <TableRowData extends BaseTableRowData>({
  headerRow,
  state,
  withScrollSnapRows,
  withScrollSnapColumns,
}: {
  headerRow: TableCollection<TableRowData>['headerRows'][number];
  state: TableState<TableRowData>;
  withScrollSnapRows?: boolean;
  withScrollSnapColumns?: boolean;
}) => {
  const columns = useMemo(() => {
    return Array.from(headerRow.childNodes);
  }, [headerRow]);

  return (
    <TableHeaderRow
      key={headerRow.key}
      item={headerRow}
      state={state}
      withScrollSnapRows={withScrollSnapRows}
    >
      {columns.map((column) => {
        if (column.type === 'placeholder') {
          return <th aria-label="placeholder" key={column.key} role="columnheader" />;
        }

        return (
          <TableColumnHeader
            key={column.key}
            column={column}
            state={state}
            withScrollSnapColumns={withScrollSnapColumns}
          />
        );
      })}
    </TableHeaderRow>
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
      style={{
        width: column.props?.width,
        textAlign: (column.value as any)?.align,
      }}
      ref={ref}
      allowSorting={column.props?.allowsSorting ?? true}
      withScrollSnapColumns={withScrollSnapColumns}
    >
      <$Row>
        {column.rendered}
        {(column.props?.allowsSorting ?? true) && (
          <SortIcon
            sortDirection={
              state.sortDescriptor?.column === column.key ? state.sortDescriptor.direction : 'none'
            }
          />
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
  withFocusStickyRows,
  withScrollSnapRows,
  ...attrs
}: {
  item: TableCollection<TableRowData>['rows'][number];
  children: React.ReactNode;
  state: TableState<TableRowData>;
  hasRowAction?: boolean;
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
      ref={ref}
    >
      {cell.rendered}
    </$Td>
  );
};

const $TableWrapper = styled.div<{
  isEmpty: boolean;
  withOuterBorder: boolean;
}>`
  // Params
  --tableStickyRow-textColor: var(--color-text-0, inherit);
  --tableStickyRow-backgroundColor: inherit;
  --table-header-height: 2rem;
  --table-footer-height: 0rem;

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

  ${({ withOuterBorder }) =>
    withOuterBorder &&
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
      border-spacing: 0 var(--border-spacing, var(--border-width));
      --stickyArea1-topGap: var(--border-width);

      ${hideHeader &&
      css`
        --stickyArea1-topGap: 0px;
      `}

      // Compensate for outer <table> border (hidden and omitted from scroll with overflow: clip; on <TableWrapper>)
      margin: calc(-1 * var(--border-width)) 0;
    `}
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

const $Thead = styled.thead<TableStyleProps>`
  ${layoutMixins.stickyHeader}
  scroll-snap-align: none;
  font: var(--font-mini-book);

  > * {
    height: var(--stickyArea-topHeight);
  }

  color: var(--tableStickyRow-textColor);
  background-color: var(--tableStickyRow-backgroundColor);

  ${({ withInnerBorders }) =>
    withInnerBorders &&
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

  ${({ withInnerBorders }) =>
    withInnerBorders &&
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
`;

const $Row = styled.div`
  ${layoutMixins.inlineRow}
  padding: var(--tableCell-padding);

  gap: 0.33ch;
`;
