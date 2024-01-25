import React, { Fragment, Key, useCallback, useEffect, useMemo, useState } from 'react';
import styled, { css, type AnyStyledComponent } from 'styled-components';

import {
  useTable,
  useTableCell,
  useTableColumnHeader,
  useTableRow,
  useTableHeaderRow,
  useTableRowGroup,
  useTableSelectAllCheckbox,
  useTableSelectionCheckbox,
  mergeProps,
  useFocusRing,
  useCollator,
} from 'react-aria';

import { type ColumnSize, type TableCollection } from '@react-types/table';
import { type GridNode } from '@react-types/grid';

import type { Node, SortDescriptor, SortDirection, CollectionChildren } from '@react-types/shared';

import {
  Cell,
  // CollectionBuilderContext,
  Column,
  Row,
  TableBody,
  TableHeader,
  type TableState,
  useTableState,
} from '@react-stately/table';

import { useAsyncList } from 'react-stately';

import { useBreakpoints, useStringGetter } from '@/hooks';
import { MediaQueryKeys } from '@/hooks/useBreakpoints';

import { breakpoints } from '@/styles';
import { layoutMixins } from '@/styles/layoutMixins';
import { CaretIcon } from '@/icons';

import { STRING_KEYS } from '@/constants/localization';

import { MustBigNumber } from '@/lib/numbers';

import { Icon, IconName } from './Icon';
import { Tag } from './Tag';
import { Button } from './Button';

export { TableCell } from './Table/TableCell';
export { TableColumnHeader } from './Table/TableColumnHeader';
export { MarketTableCell } from './Table/MarketTableCell';

export type CustomRowConfig = {
  key: string;
  slotCustomRow: (..._: Parameters<typeof TableRow>) => React.ReactNode;
};

export type TableItem<TableRowData> = {
  value: TableRowData;

  slotBefore?: () => React.ReactNode;
  label: string;
  tag?: React.ReactNode;
  slotAfter?: () => React.ReactNode;

  onSelect?: (key: TableRowData) => void;
};

type ColumnDef<TableRowData extends object> = {
  columnKey: string;
  label: React.ReactNode;
  tag?: React.ReactNode;
  colspan?: number;
  childColumns?: ColumnDef<TableRowData>[];
  getCellValue: (row: TableRowData) => string | number;
  allowsSorting?: boolean; // Default true
  allowsResizing?: boolean;
  renderCell: (row: TableRowData) => React.ReactNode;
  isActionable?: boolean;
  hideOnBreakpoint?: MediaQueryKeys;
  width?: ColumnSize;
};

export type ElementProps<TableRowData extends object | CustomRowConfig, TableRowKey extends Key> = {
  label?: string;
  columns: ColumnDef<TableRowData>[];
  data: TableRowData[];
  getRowKey: (rowData: TableRowData, rowIndex?: number) => TableRowKey;
  getRowAttributes?: (rowData: TableRowData, rowIndex?: number) => Record<string, any>;
  // shouldRowRender?: (prevRowData: object, currentRowData: object) => boolean;
  defaultSortDescriptor?: SortDescriptor;
  selectionMode?: 'multiple' | 'single';
  selectionBehavior?: 'replace' | 'toggle';
  onRowAction?: (key: TableRowKey, row: TableRowData) => void;
  slotEmpty?: React.ReactNode;
  initialNumRowsToShow?: number;
  // collection: TableCollection<string>;
  // children: React.ReactNode;
};

type StyleProps = {
  hideHeader?: boolean;
  withGradientCardRows?: boolean;
  withFocusStickyRows?: boolean;
  withOuterBorder?: boolean;
  withInnerBorders?: boolean;
  withScrollSnapColumns?: boolean;
  withScrollSnapRows?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export type TableConfig<TableRowData> = TableItem<TableRowData>[];

export const Table = <TableRowData extends object, TableRowKey extends Key>({
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
  initialNumRowsToShow,
  // shouldRowRender,

  // collection,
  // children,
  hideHeader = false,
  withGradientCardRows = false,
  withFocusStickyRows = false,
  withOuterBorder = false,
  withInnerBorders = false,
  withScrollSnapColumns = false,
  withScrollSnapRows = false,
  className,
  style,
}: ElementProps<TableRowData, TableRowKey> & StyleProps) => {
  const [selectedKeys, setSelectedKeys] = useState(new Set<TableRowKey>());
  const [numRowsToShow, setNumRowsToShow] = useState(initialNumRowsToShow);
  const enableViewMore = numRowsToShow !== undefined;

  const currentBreakpoints = useBreakpoints();
  const shownColumns = columns.filter(
    ({ hideOnBreakpoint }) => !hideOnBreakpoint || !currentBreakpoints[hideOnBreakpoint as string]
  );

  const collator = useCollator();

  const sortFn = (
    a: TableRowData,
    b: TableRowData,
    sortColumn?: Key,
    sortDirection?: SortDirection
  ) => {
    if (!sortColumn) return 0;

    const column = columns.find((column) => column.columnKey === sortColumn);
    const first = column?.getCellValue(a);
    const second = column?.getCellValue(b);

    return (
      // Compare the items by the sorted column
      (isNaN(first as number)
        ? // String
          collator.compare(first as string, second as string)
        : // Number
          MustBigNumber(first).comparedTo(MustBigNumber(second))) *
      // Flip the direction if descending order is specified.
      (sortDirection === 'descending' ? -1 : 1)
    );
  };

  const list = useAsyncList<TableRowData>({
    getKey: getRowKey,
    load: async ({ sortDescriptor }) => ({
      items: sortDescriptor?.column
        ? data.sort((a, b) => sortFn(a, b, sortDescriptor?.column, sortDescriptor?.direction))
        : data,
    }),

    initialSortDescriptor: defaultSortDescriptor,

    sort: async ({ items, sortDescriptor }) => ({
      items: items.sort((a, b) => sortFn(a, b, sortDescriptor?.column, sortDescriptor?.direction)),
    }),
  });

  useEffect(() => list.reload(), [data]);

  const isEmpty = data.length === 0;

  return (
    <Styled.TableWrapper
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
            ((key: TableRowKey) => onRowAction(key, data.find((row) => getRowKey(row) === key)!))
          }
          numColumns={shownColumns.length}
          onViewMoreClick={
            enableViewMore && numRowsToShow < data.length
              ? () => setNumRowsToShow(data.length)
              : undefined
          }
          // shouldRowRender={shouldRowRender}
          hideHeader={hideHeader}
          withGradientCardRows={withGradientCardRows}
          withFocusStickyRows={withFocusStickyRows}
          withOuterBorder={withOuterBorder}
          withInnerBorders={withInnerBorders}
          withScrollSnapColumns={withScrollSnapColumns}
          withScrollSnapRows={withScrollSnapRows}
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

          <TableBody items={enableViewMore ? list.items.slice(0, numRowsToShow) : list.items}>
            {(item) => (
              <Row key={getRowKey(item)}>
                {(columnKey) => (
                  <Cell key={`${getRowKey(item)}-${columnKey}`}>
                    {columns.find((column) => column.columnKey === columnKey)?.renderCell?.(item)}
                  </Cell>
                )}
              </Row>
            )}
          </TableBody>
        </TableRoot>
      ) : (
        <Styled.Empty withOuterBorder={withOuterBorder}>{slotEmpty}</Styled.Empty>
      )}
    </Styled.TableWrapper>
  );
};

const TableRoot = <TableRowData extends object | CustomRowConfig, TableRowKey extends Key>(props: {
  'aria-label'?: string;
  sortDescriptor?: SortDescriptor;
  onSortChange?: (descriptor: SortDescriptor) => void;
  selectionMode: 'multiple' | 'single';
  selectionBehavior: 'replace' | 'toggle';
  selectedKeys: Set<TableRowKey>;
  setSelectedKeys: (selectedKeys: Set<TableRowKey>) => void;
  getRowAttributes?: (
    rowData: TableRowData,
    rowIndex?: number
  ) => Record<string, string | number | Record<string, string | number>>;
  onRowAction?: (key: TableRowKey) => void;
  // shouldRowRender?: (prevRowData: object, currentRowData: object) => boolean;
  children: CollectionChildren<TableRowData>;
  numColumns: number;
  onViewMoreClick?: () => void;

  hideHeader?: boolean;
  withGradientCardRows?: boolean;
  withFocusStickyRows?: boolean;
  withOuterBorder?: boolean;
  withInnerBorders?: boolean;
  withScrollSnapColumns?: boolean;
  withScrollSnapRows?: boolean;
}) => {
  const { selectionMode, selectionBehavior, numColumns, onViewMoreClick } = props;

  const state = useTableState<TableRowData>({
    ...props,
    showSelectionCheckboxes: selectionMode === 'multiple' && selectionBehavior !== 'replace',
  });

  const ref = React.useRef<HTMLTableElement>(null);
  const { collection } = state;
  const { gridProps } = useTable(
    {
      'aria-label': props['aria-label'],
      onRowAction: props.onRowAction as (key: Key) => void,
    },
    state,
    ref
  );

  return (
    <Styled.Table
      ref={ref}
      {...gridProps}
      hideHeader={props.hideHeader}
      withGradientCardRows={props.withGradientCardRows}
      withOuterBorder={props.withOuterBorder}
      withInnerBorders={props.withInnerBorders}
    >
      <TableHeadRowGroup
        hidden={props.hideHeader}
        withGradientCardRows={props.withGradientCardRows}
        withInnerBorders={props.withInnerBorders}
      >
        {collection.headerRows.map((headerRow) => (
          <TableHeaderRow
            key={headerRow.key}
            item={headerRow}
            state={state}
            withScrollSnapRows={props.withScrollSnapRows}
          >
            {/* {Array.from(collection.getChildren!(headerRow.key), (column) => */}
            {[...headerRow.childNodes].map(
              (column) => (
                // column.props.isSelectionCell ? (
                //   <TableSelectAllCell key={column.key} column={column} state={state} />
                // ) : (
                <TableColumnHeader
                  key={column.key}
                  column={column}
                  state={state}
                  withScrollSnapColumns={props.withScrollSnapColumns}
                />
              )
              // )
            )}
          </TableHeaderRow>
        ))}
      </TableHeadRowGroup>

      <TableBodyRowGroup
        withGradientCardRows={props.withGradientCardRows}
        withInnerBorders={props.withInnerBorders}
        withOuterBorder={props.withOuterBorder}
      >
        {/* {Array.from(collection.getChildren!(collection.body.key), (row) => */}
        {[...collection.body.childNodes].map((row) =>
          (row.value as CustomRowConfig)?.slotCustomRow ? (
            (row.value as CustomRowConfig).slotCustomRow({
              item: row,
              state,
              ...props.getRowAttributes?.(row.value!),
              withGradientCardRows: props.withGradientCardRows,
              withFocusStickyRows: props.withFocusStickyRows,
              withScrollSnapRows: props.withScrollSnapRows,
              children: null,
            })
          ) : (
            <TableRow
              key={row.key}
              item={row}
              state={state}
              // shouldRowRender={props.shouldRowRender}
              {...props.getRowAttributes?.(row.value)}
              withGradientCardRows={props.withGradientCardRows}
              withFocusStickyRows={props.withFocusStickyRows}
              withScrollSnapRows={props.withScrollSnapRows}
            >
              {/* {Array.from(collection.getChildren!(row.key), (cell) => */}
              {[...row.childNodes].map(
                (cell) => (
                  // cell.props.isSelectionCell ? (
                  //   <TableCheckboxCell key={cell.key} cell={cell} state={state} />
                  // ) : (
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
        {onViewMoreClick ? (
          <ViewMoreRow colSpan={numColumns} onClick={onViewMoreClick} />
        ) : undefined}
      </TableBodyRowGroup>
    </Styled.Table>
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
    <Styled.Thead
      {...rowGroupProps}
      hidden={hidden}
      withGradientCardRows={withGradientCardRows}
      withInnerBorders={withInnerBorders}
    >
      {children}
    </Styled.Thead>
  );
};

const TableBodyRowGroup = ({
  children,
  withGradientCardRows,
  withInnerBorders,
  withOuterBorder,
}: { children: React.ReactNode } & StyleProps) => {
  const { rowGroupProps } = useTableRowGroup();

  return (
    <Styled.Tbody
      {...rowGroupProps}
      withGradientCardRows={withGradientCardRows}
      withInnerBorders={withInnerBorders}
      withOuterBorder={withOuterBorder}
    >
      {children}
    </Styled.Tbody>
  );
};

const TableHeaderRow = <TableRowData extends object>({
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
    <Styled.Tr ref={ref} {...rowProps} withScrollSnapRows={withScrollSnapRows}>
      {children}
    </Styled.Tr>
  );
};

const TableColumnHeader = <TableRowData extends object>({
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
  const { isFocusVisible, focusProps } = useFocusRing();

  return (
    <Styled.Th
      {...mergeProps(columnHeaderProps, focusProps)}
      colSpan={column.props.colspan}
      // data-focused={isFocusVisible || undefined}
      style={{ width: column.props?.width }}
      ref={ref}
      withScrollSnapColumns={withScrollSnapColumns}
    >
      <Styled.Row>
        {column.rendered}
        {column.props.allowsSorting && (
          <Styled.SortArrow
            aria-hidden="true"
            sortDirection={
              state.sortDescriptor?.column === column.key && state.sortDescriptor?.direction
            }
          >
            <Icon iconName={IconName.Triangle} aria-hidden="true" />
          </Styled.SortArrow>
        )}
      </Styled.Row>
    </Styled.Th>
  );
};

export const ViewMoreRow = ({ colSpan, onClick }: { colSpan: number; onClick: () => void }) => {
  const stringGetter = useStringGetter();
  return (
    <Styled.Tr key="viewmore">
      <Styled.Td
        colSpan={colSpan}
        onMouseDown={(e: MouseEvent) => e.preventDefault()}
        onPointerDown={(e: MouseEvent) => e.preventDefault()}
      >
        <Styled.ViewMoreButton slotRight={<CaretIcon />} onClick={onClick}>
          {stringGetter({ key: STRING_KEYS.VIEW_MORE })}
        </Styled.ViewMoreButton>
      </Styled.Td>
    </Styled.Tr>
  );
};

export const TableRow = <TableRowData extends object>({
  item,
  children,
  state,
  // shouldRowRender,
  withGradientCardRows,
  withFocusStickyRows,
  withScrollSnapRows,
  ...attrs
}: {
  item: TableCollection<TableRowData>['rows'][number];
  children: React.ReactNode;
  state: TableState<TableRowData>;
  // shouldRowRender?: (prevRowData: TableRowData, currentRowData: TableRowData) => boolean;
  withGradientCardRows?: boolean;
  withFocusStickyRows?: boolean;
  withScrollSnapRows?: boolean;
}) => {
  const ref = React.useRef<HTMLTableRowElement>(null);
  const selectionManager = state.selectionManager;
  const isSelected = selectionManager.isSelected(item.key);
  const isClickable = selectionManager.selectionBehavior === 'toggle';

  const { rowProps, isPressed } = useTableRow(
    {
      node: item,
    },
    state,
    ref
  );

  const { isFocusVisible, focusProps } = useFocusRing();

  return (
    <Styled.Tr
      ref={ref}
      data-selected={isSelected}
      // data-focused={isFocusVisible || undefined}
      $data-isPressed={isPressed}
      {...mergeProps(rowProps, focusProps)}
      {...attrs}
      withGradientCardRows={withGradientCardRows}
      withFocusStickyRows={withFocusStickyRows}
      withScrollSnapRows={withScrollSnapRows}
      isClickable={isClickable}
    >
      {children}
    </Styled.Tr>
  );
};

// const TableRowMemo = React.memo(
//   TableRow,
//   (a, b) => !!b.shouldRowRender?.(a.item.value, b.item.value)
// );

const TableCell = <TableRowData extends object>({
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
  const { isFocusVisible, focusProps } = useFocusRing();

  return (
    <Styled.Td
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
    </Styled.Td>
  );
};

// const TableSelectAllCell = ({ column, state }) => {
//   const ref = React.useRef<HTMLTableHeaderCellElement>(null);
//   const isSingleSelectionMode = state.selectionManager.selectionMode === 'single';
//   const { columnHeaderProps } = useTableColumnHeader({ node: column }, state, ref);
//   const { checkboxProps } = useTableSelectAllCheckbox(state);

//   return (
//     <Styled.Th
//       {...columnHeaderProps}
//       ref={ref}
//     >
//       {state.selectionManager.selectionMode === 'single' ? (
//         <VisuallyHidden>{inputProps['aria-label']}</VisuallyHidden>
//       ) : (
//         <Checkbox {...checkboxProps} />
//       )}
//     </Styled.Th>
//   );
// };

// const TableCheckboxCell = ({ cell, state }: { cell; state }) => {
//   const ref = React.useRef<HTMLTableCellElement>(null);
//   const { gridCellProps } = useTableCell({ node: cell }, state, ref);
//   const { checkboxProps } = useTableSelectionCheckbox({ key: cell.parentKey }, state);

//   return (
//     <Styled.Td
//       {...gridCellProps}
//       ref={ref}
//     >
//       <Checkbox {...checkboxProps} />
//     </Styled.Td>
//   );
// };

const Styled: Record<string, AnyStyledComponent> = {};

Styled.TableWrapper = styled.div<{
  isEmpty: boolean;
  withGradientCardRows?: boolean;
  withOuterBorder: boolean;
}>`
  // Params
  --tableHeader-textColor: var(--color-text-0, inherit);
  --tableHeader-backgroundColor: inherit;
  --table-header-height: 2rem;

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

Styled.Empty = styled.div<{ withOuterBorder: boolean }>`
  ${layoutMixins.column}
  height: 100%;

  justify-items: center;
  align-content: center;
  padding: 4rem;
  gap: 0.75em;

  color: var(--color-text-0);
  font: var(--font-base-book);
`;

Styled.Table = styled.table<{
  hideHeader?: boolean;
  withGradientCardRows: boolean;
  withOuterBorder: boolean;
  withInnerBorders: boolean;
  withSolidHeader: boolean;
}>`
  align-self: start;

  ${layoutMixins.stickyArea1}
  --stickyArea1-background: var(--color-layer-2);
  --stickyArea1-topHeight: var(--table-header-height);
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

Styled.Tr = styled.tr<{
  isClickable?: boolean;
  withFocusStickyRows?: boolean;
  withScrollSnapRows: boolean;
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
        filter: brightness(1.1);
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

Styled.Th = styled.th<{ withScrollSnapColumns: boolean }>`
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

  white-space: nowrap;
  text-align: var(--table-cell-currentAlign);
`;

Styled.Td = styled.td`
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

Styled.SortArrow = styled.span<{ sortDirection: 'ascending' | 'descending' }>`
  float: right;
  margin-left: auto;

  display: inline-flex;
  transition: transform 0.3s var(--ease-out-expo), font-size 0.3s var(--ease-out-expo);

  font-size: 0.375em;

  ${Styled.Th}[aria-sort="none"] & {
    visibility: hidden;
  }

  ${Styled.Th}[aria-sort="ascending"] & {
    transform: scaleY(-1);
  }
`;

Styled.Thead = styled.thead<StyleProps>`
  ${layoutMixins.stickyHeader}
  scroll-snap-align: none;
  font: var(--font-mini-book);

  > * {
    height: var(--stickyArea-topHeight);
  }

  color: var(--tableHeader-textColor);
  background-color: var(--tableHeader-backgroundColor);

  ${({ withInnerBorders, withGradientCardRows }) =>
    withInnerBorders &&
    !withGradientCardRows &&
    css`
      ${layoutMixins.withInnerHorizontalBorders}
    `}
`;

Styled.Tbody = styled.tbody<StyleProps>`
  ${layoutMixins.stickyArea2}
  font: var(--font-small-book);

  // If <table> height is fixed with not enough rows to overflow, vertically center the rows
  &:before,
  &:after {
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

Styled.Row = styled.div`
  ${layoutMixins.inlineRow}
  padding: var(--tableCell-padding);
`;

Styled.ViewMoreButton = styled(Button)`
  --button-backgroundColor: var(--color-layer-2);
  --button-textColor: var(--color-text-1);

  width: 100%;

  svg {
    width: 0.675rem;
    margin-left: 0.5ch;
  }
`;
