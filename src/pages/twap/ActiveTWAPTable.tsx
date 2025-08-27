import { BonsaiCore } from '@/bonsai/ontology';
import { selectActiveTWAPOrders } from '@/bonsai/selectors/account';
import { OrderSideTag } from '@/components/OrderSideTag';
import { Table, type BaseTableRowData, type ColumnDef } from '@/components/Table';
import { PageSize } from '@/components/Table/TablePaginationRow';
import { TagSize } from '@/components/Tag';
import { orEmptyRecord } from '@/lib/typeUtils';
import { MarketTypeFilter } from '@/pages/trade/types';
import { useAppSelector } from '@/state/appTypes';
import { tradeViewMixins } from '@/styles/tradeViewMixins';
import { IndexerOrderSide } from '@/types/indexer/indexerApiGen';
import type { ColumnSize } from '@react-types/table';
import { forwardRef } from 'react';
import styled from 'styled-components';

type ActiveTWAPOrder = BaseTableRowData & {
  uniqueId: string;
  market: string;
  side: IndexerOrderSide;
  quantity: number;
  price: number;
  status: 'Active' | 'Filled' | 'Cancelled';
  reduceOnly: boolean;
  orderTime: string;
  runtime: string;
  // Additional fields for proper rendering
  totalFilled?: string;
  size?: string;
  createdAtMilliseconds?: number;
  duration?: string;
};

export enum ActiveTWAPTableColumnKey {
    Market = 'Market',
    Side = 'Side',
    Execution = 'Executed / Total Size',
    AveragePrice = 'Average Price',
    Runtime = "Runtime / Total",
    ReduceOnly = 'Reduce Only',
    OrderTime = 'Order Time',
    Terminate = '',
  }

type ElementProps = {
    columnKeys: ActiveTWAPTableColumnKey[];
    columnWidths?: Partial<Record<ActiveTWAPTableColumnKey, ColumnSize>>;
    currentRoute?: string;
    currentMarket?: string;
    marketTypeFilter?: MarketTypeFilter;
    showClosePositionAction: boolean;
    initialPageSize?: PageSize;
    onNavigate?: () => void;
    navigateToOrders: (market: string) => void;
};

const getActiveTWAPTableColumnDef = ({
  key,
  width,
}: {
  key: ActiveTWAPTableColumnKey;
  width?: ColumnSize;
}): ColumnDef<ActiveTWAPOrder> => ({
  width,
  ...(
    {
      [ActiveTWAPTableColumnKey.Market]: {
        columnKey: 'market',
        getCellValue: (row) => row.market,
        label: 'Market',
        allowsSorting: true,
        renderCell: ({ market }) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
            <span>{market}</span>
          </div>
        ),
      },
      [ActiveTWAPTableColumnKey.Side]: {
        columnKey: 'side',
        getCellValue: (row) => row.side,
        label: 'Side',
        allowsSorting: true,
        renderCell: ({ side }) => side && <OrderSideTag orderSide={side} size={TagSize.Medium} />,
      },
      [ActiveTWAPTableColumnKey.Execution]: {
        columnKey: 'execution',
        getCellValue: (row) => row.quantity,
        label: 'Executed / Total Size',
        allowsSorting: true,
        renderCell: (row) => (
          <span>{row.totalFilled} / {row.size}</span>
        ),
      },
      [ActiveTWAPTableColumnKey.AveragePrice]: {
        columnKey: 'averagePrice',
        getCellValue: (row) => row.price,
        label: 'Average Price',
        allowsSorting: true,
        renderCell: ({ price }) => (
          <span>{price}</span>
        ),
      },
      [ActiveTWAPTableColumnKey.Runtime]: {
        columnKey: 'runtime',
        label: 'Runtime / Total',
        allowsSorting: false,
        renderCell: ({ runtime }) => (
          <span>{runtime}</span>
        ),
      },
      [ActiveTWAPTableColumnKey.ReduceOnly]: {
        columnKey: 'reduceOnly',
        label: 'Reduce Only',
        allowsSorting: false,
        renderCell: ({ reduceOnly }) => (
          <span>{reduceOnly ? 'Yes' : 'No'}</span>
        ),
      },
      [ActiveTWAPTableColumnKey.OrderTime]: {
        columnKey: 'orderTime',
        label: 'Order Time',
        allowsSorting: false,
        renderCell: ({ orderTime }) => (
          <span>{orderTime}</span>
        ),
      },
      [ActiveTWAPTableColumnKey.Terminate]: {
        columnKey: 'terminate',
        label: '',
        allowsSorting: false,
        isActionable: true,
        renderCell: ({ status }) => (
          status === 'Active' ? (
            <button style={{ color: 'var(--color-negative)' }}>
             Terminate
            </button>
          ) : null
        ),
      },
    } satisfies Record<ActiveTWAPTableColumnKey, ColumnDef<ActiveTWAPOrder>>
  )[key],
});



export const ActiveTWAPTable = forwardRef(
    (
        {
            columnKeys,
            columnWidths,
            initialPageSize,
        }: ElementProps,
        _ref
    ) => {
        const activeTWAPOrders = useAppSelector(selectActiveTWAPOrders);
        const marketSummaries = orEmptyRecord(useAppSelector(BonsaiCore.markets.markets.data));
        
        const formatExecutionDisplay = (totalFilled: string, size: string) => {
            return `${totalFilled} / ${size}`;
        };
        
        const formatRuntimeDisplay = (createdAtMilliseconds: number | undefined, duration: string | undefined) => {
            if (!createdAtMilliseconds || !duration) return 'N/A';
            
            const now = Date.now();
            const elapsed = now - createdAtMilliseconds;
            const elapsedSeconds = Math.floor(elapsed / 1000);
            const durationSeconds = parseInt(duration, 10) || 0;
            
            return `${elapsedSeconds}s / ${durationSeconds}s`;
        };
        
        const twapOrdersData: ActiveTWAPOrder[] = activeTWAPOrders.map((order) => ({
            uniqueId: order.id,
            market: marketSummaries[order.marketId]?.displayableTicker || order.displayId,
            side: order.side,
            quantity: parseFloat(order.totalFilled?.toString() || '0'), // For sorting by execution amount
            price: parseFloat(order.price.toString()),
            status: 'Active', // All active TWAP orders are active
            reduceOnly: order.reduceOnly,
            orderTime: new Date(order.createdAtHeight || 0).toLocaleString(),
            runtime: formatRuntimeDisplay(order.updatedAtMilliseconds, order.duration),
            // Store original values for column rendering
            totalFilled: order.totalFilled?.toString() || '0',
            size: order.size.toString(),
            createdAtMilliseconds: order.updatedAtMilliseconds,
            duration: order.duration,
        }));
        return (
            <$Table
                key={'active-twap-positions'}
                label="Active TWAP Orders"
                columns={columnKeys.map((key) => getActiveTWAPTableColumnDef({ key }))}
                data={twapOrdersData}
                tableId="active-twap-table"
                getRowKey={(row) => row?.uniqueId}
                slotEmpty={<div>No active TWAP orders</div>}
                initialPageSize={initialPageSize}
                withInnerBorders
                withScrollSnapColumns
                withScrollSnapRows
                withFocusStickyRows
            />
        )
    }
)

const $Table = styled(Table)`
  ${tradeViewMixins.horizontalTable}
` as typeof Table;